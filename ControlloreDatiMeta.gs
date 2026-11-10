/**
 * ===============================================================================
 * CONTROLLORE DI DATI ANTI-BAN META & GATEKEEPER TELEGRAM (Google Apps Script)
 * Immobiliare Giancani — Modulo di Controllo Unico + WebApp Dashboard (doGet)
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
 * Funzione WebApp: serve la pagina Dashboard.html quando apri il link dal browser
 * Se nel progetto hai già un doGet(e) in Codice.gs, inserisci all'inizio del tuo doGet(e):
 * if (!e || !e.parameter || !e.parameter.page || e.parameter.page === 'dashboard') { return renderDashboardWeb(); }
 */
function renderDashboardWeb() {
  inizializzaFoglioInterazioni();
  return HtmlService.createTemplateFromFile('Dashboard')
    .evaluate()
    .setTitle('📊 Controllore Anti-Ban Meta & Analytics | Immobiliare Giancani')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Crea automaticamente il foglio 'DB_Interazioni' se non esiste
 */
function inizializzaFoglioInterazioni() {
  try {
    var ss = SpreadsheetApp.openById(GATEKEEPER_CONFIG.LOG_SHEET_ID);
    var foglio = ss.getSheetByName('DB_Interazioni');
    if (!foglio) {
      foglio = ss.insertSheet('DB_Interazioni');
      foglio.appendRow(['Timestamp', 'Canale', 'Tipo_Azione', 'Titolo/Anteprima', 'Stato', 'Conteggio_Oggi', 'Esito_Limite']);
      foglio.getRange('A1:G1').setFontWeight('bold').setBackground('#1e293b').setFontColor('#ffffff');
      foglio.setFrozenRows(1);
    }
    return foglio;
  } catch (err) {
    Logger.log('Errore inizializzaFoglioInterazioni: ' + err.message);
    return null;
  }
}

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
  var stato = "🛑 Bloccato dal supervisore";
  
  // 1. Registra nel database 'DB_Interazioni'
  salvaInterazioneDB(canale, tipoAzione, titolo, stato, conteggioOggi, esitoLimite);
  
  // 2. Prepara il testo formattato per Telegram
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
         
  var webAppUrl = "https://script.google.com/macros/s/AKfycbzq3gfy5JCZJT1tyF4oECkBFVrckxVzqDuAJgUSvPhU4rv2Bztj7EUT3m4b5ILm4Vdc/exec?page=dashboard";
  try {
    if (ScriptApp.getService().getUrl()) {
      webAppUrl = ScriptApp.getService().getUrl() + "?page=dashboard";
    }
  } catch(e) {}
  
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
    var foglio = inizializzaFoglioInterazioni();
    if (!foglio) return;
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
    var foglio = inizializzaFoglioInterazioni();
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
 * Funzione chiamata da Dashboard.html (tramite google.script.run.ottieniDatiDashboard())
 * Restituisce KPI, medie (7gg, 4 settimane, mensile), istogrammi e ultime 20 attività.
 */
function ottieniDatiDashboard() {
  var foglio = inizializzaFoglioInterazioni();
  var adesso = new Date();
  var oggiStr = Utilities.formatDate(adesso, 'Europe/Rome', 'yyyy-MM-dd');
  var limiti = GATEKEEPER_CONFIG.SOGLIE;
  var conteggioOggi = { Telegram: 0, Facebook: 0, Instagram: 0, WhatsApp: 0 };
  var setteGiorniFa = new Date(adesso.getTime() - (7 * 24 * 60 * 60 * 1000));
  var ventottoGiorniFa = new Date(adesso.getTime() - (28 * 24 * 60 * 60 * 1000));
  var trentaGiorniFa = new Date(adesso.getTime() - (30 * 24 * 60 * 60 * 1000));

  var totUltimi7gg = 0, totUltime4Sett = 0, totUltimoMese = 0;
  var giorniSettimana = [0, 0, 0, 0, 0, 0, 0];
  var mesiAnno = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var righe = [];

  if (foglio && foglio.getLastRow() > 1) {
    var values = foglio.getRange(2, 1, foglio.getLastRow() - 1, 7).getValues();
    for (var i = 0; i < values.length; i++) {
      var r = values[i];
      var tsRaw = r[0];
      var canale = String(r[1] || 'Telegram').trim();
      var tipoAzione = String(r[2] || 'Post');
      var titolo = String(r[3] || '-');
      var stato = String(r[4] || '✅ Sicuro');
      var cntOggi = Number(r[5] || 1);
      var esitoLim = String(r[6] || '✅ SOTTO SOGLIA');

      var dataObj = (tsRaw instanceof Date) ? tsRaw : new Date(String(tsRaw).replace(' ', 'T'));
      if (isNaN(dataObj.getTime())) dataObj = adesso;

      var dataFormattata = Utilities.formatDate(dataObj, 'Europe/Rome', 'yyyy-MM-dd');
      var oraFormattata = Utilities.formatDate(dataObj, 'Europe/Rome', 'dd/MM/yyyy HH:mm');

      var chKey = 'Telegram';
      if (/facebook|^fb$/i.test(canale)) chKey = 'Facebook';
      else if (/instagram|^ig$/i.test(canale)) chKey = 'Instagram';
      else if (/whatsapp|^wa$/i.test(canale)) chKey = 'WhatsApp';

      if (dataFormattata === oggiStr) conteggioOggi[chKey] = (conteggioOggi[chKey] || 0) + 1;
      if (dataObj >= setteGiorniFa) totUltimi7gg++;
      if (dataObj >= ventottoGiorniFa) totUltime4Sett++;
      if (dataObj >= trentaGiorniFa) totUltimoMese++;

      var jsDay = dataObj.getDay();
      var idxGiorno = (jsDay === 0) ? 6 : (jsDay - 1);
      giorniSettimana[idxGiorno]++;
      mesiAnno[dataObj.getMonth()]++;

      righe.push({
        timestamp: oraFormattata,
        canale: chKey,
        tipoAzione: tipoAzione,
        titolo: titolo,
        stato: stato,
        conteggioOggi: cntOggi,
        esitoLimite: esitoLim
      });
    }
  }

  var ultime20 = righe.reverse().slice(0, 20);
  return {
    aggiornatoAlle: Utilities.formatDate(adesso, 'Europe/Rome', 'dd/MM/yyyy HH:mm:ss'),
    limiti: limiti,
    conteggioOggi: conteggioOggi,
    medie: {
      giornaliera7gg: (totUltimi7gg / 7).toFixed(1),
      settimanale4Sett: (totUltime4Sett / 4).toFixed(1),
      mensile: totUltimoMese,
      totale7gg: totUltimi7gg,
      totale4Sett: totUltime4Sett
    },
    grafici: {
      giorniLabels: ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'],
      giorniValori: giorniSettimana,
      mesiLabels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
      mesiValori: mesiAnno
    },
    ultime20: ultime20,
    totaleStorico: righe.length
  };
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
