/**
 * ===============================================================================
 * CONTROLLORE DI DATI ANTI-BAN META & GATEKEEPER TELEGRAM (Google Apps Script)
 * Immobiliare Giancani — Modulo di Controllo Unico
 * ===============================================================================
 * Intercetta tutte le chiamate prima che tocchino le API di Meta (Facebook, Instagram, WhatsApp).
 * Verifica le soglie massime giornaliere anti-ban.
 * Registra ogni richiesta nel foglio 'DB_Interazioni'.
 * Inoltra il post a Telegram per verifica visiva con tastiera inline.
 * ===============================================================================
 */

var GATEKEEPER_CONFIG = {
  TELEGRAM_BOT_TOKEN: '9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0',
  ANTONIO_CHAT_ID:    '1723292483',
  LOG_SHEET_ID:       '1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g',
  
  // SOGLIE DI SICUREZZA ANTI-BAN
  SOGLIE: {
    Telegram:  50,
    Facebook:  5,
    Instagram: 5,
    WhatsApp:  10
  }
};

/**
 * Funzione principale del Controllore Dati.
 * Sostituisce qualsiasi invio diretto a Meta con controllo preventivo e deviazione su Telegram.
 */
function controllaEIntercettaMeta(canale, tipoAzione, titolo, testo, prezzo, vani) {
  Logger.log("🛡️ [CONTROLLORE META] Intercettata richiesta per: " + canale + " | Azione: " + tipoAzione);
  
  var soglia = GATEKEEPER_CONFIG.SOGLIE[canale] || 5;
  var conteggioOggi = ottieniConteggioOggi(canale) + 1;
  var sottoSoglia = conteggioOggi <= soglia;
  var esitoLimite = sottoSoglia ? ("✅ SOTTO SOGLIA (" + conteggioOggi + "/" + soglia + ")") : ("🛑 LIMITE SUPERATO (" + conteggioOggi + "/" + soglia + ")");
  var stato = "🛑 Bloccato dal supervisore (In attesa approvazione Telegram)";
  
  // 1. Registra nel database 'DB_Interazioni'
  salvaInterazioneDB(canale, tipoAzione, titolo, stato, conteggioOggi, esitoLimite);
  
  // 2. Prepara il testo formattato
  var msg = "🛡️ *[CONTROLLORE DATI ANTI-BAN META]*\n" +
            "━━━━━━━━━━━━━━━━━━━━\n" +
            "📡 *Canale Destinazione:* `" + canale + "`\n" +
            "⚙️ *Azione:* `" + tipoAzione + "`\n" +
            "📊 *Soglia di Sicurezza:* " + esitoLimite + "\n" +
            "🚦 *Stato:* `" + stato + "`\n" +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "🏠 *" + titolo + "*\n";
  if (prezzo) msg += "💰 *Prezzo:* " + prezzo + "\n";
  if (vani) msg += "📐 *Dettagli:* " + vani + "\n";
  msg += "\n📝 *Anteprima Contenuto:*\n" + testo + "\n\n" +
         "⚠️ *Chiamata API Meta Graph BLOCCATA preventivamente.*";
         
  var webAppUrl = ScriptApp.getService().getUrl() ? ScriptApp.getService().getUrl() + "?page=dashboard" : "https://script.google.com";
  
  var tastiera = [
    [
      { text: "✅ Approva Pubblicazione", callback_data: "APPROVA_" + canale },
      { text: "🛑 Blocca", callback_data: "BLOCCA_" + canale }
    ],
    [
      { text: "📊 Apri Dashboard", url: webAppUrl }
    ]
  ];
  
  // 3. Invia ad Antonio su Telegram
  inviaMessaggioTelegramControllore(msg, tastiera);
  
  return {
    success: true,
    metaBloccato: true,
    inoltratoTelegram: true,
    stato: stato,
    esitoLimite: esitoLimite
  };
}

/**
 * Salva riga in 'DB_Interazioni'
 */
function salvaInterazioneDB(canale, tipoAzione, titolo, stato, conteggioOggi, esitoLimite) {
  try {
    var ss = SpreadsheetApp.openById(GATEKEEPER_CONFIG.LOG_SHEET_ID);
    var foglio = ss.getSheetByName('DB_Interazioni');
    if (!foglio) {
      foglio = ss.insertSheet('DB_Interazioni');
      foglio.appendRow(['Timestamp', 'Canale', 'Tipo_Azione', 'Titolo/Anteprima', 'Stato', 'Conteggio_Oggi', 'Esito_Limite']);
    }
    var now = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd HH:mm:ss');
    foglio.appendRow([now, canale, tipoAzione, titolo, stato, conteggioOggi, esitoLimite]);
  } catch (e) {
    Logger.log("⚠️ Errore salvataggio DB_Interazioni: " + e.message);
  }
}

/**
 * Calcola il conteggio delle interazioni odierne per canale
 */
function ottieniConteggioOggi(canale) {
  try {
    var ss = SpreadsheetApp.openById(GATEKEEPER_CONFIG.LOG_SHEET_ID);
    var foglio = ss.getSheetByName('DB_Interazioni');
    if (!foglio) return 0;
    var data = foglio.getDataRange().getValues();
    if (data.length <= 1) return 0;
    var oggiStr = Utilities.formatDate(new Date(), 'Europe/Rome', 'yyyy-MM-dd');
    var count = 0;
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var d = row[0];
      var dStr = (d instanceof Date) ? Utilities.formatDate(d, 'Europe/Rome', 'yyyy-MM-dd') : String(d).substring(0, 10);
      if (dStr === oggiStr && String(row[1]).toLowerCase() === String(canale).toLowerCase()) {
        count++;
      }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

/**
 * Invia al bot Telegram con bottoni
 */
function inviaMessaggioTelegramControllore(testo, inlineKeyboard) {
  var url = "https://api.telegram.org/bot" + GATEKEEPER_CONFIG.TELEGRAM_BOT_TOKEN + "/sendMessage";
  var payload = {
    chat_id: GATEKEEPER_CONFIG.ANTONIO_CHAT_ID,
    text: testo,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: inlineKeyboard
    }
  };
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
