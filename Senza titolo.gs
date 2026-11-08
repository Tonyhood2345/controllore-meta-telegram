// ==========================================

// ============================================================
// 🔄 AUTO-RINNOVO TOKEN META — Immobiliare Giancani / DarIA
// Versione: 2.0 | Integrato con sistema pubblicazione social
// ============================================================
// ISTRUZIONI SETUP (esegui nell'ordine):
//
//  STEP 1 → Inserisci META_APP_ID e META_APP_SECRET qui sotto
//            (da Meta for Developers → La tua App → Impostazioni → Di base)
//
//  STEP 2 → Esegui "inizializzaTokenMeta()" UNA SOLA VOLTA
//            per salvare il token attuale nelle Script Properties
//
//  STEP 3 → Esegui "installaTriggerRinnovoToken()" UNA SOLA VOLTA
//            per attivare il rinnovo automatico il 1° di ogni mese
//
//  STEP 4 → Ovunque nel progetto usi getTokenMetaAttivo(),
//            sostituiscilo con getTokenMetaAttivo()
// ============================================================




// ════════════════════════════════════════════════════════════
// 🔧 STEP 2 — INIZIALIZZAZIONE (esegui UNA SOLA VOLTA)
// Salva il token attuale di getTokenMetaAttivo() nelle Properties
// ════════════════════════════════════════════════════════════
function inizializzaTokenMeta() {
  var tokenAttuale = getTokenMetaAttivo();
  if (!tokenAttuale || tokenAttuale.length < 20) {
    Logger.log('❌ Errore: getTokenMetaAttivo() è vuoto o non valido. Aggiornalo prima in Config.gs');
    return;
  }
  PropertiesService.getScriptProperties().setProperty('FB_TOKEN_ATTIVO', tokenAttuale);
  Logger.log('✅ Token iniziale salvato nelle Script Properties.');
  Logger.log('Token salvato (prime 25 cifre): ' + tokenAttuale.substring(0, 25) + '...');
  Logger.log('ℹ️  Da ora usa getTokenMetaAttivo() al posto di getTokenMetaAttivo()');
}


// ════════════════════════════════════════════════════════════
// 🔑 FUNZIONE PRINCIPALE — Legge il token più aggiornato
// Usa questa funzione OVUNQUE al posto di CgetTokenMetaAttivo()
// ════════════════════════════════════════════════════════════
function getTokenMetaAttivo() {
  try {
    var tokenDaProps = PropertiesService.getScriptProperties().getProperty('FB_TOKEN_ATTIVO');
    if (tokenDaProps && tokenDaProps.length > 20) {
      return tokenDaProps;
    }
  } catch(e) {
    Logger.log('⚠️ Errore lettura Properties, uso getTokenMetaAttivo() come fallback: ' + e);
  }
  // Fallback al CONFIG statico se le Properties non sono ancora inizializzate
  return getTokenMetaAttivo();
}


// ════════════════════════════════════════════════════════════
// 🔄 RINNOVO AUTOMATICO — Schedulato dal trigger mensile
// Non eseguire manualmente (si attiva automaticamente)
// ════════════════════════════════════════════════════════════
function rinnovaTokenMetaAutomatico() {
  // ⛔ KILL SWITCH META: Blocco preventivo trigger a tempo
  Logger.log("⛔ [KILL SWITCH META] rinnovaTokenMetaAutomatico bloccata preventivamente.");
  return;
  var props        = PropertiesService.getScriptProperties();
  var tokenCorrente = props.getProperty('FB_TOKEN_ATTIVO') || getTokenMetaAttivo();

  if (!tokenCorrente || tokenCorrente.length < 20) {
    try { inviaTelegramBoss('⚠️ *AUTO-RINNOVO TOKEN META FALLITO*\nNessun token trovato. Esegui inizializzaTokenMeta() manualmente.'); } catch(e) {}
    Logger.log('❌ Nessun token trovato per il rinnovo.');
    return;
  }

  if (!META_APP_ID || META_APP_ID === 'INSERISCI_QUI_IL_TUO_APP_ID') {
    try { inviaTelegramBoss('⚠️ *RINNOVO TOKEN META BLOCCATO*\nMETA_APP_ID non configurato nel file TokenAutoRinnovo.gs!'); } catch(e) {}
    Logger.log('❌ META_APP_ID non configurato!');
    return;
  }

  // Costruisce la URL per scambiare il token (short/expired → long-lived)
  var urlRinnovo = 'https://graph.facebook.com/oauth/access_token' +
    '?grant_type=fb_exchange_token' +
    '&client_id='         + META_APP_ID +
    '&client_secret='     + META_APP_SECRET +
    '&fb_exchange_token=' + encodeURIComponent(tokenCorrente);

  try {
    var risposta      = UrlFetchApp.fetch(urlRinnovo, { muteHttpExceptions: true });
    var codice        = risposta.getResponseCode();
    var testoRisp     = risposta.getContentText();
    var datiRisposta  = JSON.parse(testoRisp);

    if (codice === 200 && datiRisposta.access_token) {
      var nuovoToken    = datiRisposta.access_token;
      var scadenzaGiorni = Math.round((datiRisposta.expires_in || 5184000) / 86400);

      // ✅ Salva il nuovo token nelle Properties (subito disponibile a tutto il sistema)
      props.setProperty('FB_TOKEN_ATTIVO', nuovoToken);
      props.setProperty('FB_TOKEN_RINNOVATO_IL', new Date().toLocaleDateString('it-IT'));
      props.setProperty('FB_TOKEN_SCADE_TRA_GIORNI', String(scadenzaGiorni));

      Logger.log('✅ Token rinnovato! Scade tra: ' + scadenzaGiorni + ' giorni');

      // 📲 Notifica Telegram al Boss
      try {
        inviaTelegramBoss(
          '✅ *TOKEN META RINNOVATO AUTOMATICAMENTE!*\n\n' +
          '📅 Valido per altri *' + scadenzaGiorni + ' giorni*\n' +
          '🗓️ Prossimo rinnovo: *1° del mese prossimo*\n' +
          '🔐 Token (prime 20 cifre): `' + nuovoToken.substring(0, 20) + '...`\n\n' +
          '✅ Già attivo nel sistema — nessuna azione richiesta!\n\n' +
          '⚠️ *Facoltativo:* Aggiorna anche Config.gs → FB_TOKEN\n' +
          '```\n' + nuovoToken + '\n```\n\n' +
          '— *Antonio Giancani*'
        );
      } catch(eNotif) { Logger.log('Errore notifica Telegram: ' + eNotif); }

      return nuovoToken;

    } else {
      // ❌ Errore dall'API Meta
      var messaggioErrore = datiRisposta.error ? datiRisposta.error.message : testoRisp;

      Logger.log('❌ Errore rinnovo token. Codice: ' + codice + ' — ' + messaggioErrore);

      try {
        inviaTelegramBoss(
          '❌ *ERRORE RINNOVO TOKEN META!*\n\n' +
          '📍 Codice: ' + codice + '\n' +
          '💬 Errore: ' + messaggioErrore + '\n\n' +
          '👉 *Azione richiesta:*\n' +
          'Vai su https://developers.facebook.com/tools/explorer/\n' +
          'e genera + salva manualmente un nuovo token.\n\n' +
          '— *Antonio Giancani*'
        );
      } catch(eNotif) {}
    }

  } catch(e) {
    Logger.log('❌ Eccezione rinnovo token: ' + e.toString());
    try {
      inviaTelegramBoss(
        '💥 *CRASH RINNOVO TOKEN META*\n' + e.toString() +
        '\n\n👉 Rinnova il token manualmente su developers.facebook.com'
      );
    } catch(eNotif) {}
  }
}


// ════════════════════════════════════════════════════════════
// 🛡️ VERIFICA TOKEN PRIMA DELLA PUBBLICAZIONE
// Chiama questa funzione prima di postare su Instagram/Facebook
// Restituisce: { valido: true/false, token: "...", giorni: N }
// ════════════════════════════════════════════════════════════
function verificaTokenPrimaDellaPublicazione() {
  var token = getTokenMetaAttivo();

  try {
    var url  = 'https://graph.facebook.com/debug_token' +
               '?input_token=' + token +
               '&access_token=' + META_APP_ID + '|' + META_APP_SECRET;
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var dati = JSON.parse(resp.getContentText());

    if (resp.getResponseCode() === 200 && dati.data) {
      var isValid     = dati.data.is_valid || false;
      var expiresAt   = dati.data.expires_at || 0;
      var giorniRimasti = expiresAt > 0
        ? Math.round((expiresAt * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
        : 999; // token senza scadenza = Page token permanente

      Logger.log('Token valido: ' + isValid + ' | Giorni rimasti: ' + giorniRimasti);

      // ⚠️ Avviso se mancano meno di 10 giorni alla scadenza
      if (isValid && giorniRimasti < 10 && giorniRimasti >= 0) {
        try {
          inviaTelegramBoss(
            '⚠️ *TOKEN META IN SCADENZA!*\n\n' +
            'Il token Facebook/Instagram scade tra soli *' + giorniRimasti + ' giorni*.\n\n' +
            '🔄 Tentativo di rinnovo automatico in corso...'
          );
        } catch(e) {}
        // Tenta rinnovo preventivo
        rinnovaTokenMetaAutomatico();
      }

      return { valido: isValid, token: token, giorni: giorniRimasti };
    }
  } catch(e) {
    Logger.log('⚠️ Verifica token fallita, procedo con il token disponibile: ' + e);
  }

  // In caso di errore nella verifica, restituisce il token disponibile comunque
  return { valido: true, token: token, giorni: -1 };
}


// ════════════════════════════════════════════════════════════
// 📸 WRAPPER SICURO — Pubblica su Instagram con token dinamico
// Sostituisce le chiamate dirette all'API IG nel progetto
// ════════════════════════════════════════════════════════════
function pubblicaSuInstagramSicuro(igUserId, captionTesto, urlMedia, tipoMedia) {
  // ⛔ META BLOCCATO: Pubblicazione post Instagram bloccata, inviato su Telegram
  Logger.log("⛔ [BLOCCO META] pubblicaSuInstagramSicuro intercettata e bloccata.");
  
  // Registrazione nel foglio DB_Interazioni
  var anteprimaIg = String(captionTesto || '').substring(0, 80);
  registraInterazioneDB('Instagram', (tipoMedia || 'Post / Reel'), anteprimaIg, '🛑 Bloccato dal supervisore');

  var urlDashboardIg = ScriptApp.getService().getUrl() + "?page=dashboard";
  var msgIg = "📸 <b>[POST INSTAGRAM INTERCETTATO — CONVOGLIATO SU TELEGRAM]</b>\n\n" +
              (urlMedia ? "🖼️ <b>Media:</b> " + urlMedia + "\n\n" : "") +
              "📝 <b>Caption:</b>\n" + captionTesto + "\n\n" +
              "🛡️ <i>Blocco Meta attivo per salvaguardia account. Nessuna chiamata effettuata a Meta Graph API.</i>";
  
  inviaTelegramBossConBottone(msgIg, "📊 Apri Dashboard", urlDashboardIg);
  return { success: true, blocked: true, redirected_to: 'Telegram' };
  
  var tokenCheck = verificaTokenPrimaDellaPublicazione();
  var token = tokenCheck.token;
  tipoMedia = tipoMedia || 'IMAGE';

  try {
    // Step 1: Crea il container media
    var payloadContainer = {
      caption:     captionTesto,
      access_token: token
    };
    if (tipoMedia === 'VIDEO' || tipoMedia === 'REELS') {
      payloadContainer.media_type = 'REELS';
      payloadContainer.video_url  = urlMedia;
      payloadContainer.share_to_feed = 'true';
    } else {
      payloadContainer.image_url = urlMedia;
    }

    var rispostaContainer = UrlFetchApp.fetch(
      'https://graph.facebook.com/v18.0/' + igUserId + '/media',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payloadContainer),
        muteHttpExceptions: true
      }
    );
    var datiContainer = JSON.parse(rispostaContainer.getContentText());

    if (!datiContainer.id) {
      Logger.log('❌ Errore creazione container IG: ' + rispostaContainer.getContentText());
      return { successo: false, errore: datiContainer.error ? datiContainer.error.message : 'Errore sconosciuto' };
    }

    var containerId = datiContainer.id;

    // Step 2: Pubblica il container
    var rispostaPubblica = UrlFetchApp.fetch(
      'https://graph.facebook.com/v18.0/' + igUserId + '/media_publish',
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ creation_id: containerId, access_token: token }),
        muteHttpExceptions: true
      }
    );
    var datiPubblica = JSON.parse(rispostaPubblica.getContentText());

    if (datiPubblica.id) {
      Logger.log('✅ Pubblicato su Instagram! ID post: ' + datiPubblica.id);
      return { successo: true, postId: datiPubblica.id };
    } else {
      Logger.log('❌ Errore pubblicazione IG: ' + rispostaPubblica.getContentText());
      return { successo: false, errore: datiPubblica.error ? datiPubblica.error.message : 'Errore pubblicazione' };
    }

  } catch(e) {
    Logger.log('❌ Eccezione pubblicazione IG: ' + e.toString());
    return { successo: false, errore: e.toString() };
  }
}


// ════════════════════════════════════════════════════════════
// 📘 WRAPPER SICURO — Pubblica su Facebook con token dinamico
// Sostituisce le chiamate dirette all'API FB nel progetto
// ════════════════════════════════════════════════════════════
function pubblicaSuFacebookSicuro(pageId, testoPost, urlFoto) {
  // ⛔ META BLOCCATO: Pubblicazione post Facebook bloccata, inviato su Telegram
  Logger.log("⛔ [BLOCCO META] pubblicaSuFacebookSicuro intercettata e bloccata.");
  
  // Registrazione nel foglio DB_Interazioni
  var anteprimaFb = String(testoPost || '').substring(0, 80);
  registraInterazioneDB('Facebook', (urlFoto ? 'Post Foto' : 'Post Feed'), anteprimaFb, '🛑 Bloccato dal supervisore');

  var urlDashboardFb = ScriptApp.getService().getUrl() + "?page=dashboard";
  var msgFb = "📘 <b>[POST FACEBOOK INTERCETTATO — CONVOGLIATO SU TELEGRAM]</b>\n\n" +
              (urlFoto ? "🖼️ <b>Foto:</b> " + urlFoto + "\n\n" : "") +
              "📝 <b>Testo:</b>\n" + testoPost + "\n\n" +
              "🛡️ <i>Blocco Meta attivo per salvaguardia account. Nessuna chiamata effettuata a Meta Graph API.</i>";
  
  inviaTelegramBossConBottone(msgFb, "📊 Apri Dashboard", urlDashboardFb);
  return { success: true, blocked: true, redirected_to: 'Telegram' };
  
  var tokenCheck = verificaTokenPrimaDellaPublicazione();
  var token = tokenCheck.token;

  try {
    var payload = { message: testoPost, access_token: token };
    var endpoint;

    if (urlFoto) {
      endpoint = 'https://graph.facebook.com/v18.0/' + pageId + '/photos';
      payload.url = urlFoto;
    } else {
      endpoint = 'https://graph.facebook.com/v18.0/' + pageId + '/feed';
    }

    var risposta = UrlFetchApp.fetch(endpoint, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    var dati = JSON.parse(risposta.getContentText());

    if (dati.id || dati.post_id) {
      Logger.log('✅ Pubblicato su Facebook! ID: ' + (dati.id || dati.post_id));
      return { successo: true, postId: dati.id || dati.post_id };
    } else {
      Logger.log('❌ Errore pubblicazione FB: ' + risposta.getContentText());
      return { successo: false, errore: dati.error ? dati.error.message : 'Errore sconosciuto' };
    }

  } catch(e) {
    Logger.log('❌ Eccezione pubblicazione FB: ' + e.toString());
    return { successo: false, errore: e.toString() };
  }
}


// ════════════════════════════════════════════════════════════
// 🧪 TEST DIAGNOSTICO TOKEN (esegui manualmente per controllare)
// ════════════════════════════════════════════════════════════
function testTokenMeta() {
  // ⛔ KILL SWITCH META
  Logger.log("⛔ [KILL SWITCH META] testTokenMeta disattivato.");
  return;
  var token = getTokenMetaAttivo();
  Logger.log('Token in uso (prime 25 cifre): ' + token.substring(0, 25) + '...');

  var url = 'https://graph.facebook.com/me?access_token=' + token + '&fields=id,name';

  try {
    var risposta = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var dati     = JSON.parse(risposta.getContentText());

    if (risposta.getResponseCode() === 200 && dati.id) {
      Logger.log('✅ TOKEN VALIDO! Account: ' + dati.name + ' (ID: ' + dati.id + ')');
      try { inviaTelegramBoss('✅ *Token Meta VALIDO*\nAccount collegato: ' + dati.name); } catch(e) {}
    } else {
      Logger.log('❌ TOKEN NON VALIDO: ' + risposta.getContentText());
      try {
        inviaTelegramBoss(
          '❌ *TOKEN META SCADUTO O NON VALIDO!*\n\n' +
          'Errore: ' + (dati.error ? dati.error.message : 'Risposta non valida') + '\n\n' +
          '🔧 *Azione:* Vai su https://developers.facebook.com/tools/explorer/\n' +
          'e genera un nuovo token, poi esegui inizializzaTokenMeta().\n\n' +
          '— *Antonio Giancani*'
        );
      } catch(e) {}
    }
  } catch(e) {
    Logger.log('❌ Eccezione test token: ' + e.toString());
  }
}


// ════════════════════════════════════════════════════════════
// 📅 INSTALLA TRIGGER AUTOMATICO (esegui UNA SOLA VOLTA)
// ════════════════════════════════════════════════════════════
function installaTriggerRinnovoToken() {
  // Rimuove eventuali trigger precedenti con lo stesso nome
  ScriptApp.getProjectTriggers().forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'rinnovaTokenMetaAutomatico') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('🗑️ Trigger precedente rimosso.');
    }
  });

  // Installa il nuovo trigger mensile (il 1° di ogni mese alle 8:00)
  ScriptApp.newTrigger('rinnovaTokenMetaAutomatico')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .create();

  Logger.log('✅ Trigger installato! rinnovaTokenMetaAutomatico si attiverà il 1° di ogni mese alle 8:00');

  try {
    inviaTelegramBoss(
      '✅ *Sistema Auto-Rinnovo Token Meta Attivato!*\n\n' +
      '📅 Il token si rinnoverà automaticamente il *1° di ogni mese* alle 8:00.\n' +
      '🔔 Riceverai una notifica Telegram ad ogni rinnovo.\n\n' +
      '— *Antonio Giancani*'
    );
  } catch(e) {}
}

// ══════════════════════════════════════════════════════════════
// 🛡️ UTILITY RIMOZIONE TRIGGER META AUTOMATICA
// ══════════════════════════════════════════════════════════════
function rimuoviTuttiITriggerMeta() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerNomiMeta = [
    'rinnovaTokenMetaAutomatico',
    'importaPostFacebook',
    'importaTuttiIPost',
    'aggiornaStoriaSnapshotLiveOgni30Minuti',
    'triggerAutomaticoNotaFacebook',
    'eseguiArchiviazionePostFacebookDopoDiretta'
  ];
  let rimossi = 0;
  for (let i = 0; i < triggers.length; i++) {
    let fn = triggers[i].getHandlerFunction();
    if (triggerNomiMeta.includes(fn)) {
      ScriptApp.deleteTrigger(triggers[i]);
      rimossi++;
      Logger.log("✅ Rimosso trigger per funzione: " + fn);
    }
  }
  Logger.log("Totale trigger Meta rimossi: " + rimossi);
  if (typeof inviaTelegramBoss === 'function') {
    inviaTelegramBoss("🛡️ [SICUREZZA] Rimossi " + rimossi + " trigger a tempo collegati a Meta da Apps Script.");
  }
  return rimossi;
}


// ==============================================================================
// ── 📊 DASHBOARD WEB APP, ANALYTICS & DATABASE INTERAZIONI (DB_Interazioni) ────
// ==============================================================================

/**
 * Inizializza o recupera il foglio 'DB_Interazioni' nel file Sheets associato.
 * Se non esiste, lo crea con le intestazioni richieste formattate.
 */
function inizializzaFoglioInterazioni() {
  const ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
  let sheet = ss.getSheetByName('DB_Interazioni');
  
  if (!sheet) {
    sheet = ss.insertSheet('DB_Interazioni');
    const headers = [
      'Timestamp',
      'Canale',
      'Tipo_Azione',
      'Titolo/Anteprima',
      'Stato',
      'Conteggio_Oggi',
      'Esito_Limite'
    ];
    sheet.appendRow(headers);
    
    // Formattazione riga d'intestazione
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1E293B');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    
    Logger.log("✅ Foglio 'DB_Interazioni' creato con successo.");
  }
  return sheet;
}

/**
 * Registra un'interazione nel foglio 'DB_Interazioni' calcolando il conteggio odierno
 * per canale e la verifica rispetto alle soglie di sicurezza anti-blocco Meta.
 * 
 * @param {string} canale 'Telegram', 'Facebook', 'Instagram', 'WhatsApp'
 * @param {string} tipoAzione es. 'Pubblicazione Post', 'Notifica Approvata', 'Storia/Reel'
 * @param {string} titolo Titolo o anteprima contenuto
 * @param {string} stato '✅ Sicuro', '⏳ In attesa', '🛑 Bloccato dal supervisore'
 */
function registraInterazioneDB(canale, tipoAzione, titolo, stato) {
  try {
    const sheet = inizializzaFoglioInterazioni();
    const now = new Date();
    canale = canale || 'Telegram';
    tipoAzione = tipoAzione || 'Interazione Automatica';
    titolo = titolo || '-';
    stato = stato || '✅ Sicuro';

    // Soglie di sicurezza anti-ban
    const soglie = {
      'Telegram': 50,
      'Facebook': 5,
      'Instagram': 5,
      'WhatsApp': 10
    };
    const maxSoglia = soglie[canale] || 20;

    // Conteggio interazioni di oggi per questo canale
    const dati = sheet.getDataRange().getValues();
    let conteggioOggi = 0;
    const inizioOggi = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const fineOggi = inizioOggi + (24 * 60 * 60 * 1000);

    for (let i = 1; i < dati.length; i++) {
      let rigaData = dati[i][0];
      let rigaCanale = dati[i][1];
      if (rigaData && rigaCanale) {
        let t = new Date(rigaData).getTime();
        if (t >= inizioOggi && t < fineOggi && String(rigaCanale).toLowerCase() === String(canale).toLowerCase()) {
          conteggioOggi++;
        }
      }
    }
    conteggioOggi += 1; // inclusa l'interazione corrente

    const esitoLimite = conteggioOggi <= maxSoglia
      ? "✅ SOTTO SOGLIA (" + conteggioOggi + "/" + maxSoglia + ")"
      : "⚠️ LIMITE SUPERATO (" + conteggioOggi + "/" + maxSoglia + ")";

    sheet.appendRow([
      now,
      canale,
      tipoAzione,
      titolo,
      stato,
      conteggioOggi,
      esitoLimite
    ]);

    Logger.log("✅ Interazione registrata in DB_Interazioni: " + canale + " | " + stato + " | " + esitoLimite);
    return {
      success: true,
      canale: canale,
      conteggioOggi: conteggioOggi,
      esitoLimite: esitoLimite
    };
  } catch (err) {
    Logger.log("⚠️ Errore registrazione interazione DB: " + err.toString());
    return { success: false, error: err.toString() };
  }
}

/**
 * Restituisce tutti i dati aggregati, KPI e registro recenti per la Dashboard HTML.
 * Invocata asincronamente via google.script.run.ottieniDatiDashboard()
 */
function ottieniDatiDashboard() {
  try {
    const sheet = inizializzaFoglioInterazioni();
    const dati = sheet.getDataRange().getValues();
    const now = new Date();
    const oggiInizio = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const unGiornoMs = 24 * 60 * 60 * 1000;

    // 1. Canali Oggi vs Soglia
    let conteggiOggi = {
      telegram: 0,
      facebook: 0,
      instagram: 0,
      whatsapp: 0
    };

    // 2. Medie Temporali
    let count7gg = 0;
    let count4sett = 0;
    let countMese = 0;

    // 3. Grafico Distribuzione per Giorno della Settimana (Lun -> Dom)
    let giorniSettimana = [0, 0, 0, 0, 0, 0, 0]; // 0: Lun, 1: Mar, 2: Mer, 3: Gio, 4: Ven, 5: Sab, 6: Dom

    // 4. Grafico Distribuzione per Mese (0: Gen, 11: Dic)
    let mesiAnno = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    // 5. Registro ultimi eventi
    let eventiTutti = [];

    const soglie = {
      telegram: 50,
      facebook: 5,
      instagram: 5,
      whatsapp: 10
    };

    // Scorrimento righe (dalla riga 1 in poi)
    for (let i = 1; i < dati.length; i++) {
      let rawData = dati[i][0];
      let canale = String(dati[i][1] || '').trim();
      let tipoAzione = String(dati[i][2] || '').trim();
      let titolo = String(dati[i][3] || '').trim();
      let stato = String(dati[i][4] || '').trim();
      let progOggi = dati[i][5] || 1;
      let esito = String(dati[i][6] || '').trim();

      if (!rawData) continue;
      let d = new Date(rawData);
      let t = d.getTime();

      // Conteggio Oggi
      if (t >= oggiInizio && t < oggiInizio + unGiornoMs) {
        let ch = canale.toLowerCase();
        if (ch.includes('telegram')) conteggiOggi.telegram++;
        else if (ch.includes('facebook')) conteggiOggi.facebook++;
        else if (ch.includes('instagram')) conteggiOggi.instagram++;
        else if (ch.includes('whatsapp')) conteggiOggi.whatsapp++;
      }

      // Conteggio Ultimi 7 giorni
      if (now.getTime() - t <= 7 * unGiornoMs) {
        count7gg++;
      }

      // Conteggio Ultime 4 settimane (28 giorni)
      if (now.getTime() - t <= 28 * unGiornoMs) {
        count4sett++;
      }

      // Conteggio Mese Corrente
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        countMese++;
      }

      // Giorno della settimana (JavaScript: 0=Dom, 1=Lun, ..., 6=Sab)
      let dayJs = d.getDay();
      let dayIdx = (dayJs === 0) ? 6 : dayJs - 1; // 0=Lun ... 6=Dom
      giorniSettimana[dayIdx]++;

      // Mese dell'anno
      if (d.getFullYear() === now.getFullYear()) {
        mesiAnno[d.getMonth()]++;
      }

      // Memorizza per tabella recenti
      eventiTutti.push({
        timestamp: Utilities.formatDate(d, 'Europe/Rome', 'dd/MM/yyyy HH:mm'),
        canale: canale,
        tipoAzione: tipoAzione,
        titolo: titolo,
        stato: stato,
        conteggioOggi: progOggi,
        esitoLimite: esito,
        timeRaw: t
      });
    }

    // Ordina eventi decrescente per orario
    eventiTutti.sort((a, b) => b.timeRaw - a.timeRaw);
    const recenti = eventiTutti.slice(0, 20);

    // Calcolo percentuali
    const pctTg = Math.round((conteggiOggi.telegram / soglie.telegram) * 100);
    const pctFb = Math.round((conteggiOggi.facebook / soglie.facebook) * 100);
    const pctIg = Math.round((conteggiOggi.instagram / soglie.instagram) * 100);
    const pctWa = Math.round((conteggiOggi.whatsapp / soglie.whatsapp) * 100);

    // Risultato per il client
    return {
      kpi: {
        oggi: {
          telegram: { count: conteggiOggi.telegram, limit: soglie.telegram, percent: pctTg },
          facebook: { count: conteggiOggi.facebook, limit: soglie.facebook, percent: pctFb },
          instagram: { count: conteggiOggi.instagram, limit: soglie.instagram, percent: pctIg },
          whatsapp: { count: conteggiOggi.whatsapp, limit: soglie.whatsapp, percent: pctWa }
        },
        mediaGiornaliera7gg: (count7gg / 7).toFixed(1),
        mediaSettimanale4sett: (count4sett / 4).toFixed(1),
        mediaMensile: countMese,
        totaleInterazioni: Math.max(0, dati.length - 1)
      },
      graficoCanali: {
        labels: ["Telegram", "Facebook (Meta)", "Instagram (Meta)", "WhatsApp"],
        reale: [conteggiOggi.telegram, conteggiOggi.facebook, conteggiOggi.instagram, conteggiOggi.whatsapp],
        soglia: [soglie.telegram, soglie.facebook, soglie.instagram, soglie.whatsapp]
      },
      graficoGiorniSettimana: {
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
        valori: giorniSettimana
      },
      graficoMesi: {
        labels: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
        valori: mesiAnno
      },
      recenti: recenti,
      ultimoAggiornamento: Utilities.formatDate(now, 'Europe/Rome', 'HH:mm:ss')
    };
  } catch (err) {
    Logger.log("⚠️ Errore ottieniDatiDashboard: " + err.toString());
    return null;
  }
}

/**
 * Rendering WebApp Dashboard servita tramite doGet
 */
function renderDashboardWeb() {
  const tpl = HtmlService.createTemplateFromFile('Dashboard');
  tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
  return tpl.evaluate()
    .setTitle('Dashboard Analytics & Monitoraggio Canali — Antonio Giancani')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

/**
 * Invia un messaggio Telegram a una chat specifica con un pulsante inline URL.
 */
function inviaTelegramConBottone(chatId, testo, testoBottone, urlBottone) {
  if (!CONFIG.TELEGRAM_TOKEN) return;
  const url = 'https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/sendMessage';
  const payload = {
    chat_id: chatId,
    text: testo,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: testoBottone,
            url: urlBottone
          }
        ]
      ]
    }
  };
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch(e) {
    Logger.log("⚠️ Errore inviaTelegramConBottone: " + e.toString());
  }
}

/**
 * Invia un messaggio Telegram al Boss con pulsante inline URL (es. Apri Dashboard).
 */
function inviaTelegramBossConBottone(testo, testoBottone, urlBottone) {
  inviaTelegramConBottone(CONFIG.TELEGRAM_CHAT_ID, testo, testoBottone, urlBottone);
}

/**
 * Notifica per contenuto approvato con pulsante inline "📊 Apri Dashboard"
 * Registra inoltre l'evento nel foglio 'DB_Interazioni'.
 */
function notificaContenutoApprovatoConDashboard(titolo, canale, tipoAzione) {
  canale = canale || 'Telegram';
  tipoAzione = tipoAzione || 'Contenuto Approvato';
  
  // 1. Registra nel foglio DB_Interazioni
  registraInterazioneDB(canale, tipoAzione, titolo, '✅ Sicuro');

  // 2. URL dinamico WebApp
  const urlWebApp = ScriptApp.getService().getUrl() + "?page=dashboard";

  // 3. Invia notifica Telegram con pulsante inline
  const messaggio = "<b>✅ CONTENUTO APPROVATO & REGISTRATO</b>\n\n" +
                    "📌 <b>Titolo:</b> " + titolo + "\n" +
                    "📡 <b>Canale:</b> " + canale + "\n" +
                    "📂 <b>Tipo:</b> " + tipoAzione + "\n" +
                    "⏰ <b>Orario:</b> " + Utilities.formatDate(new Date(), "Europe/Rome", "dd/MM/yyyy HH:mm") + "\n\n" +
                    "L'interazione è stata registrata su <code>DB_Interazioni</code> ed è sotto la soglia di sicurezza.";

  inviaTelegramBossConBottone(messaggio, "📊 Apri Dashboard", urlWebApp);
}

// ==========================================
// // FILE: Dashboard.html
// ==========================================
<!DOCTYPE html>
<html lang="it" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Dashboard Analytics & Canali — Immobiliare Giancani</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdf4',
              500: '#10b981',
              600: '#059669',
              700: '#047857',
              gold: '#d97706',
              dark: '#0f172a',
              card: '#1e293b',
              border: '#334155'
            }
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    body {
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
    }
    .custom-scrollbar::-webkit-scrollbar {
      height: 6px;
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #0f172a;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 9999px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #475569;
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col antialiased selection:bg-emerald-500 selection:text-white">

  <!-- TOP HEADER & BRANDING -->
  <header class="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
      
      <!-- Brand & Title -->
      <div class="flex items-center space-x-3.5">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-xl tracking-tighter">
          G
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold tracking-widest text-amber-500 uppercase">Immobiliare Giancani</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span> Live Monitor
            </span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
              🛡️ Meta Kill-Switch ON
            </span>
          </div>
          <h1 class="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
            Dashboard Analytics & Monitoraggio Canali
          </h1>
        </div>
      </div>

      <!-- Action Button & Sync Status -->
      <div class="flex items-center space-x-3">
        <div class="hidden sm:flex flex-col text-right">
          <span class="text-[11px] text-slate-400">Ultimo aggiornamento:</span>
          <span id="label-ultimo-aggiornamento" class="text-xs font-semibold text-slate-200">In caricamento...</span>
        </div>

        <button id="btn-aggiorna" onclick="aggiornaDatiManuale()" class="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 active:scale-95 transition-all text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <svg id="icon-refresh" class="w-4 h-4 mr-1.5 text-emerald-400 transition-transform duration-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          <span id="txt-aggiorna">Aggiorna Dati</span>
        </button>
      </div>

    </div>
  </header>

  <!-- MAIN CONTAINER -->
  <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

    <!-- BANNER STATO PROTEZIONE -->
    <div class="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        </div>
        <div>
          <h2 class="text-sm font-bold text-white flex items-center gap-2">
            Archiviazione Database Attiva su Foglio Google: <span class="font-mono text-emerald-400">DB_Interazioni</span>
          </h2>
          <p class="text-xs text-slate-400 mt-0.5">
            Ogni post o notifica è archiviato in tempo reale. I canali Meta sono convogliati su Telegram con blocco chiamate attivo.
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-2 shrink-0">
        <span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          Telegram Bot: <strong class="text-emerald-400">Attivo</strong>
        </span>
        <span class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
          Meta Graph API: <strong class="text-rose-400">Neutralizzata</strong>
        </span>
      </div>
    </div>

    <!-- SEZIONE 1: 4 CANALI - POST OGGI VS LIMITE MASSIMO -->
    <div>
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
          </svg>
          Attività Oggi vs Soglia Massima di Sicurezza (4 Canali)
        </h3>
        <span class="text-xs text-slate-500">Reset automatico a mezzanotte</span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <!-- CARD TELEGRAM -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-xl group-hover:bg-sky-500/10 transition-all pointer-events-none"></div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                ✈️
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-tight">Telegram</h4>
                <p class="text-[10px] text-slate-400">Canale Principale & Bot</p>
              </div>
            </div>
            <span id="badge-tg-stato" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sicuro
            </span>
          </div>

          <div class="flex items-baseline justify-between mb-1.5">
            <span class="text-2xl font-extrabold text-white" id="val-tg-oggi">0</span>
            <span class="text-xs font-medium text-slate-400">/ <span id="lim-tg-max">50</span> max</span>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div id="bar-tg" class="bg-sky-500 h-2 rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Utilizzo odierno</span>
            <span id="pct-tg" class="font-bold text-sky-400">0%</span>
          </div>
        </div>

        <!-- CARD FACEBOOK -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 rounded-full blur-xl group-hover:bg-blue-600/10 transition-all pointer-events-none"></div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-600/20 flex items-center justify-center text-blue-400 font-bold">
                📘
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-tight">Facebook Page</h4>
                <p class="text-[10px] text-slate-400">Meta Graph API</p>
              </div>
            </div>
            <span id="badge-fb-stato" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Blocco Meta
            </span>
          </div>

          <div class="flex items-baseline justify-between mb-1.5">
            <span class="text-2xl font-extrabold text-white" id="val-fb-oggi">0</span>
            <span class="text-xs font-medium text-slate-400">/ <span id="lim-fb-max">5</span> max</span>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div id="bar-fb" class="bg-blue-500 h-2 rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Soglia Anti-Blocco</span>
            <span id="pct-fb" class="font-bold text-blue-400">0%</span>
          </div>
        </div>

        <!-- CARD INSTAGRAM -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-xl group-hover:bg-fuchsia-500/10 transition-all pointer-events-none"></div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 font-bold">
                📸
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-tight">Instagram</h4>
                <p class="text-[10px] text-slate-400">Reels & Post Feed</p>
              </div>
            </div>
            <span id="badge-ig-stato" class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Blocco Meta
            </span>
          </div>

          <div class="flex items-baseline justify-between mb-1.5">
            <span class="text-2xl font-extrabold text-white" id="val-ig-oggi">0</span>
            <span class="text-xs font-medium text-slate-400">/ <span id="lim-ig-max">5</span> max</span>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div id="bar-ig" class="bg-gradient-to-r from-amber-500 to-fuchsia-500 h-2 rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Soglia Anti-Blocco</span>
            <span id="pct-ig" class="font-bold text-fuchsia-400">0%</span>
          </div>
        </div>

        <!-- CARD WHATSAPP -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition-all relative overflow-hidden group">
          <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl group-hover:bg-emerald-500/10 transition-all pointer-events-none"></div>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-2.5">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                💬
              </div>
              <div>
                <h4 class="text-xs font-bold text-white uppercase tracking-tight">WhatsApp</h4>
                <p class="text-[10px] text-slate-400">Cloud API & Diretti</p>
              </div>
            </div>
            <span id="badge-wa-stato" class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Sicuro
            </span>
          </div>

          <div class="flex items-baseline justify-between mb-1.5">
            <span class="text-2xl font-extrabold text-white" id="val-wa-oggi">0</span>
            <span class="text-xs font-medium text-slate-400">/ <span id="lim-wa-max">10</span> max</span>
          </div>

          <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
            <div id="bar-wa" class="bg-emerald-500 h-2 rounded-full transition-all duration-700" style="width: 0%"></div>
          </div>

          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Utilizzo odierno</span>
            <span id="pct-wa" class="font-bold text-emerald-400">0%</span>
          </div>
        </div>

      </div>
    </div>

    <!-- SEZIONE 2: KPI MEDIE TEMPORALI (7gg, 4sett, mese) -->
    <div>
      <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        Medie Statistiche di Pubblicazione & Interazione
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <!-- CARD MEDIA GIORNALIERA (7 GG) -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-400">Media Giornaliera</p>
            <h4 class="text-xs font-semibold text-slate-500 mb-1">(Ultimi 7 giorni)</h4>
            <div class="flex items-baseline space-x-2">
              <span id="kpi-media-giornaliera" class="text-3xl font-extrabold text-white">0.0</span>
              <span class="text-xs text-slate-400 font-medium">post / giorno</span>
            </div>
            <span class="inline-flex items-center text-[11px] font-semibold text-emerald-400 mt-2">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              Ritmo costante e sicuro
            </span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xl">
            📅
          </div>
        </div>

        <!-- CARD MEDIA SETTIMANALE (4 SETT) -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-400">Media Settimanale</p>
            <h4 class="text-xs font-semibold text-slate-500 mb-1">(Ultime 4 settimane)</h4>
            <div class="flex items-baseline space-x-2">
              <span id="kpi-media-settimanale" class="text-3xl font-extrabold text-white">0.0</span>
              <span class="text-xs text-slate-400 font-medium">post / settimana</span>
            </div>
            <span class="inline-flex items-center text-[11px] font-semibold text-sky-400 mt-2">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
              Copertura multi-settimana
            </span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold text-xl">
            📊
          </div>
        </div>

        <!-- CARD MEDIA MENSILE -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-xs font-medium text-slate-400">Media Mensile</p>
            <h4 class="text-xs font-semibold text-slate-500 mb-1">(Volume mensile stimato)</h4>
            <div class="flex items-baseline space-x-2">
              <span id="kpi-media-mensile" class="text-3xl font-extrabold text-white">0</span>
              <span class="text-xs text-slate-400 font-medium">interazioni / mese</span>
            </div>
            <span class="inline-flex items-center text-[11px] font-semibold text-purple-400 mt-2">
              <svg class="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Zero rischi di shadowban
            </span>
          </div>
          <div class="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xl">
            📈
          </div>
        </div>

      </div>
    </div>

    <!-- SEZIONE 3: GRAFICI A ISTOGRAMMA (CHART.JS) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <!-- GRAFICO 1: ATTIVITÀ REALE VS SOGLIA DI SICUREZZA META -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-white">Attività Reale vs Soglia di Sicurezza</h3>
            <p class="text-xs text-slate-400 mt-0.5">Confronto per canale: volume odierno vs limite consentito</p>
          </div>
          <span class="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Istogramma a barre affiancate
          </span>
        </div>

        <div class="relative w-full h-64 sm:h-72">
          <canvas id="chart-canali"></canvas>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-around text-xs text-slate-400">
          <div class="flex items-center space-x-1.5">
            <span class="w-3 h-3 rounded bg-emerald-500 inline-block"></span>
            <span>Attività Reale Registrata</span>
          </div>
          <div class="flex items-center space-x-1.5">
            <span class="w-3 h-3 rounded bg-rose-500 inline-block"></span>
            <span>Soglia Massima di Sicurezza</span>
          </div>
        </div>
      </div>

      <!-- GRAFICO 2: VOLUME TEMPORALE PER GIORNO E PER MESE -->
      <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-sm font-bold text-white">Distribuzione Temporale</h3>
            <p class="text-xs text-slate-400 mt-0.5">Volume di pubblicazioni e interazioni nel tempo</p>
          </div>
          
          <!-- TAB SWITCH: GIORNO SETTIMANA / MESE -->
          <div class="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 text-xs font-semibold">
            <button id="btn-tab-giorni" onclick="mostraGraficoTemporale('giorni')" class="px-3 py-1 rounded-md bg-emerald-600 text-white shadow-sm transition-all">
              Settimana
            </button>
            <button id="btn-tab-mesi" onclick="mostraGraficoTemporale('mesi')" class="px-3 py-1 rounded-md text-slate-400 hover:text-white transition-all">
              Mese
            </button>
          </div>
        </div>

        <div class="relative w-full h-64 sm:h-72">
          <canvas id="chart-temporale"></canvas>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span id="desc-grafico-temporale">Volume aggregato per giorno della settimana (Lun - Dom)</span>
          <span class="text-emerald-400 font-semibold" id="val-totale-periodo">Interazioni Totali</span>
        </div>
      </div>

    </div>

    <!-- SEZIONE 4: REGISTRO ATTIVITÀ RECENTI (TABELLA INTERATTIVA) -->
    <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      
      <!-- Table Header & Controls -->
      <div class="p-5 border-b border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div class="flex items-center space-x-2">
            <h3 class="text-sm font-bold text-white">Registro Attività Recenti</h3>
            <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Ultimi 20 Eventi
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Dati registrati dal vivo nel foglio Google <code class="text-emerald-400 font-mono">DB_Interazioni</code>
          </p>
        </div>

        <!-- Filters & Search -->
        <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <!-- Search input -->
          <div class="relative flex-1 sm:w-56">
            <input id="input-ricerca-tabella" oninput="filtraTabella()" type="text" placeholder="Cerca titolo o azione..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <svg class="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>

          <!-- Channel Filter Dropdown -->
          <select id="select-filtro-canale" onchange="filtraTabella()" class="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500">
            <option value="ALL">Tutti i canali</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook">Facebook</option>
            <option value="Instagram">Instagram</option>
            <option value="WhatsApp">WhatsApp</option>
          </select>
        </div>
      </div>

      <!-- Responsive Table -->
      <div class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
              <th class="py-3 px-4">Data & Ora</th>
              <th class="py-3 px-4">Canale</th>
              <th class="py-3 px-4">Tipo Azione</th>
              <th class="py-3 px-4">Titolo / Anteprima</th>
              <th class="py-3 px-4">Stato Supervisione</th>
              <th class="py-3 px-4 text-center">Prog. Oggi</th>
              <th class="py-3 px-4">Esito Soglia</th>
            </tr>
          </thead>
          <tbody id="tbody-recenti" class="divide-y divide-slate-800/60 font-medium">
            <!-- Dynamic Rows Injected Here -->
            <tr>
              <td colspan="7" class="py-8 text-center text-slate-400">
                <div class="inline-flex items-center space-x-2">
                  <svg class="w-4 h-4 animate-spin text-emerald-400" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  <span>Caricamento registro interazioni...</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer Table Info -->
      <div class="p-3.5 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
        <span id="info-conteggio-righe">Mostrati gli ultimi eventi registrati</span>
        <span class="text-slate-500">Immobiliare Giancani • Corso Vittorio Veneto 151, Favara (AG)</span>
      </div>

    </div>

  </main>

  <!-- FOOTER -->
  <footer class="border-t border-slate-800 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
    <div class="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
      <span>© 2026 <strong>Antonio Giancani</strong> — Sistema DarIA Omnichannel & Anti-Ban Security Engine</span>
      <div class="flex items-center space-x-3 text-slate-400 text-xs">
        <span>Telegram: <strong class="text-white">@GiancaniBot</strong></span>
        <span>•</span>
        <span>Google Apps Script WebApp</span>
      </div>
    </div>
  </footer>

  <!-- SCRIPT LOGIC -->
  <script>
    // Global Data Cache & Charts
    let datiGlobali = null;
    let chartCanaliInstance = null;
    let chartTemporaleInstance = null;
    let vistaTemporaleCorrente = 'giorni';

    // Initial default fallback data (allows immediate preview if Apps Script backend is not connected)
    const datiFallback = {
      kpi: {
        oggi: {
          telegram: { count: 8, limit: 50, percent: 16 },
          facebook: { count: 0, limit: 5, percent: 0, intercettati: 2 },
          instagram: { count: 0, limit: 5, percent: 0, intercettati: 1 },
          whatsapp: { count: 3, limit: 10, percent: 30 }
        },
        mediaGiornaliera7gg: 6.4,
        mediaSettimanale4sett: 44.8,
        mediaMensile: 192,
        totaleInterazioni: 320
      },
      graficoCanali: {
        labels: ["Telegram", "Facebook (Meta)", "Instagram (Meta)", "WhatsApp"],
        reale: [8, 0, 0, 3],
        soglia: [50, 5, 5, 10]
      },
      graficoGiorniSettimana: {
        labels: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
        valori: [12, 15, 10, 18, 14, 8, 5]
      },
      graficoMesi: {
        labels: ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"],
        valori: [140, 165, 180, 210, 195, 230, 215, 180, 225, 240, 192, 0]
      },
      recenti: [
        {
          timestamp: "08/11/2026 20:30",
          canale: "WhatsApp",
          tipoAzione: "Richiesta Preventivo",
          titolo: "Calcolo Imposta Registro Seconda Casa",
          stato: "✅ Sicuro",
          conteggioOggi: 3,
          esitoLimite: "✅ SOTTO SOGLIA (3/10)"
        },
        {
          timestamp: "08/11/2026 19:45",
          canale: "Telegram",
          tipoAzione: "Pubblicazione Annuncio",
          titolo: "Appartamento con Terrazzo Vista Valle",
          stato: "✅ Sicuro",
          conteggioOggi: 6,
          esitoLimite: "✅ SOTTO SOGLIA (6/50)"
        },
        {
          timestamp: "08/11/2026 19:00",
          canale: "Facebook",
          tipoAzione: "Tentativo Post Diretto",
          titolo: "Avviso Diretta Immobiliare Lunedì",
          stato: "🛑 Bloccato dal supervisore",
          conteggioOggi: 2,
          esitoLimite: "✅ SOTTO SOGLIA (2/5)"
        },
        {
          timestamp: "08/11/2026 18:15",
          canale: "Telegram",
          tipoAzione: "Pubblicazione Canale",
          titolo: "Aggiornamento Vetrina Digitale Serale",
          stato: "✅ Sicuro",
          conteggioOggi: 5,
          esitoLimite: "✅ SOTTO SOGLIA (5/50)"
        },
        {
          timestamp: "08/11/2026 17:30",
          canale: "Telegram",
          tipoAzione: "Ricezione Richiesta",
          titolo: "Richiesta Informazioni Mutuo 80%",
          stato: "✅ Sicuro",
          conteggioOggi: 4,
          esitoLimite: "✅ SOTTO SOGLIA (4/50)"
        },
        {
          timestamp: "08/11/2026 16:40",
          canale: "WhatsApp",
          tipoAzione: "Invio Documentazione",
          titolo: "Planimetria Catastale e Visura",
          stato: "✅ Sicuro",
          conteggioOggi: 2,
          esitoLimite: "✅ SOTTO SOGLIA (2/10)"
        },
        {
          timestamp: "08/11/2026 15:05",
          canale: "Telegram",
          tipoAzione: "Pubblicazione Annuncio",
          titolo: "Trilocale Luminoso Agrigento Bassa",
          stato: "✅ Sicuro",
          conteggioOggi: 3,
          esitoLimite: "✅ SOTTO SOGLIA (3/50)"
        },
        {
          timestamp: "08/11/2026 14:20",
          canale: "Instagram",
          tipoAzione: "Tentativo Pubblicazione Reel",
          titolo: "Tour Immersivo Appartamento Luxury",
          stato: "🛑 Bloccato dal supervisore",
          conteggioOggi: 1,
          esitoLimite: "✅ SOTTO SOGLIA (1/5)"
        },
        {
          timestamp: "08/11/2026 12:10",
          canale: "WhatsApp",
          tipoAzione: "Notifica Visita Concordata",
          titolo: "Promemoria Sopralluogo Sig. Rossi",
          stato: "✅ Sicuro",
          conteggioOggi: 1,
          esitoLimite: "✅ SOTTO SOGLIA (1/10)"
        },
        {
          timestamp: "08/11/2026 11:45",
          canale: "Facebook",
          tipoAzione: "Tentativo Pubblicazione Post",
          titolo: "Bilocale Ristrutturato Centro Storico",
          stato: "🛑 Bloccato dal supervisore",
          conteggioOggi: 1,
          esitoLimite: "✅ SOTTO SOGLIA (1/5)"
        },
        {
          timestamp: "08/11/2026 10:30",
          canale: "Telegram",
          tipoAzione: "Notifica Contenuto Approvato",
          titolo: "Villa Indipendente San Leone con Giardino",
          stato: "✅ Sicuro",
          conteggioOggi: 2,
          esitoLimite: "✅ SOTTO SOGLIA (2/50)"
        },
        {
          timestamp: "08/11/2026 09:15",
          canale: "Telegram",
          tipoAzione: "Pubblicazione Annuncio",
          titolo: "Attico Panoramico Via Roma Favara 140k",
          stato: "✅ Sicuro",
          conteggioOggi: 1,
          esitoLimite: "✅ SOTTO SOGLIA (1/50)"
        }
      ],
      ultimoAggiornamento: new Date().toLocaleTimeString('it-IT')
    };

    // Load Data Entry Point
    function caricaDati() {
      impostaStatoCaricamento(true);

      // Check if google.script.run is available (inside Google Apps Script WebApp)
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(dati) {
            impostaStatoCaricamento(false);
            if (dati && typeof dati === 'object') {
              renderizzaDashboard(dati);
            } else {
              renderizzaDashboard(datiFallback);
            }
          })
          .withFailureHandler(function(err) {
            impostaStatoCaricamento(false);
            console.error("Errore Apps Script ottieniDatiDashboard:", err);
            renderizzaDashboard(datiFallback);
          })
          .ottieniDatiDashboard();
      } else {
        // Fallback for direct browser preview
        setTimeout(function() {
          impostaStatoCaricamento(false);
          renderizzaDashboard(datiFallback);
        }, 350);
      }
    }

    // UI Loading Indicator
    function impostaStatoCaricamento(isCaricamento) {
      const icon = document.getElementById('icon-refresh');
      const txt = document.getElementById('txt-aggiorna');
      const btn = document.getElementById('btn-aggiorna');

      if (isCaricamento) {
        icon.classList.add('animate-spin');
        txt.textContent = 'Caricamento...';
        btn.disabled = true;
      } else {
        icon.classList.remove('animate-spin');
        txt.textContent = 'Aggiorna Dati';
        btn.disabled = false;
      }
    }

    function aggiornaDatiManuale() {
      caricaDati();
    }

    // Render Dashboard Function
    function renderizzaDashboard(dati) {
      datiGlobali = dati;

      // 1. Ultimo Aggiornamento
      document.getElementById('label-ultimo-aggiornamento').textContent = dati.ultimoAggiornamento || new Date().toLocaleTimeString('it-IT');

      // 2. Canali Oggi vs Limite
      const tg = dati.kpi.oggi.telegram;
      document.getElementById('val-tg-oggi').textContent = tg.count;
      document.getElementById('lim-tg-max').textContent = tg.limit;
      document.getElementById('bar-tg').style.width = Math.min(100, tg.percent) + '%';
      document.getElementById('pct-tg').textContent = tg.percent + '%';

      const fb = dati.kpi.oggi.facebook;
      document.getElementById('val-fb-oggi').textContent = fb.count;
      document.getElementById('lim-fb-max').textContent = fb.limit;
      document.getElementById('bar-fb').style.width = Math.min(100, fb.percent) + '%';
      document.getElementById('pct-fb').textContent = fb.percent + '% (Meta Bloccato)';

      const ig = dati.kpi.oggi.instagram;
      document.getElementById('val-ig-oggi').textContent = ig.count;
      document.getElementById('lim-ig-max').textContent = ig.limit;
      document.getElementById('bar-ig').style.width = Math.min(100, ig.percent) + '%';
      document.getElementById('pct-ig').textContent = ig.percent + '% (Meta Bloccato)';

      const wa = dati.kpi.oggi.whatsapp;
      document.getElementById('val-wa-oggi').textContent = wa.count;
      document.getElementById('lim-wa-max').textContent = wa.limit;
      document.getElementById('bar-wa').style.width = Math.min(100, wa.percent) + '%';
      document.getElementById('pct-wa').textContent = wa.percent + '%';

      // 3. Medie Statistiche
      document.getElementById('kpi-media-giornaliera').textContent = Number(dati.kpi.mediaGiornaliera7gg || 0).toFixed(1);
      document.getElementById('kpi-media-settimanale').textContent = Number(dati.kpi.mediaSettimanale4sett || 0).toFixed(1);
      document.getElementById('kpi-media-mensile').textContent = Math.round(dati.kpi.mediaMensile || 0);

      // 4. Render Grafici Chart.js
      renderGraficoCanali(dati.graficoCanali);
      renderGraficoTemporale();

      // 5. Render Tabella Recenti
      filtraTabella();
    }

    // Chart 1: Attività Reale vs Soglia di Sicurezza (Barre Affiancate)
    function renderGraficoCanali(datiCanali) {
      const ctx = document.getElementById('chart-canali').getContext('2d');

      if (chartCanaliInstance) {
        chartCanaliInstance.destroy();
      }

      chartCanaliInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: datiCanali.labels,
          datasets: [
            {
              label: 'Attività Reale Oggi',
              data: datiCanali.reale,
              backgroundColor: '#10b981',
              borderRadius: 6,
              barPercentage: 0.7,
              categoryPercentage: 0.6
            },
            {
              label: 'Soglia di Sicurezza Meta',
              data: datiCanali.soglia,
              backgroundColor: '#f43f5e',
              borderRadius: 6,
              barPercentage: 0.7,
              categoryPercentage: 0.6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10,
              boxPadding: 4,
              usePointStyle: true
            }
          },
          scales: {
            x: {
              grid: {
                color: '#334155',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11, weight: '600' }
              }
            },
            y: {
              grid: {
                color: '#1e293b',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 }
              },
              suggestedMax: 55,
              beginAtZero: true
            }
          }
        }
      });
    }

    // Chart 2: Distribuzione Temporale (Giorno Settimana / Mese)
    function mostraGraficoTemporale(tipo) {
      vistaTemporaleCorrente = tipo;
      const btnGiorni = document.getElementById('btn-tab-giorni');
      const btnMesi = document.getElementById('btn-tab-mesi');
      const desc = document.getElementById('desc-grafico-temporale');

      if (tipo === 'giorni') {
        btnGiorni.className = 'px-3 py-1 rounded-md bg-emerald-600 text-white shadow-sm transition-all';
        btnMesi.className = 'px-3 py-1 rounded-md text-slate-400 hover:text-white transition-all';
        desc.textContent = 'Volume aggregato per giorno della settimana (Lun - Dom)';
      } else {
        btnMesi.className = 'px-3 py-1 rounded-md bg-emerald-600 text-white shadow-sm transition-all';
        btnGiorni.className = 'px-3 py-1 rounded-md text-slate-400 hover:text-white transition-all';
        desc.textContent = 'Volume cumulativo di pubblicazioni per mese solare';
      }

      renderGraficoTemporale();
    }

    function renderGraficoTemporale() {
      if (!datiGlobali) return;

      const ctx = document.getElementById('chart-temporale').getContext('2d');
      if (chartTemporaleInstance) {
        chartTemporaleInstance.destroy();
      }

      const isGiorni = (vistaTemporaleCorrente === 'giorni');
      const sorgente = isGiorni ? datiGlobali.graficoGiorniSettimana : datiGlobali.graficoMesi;
      
      const totale = sorgente.valori.reduce((a, b) => a + b, 0);
      document.getElementById('val-totale-periodo').textContent = 'Totale Periodo: ' + totale + ' eventi';

      chartTemporaleInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sorgente.labels,
          datasets: [{
            label: isGiorni ? 'Eventi per Giorno' : 'Eventi per Mese',
            data: sorgente.valori,
            backgroundColor: isGiorni ? '#38bdf8' : '#a855f7',
            borderRadius: 6,
            barPercentage: 0.65
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1e293b',
              titleColor: '#ffffff',
              bodyColor: '#cbd5e1',
              borderColor: '#334155',
              borderWidth: 1,
              padding: 10
            }
          },
          scales: {
            x: {
              grid: {
                color: '#334155',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11, weight: '600' }
              }
            },
            y: {
              grid: {
                color: '#1e293b',
                drawBorder: false
              },
              ticks: {
                color: '#94a3b8',
                font: { size: 11 }
              },
              beginAtZero: true
            }
          }
        }
      });
    }

    // Filter & Search Table
    function filtraTabella() {
      if (!datiGlobali || !datiGlobali.recenti) return;

      const testoCerca = document.getElementById('input-ricerca-tabella').value.toLowerCase().trim();
      const filtroCanale = document.getElementById('select-filtro-canale').value;
      const tbody = document.getElementById('tbody-recenti');

      const filtrati = datiGlobali.recenti.filter(row => {
        const matchCanale = (filtroCanale === 'ALL' || row.canale.toLowerCase() === filtroCanale.toLowerCase());
        const matchTesto = !testoCerca || 
          (row.titolo && row.titolo.toLowerCase().includes(testoCerca)) ||
          (row.tipoAzione && row.tipoAzione.toLowerCase().includes(testoCerca)) ||
          (row.canale && row.canale.toLowerCase().includes(testoCerca)) ||
          (row.stato && row.stato.toLowerCase().includes(testoCerca));
        return matchCanale && matchTesto;
      });

      if (filtrati.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="py-8 text-center text-slate-500">
              Nessun evento o interazione corrisponde ai filtri selezionati.
            </td>
          </tr>
        `;
        document.getElementById('info-conteggio-righe').textContent = '0 eventi trovati';
        return;
      }

      document.getElementById('info-conteggio-righe').textContent = `Mostrati ${filtrati.length} di ${datiGlobali.recenti.length} eventi registrati`;

      tbody.innerHTML = filtrati.map(row => {
        // Canale Badge
        let badgeCanale = '';
        if (row.canale === 'Telegram') {
          badgeCanale = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20">✈️ Telegram</span>';
        } else if (row.canale === 'Facebook') {
          badgeCanale = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600/10 text-blue-400 border border-blue-600/20">📘 Facebook</span>';
        } else if (row.canale === 'Instagram') {
          badgeCanale = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20">📸 Instagram</span>';
        } else if (row.canale === 'WhatsApp') {
          badgeCanale = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">💬 WhatsApp</span>';
        } else {
          badgeCanale = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">${row.canale}</span>`;
        }

        // Stato Badge (✅ Sicuro, ⏳ In attesa, 🛑 Bloccato dal supervisore)
        let badgeStato = '';
        if (String(row.stato).includes('Sicuro')) {
          badgeStato = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">✅ Sicuro</span>';
        } else if (String(row.stato).includes('attesa')) {
          badgeStato = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ In attesa</span>';
        } else if (String(row.stato).includes('Bloccato') || String(row.stato).includes('supervisore')) {
          badgeStato = '<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">🛑 Bloccato supervisore</span>';
        } else {
          badgeStato = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">${row.stato}</span>`;
        }

        // Esito Soglia Badge
        let badgeEsito = '';
        if (String(row.esitoLimite).includes('SOTTO SOGLIA') || String(row.esitoLimite).includes('✅')) {
          badgeEsito = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">${row.esitoLimite}</span>`;
        } else {
          badgeEsito = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-300 border border-rose-500/20">${row.esitoLimite}</span>`;
        }

        return `
          <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">${row.timestamp}</td>
            <td class="py-3 px-4 whitespace-nowrap">${badgeCanale}</td>
            <td class="py-3 px-4 text-slate-300 whitespace-nowrap">${row.tipoAzione}</td>
            <td class="py-3 px-4 font-semibold text-white max-w-xs sm:max-w-md truncate" title="${row.titolo || ''}">${row.titolo || '-'}</td>
            <td class="py-3 px-4 whitespace-nowrap">${badgeStato}</td>
            <td class="py-3 px-4 text-center font-bold text-slate-200">${row.conteggioOggi || 1}</td>
            <td class="py-3 px-4 whitespace-nowrap">${badgeEsito}</td>
          </tr>
        `;
      }).join('');
    }

    // Auto-init on load
    document.addEventListener('DOMContentLoaded', function() {
      caricaDati();
      // Optional polling every 60 seconds
      setInterval(caricaDati, 60000);
    });
  </script>
</body>
</html>
