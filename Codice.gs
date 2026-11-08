// ==========================================

// ── 0. VERIFICA WEBHOOK META, HTML E OMNICHANNEL (doGet) ──────
// ══════════════════════════════════════════════════════════════
function doGet(e) {
  let params = e && e.parameter ? e.parameter : {};

  // ⛔ BLOCCO META ATTIVO: Rifiuta la sottoscrizione e la verifica dei webhook Meta
  if (params['hub.mode'] === 'subscribe') {
    inviaTelegramBoss("⛔ [SICUREZZA] Tentativo di verifica Webhook Meta intercettato e bloccato con successo.");
    return ContentService.createTextOutput("Meta webhook subscriptions disabled. All interactions routed to Telegram.");
  }

  // 📊 ROTTA: DASHBOARD HTML WEB APP & ANALYTICS (Richiesta Utente)
  if (params.page === 'dashboard' || params.page === 'analytics' || params.dashboard !== undefined) {
    return renderDashboardWeb();
  }

  // ✳️ ROTTA: FOGLIO DOCUMENTAZIONE (form per Antonio)
  if (params.page === 'Documentazione') {
    return HtmlService.createHtmlOutputFromFile('FoglioDocumentazione')
      .setTitle('Foglio Documentazione — Immobiliare Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

  
  // ✳️ ROTTA: FIRMA REMOTA DOCUMENTAZIONE (pagina del cliente)
  if (params.azione === 'firma_doc' && params.token) {
    var tokenDoc   = params.token;
    var chiaveDoc  = 'FIRMA_DOC_' + tokenDoc;
    var jsonDoc    = PropertiesService.getScriptProperties().getProperty(chiaveDoc);
    var datiDoc    = null;
 
    if (jsonDoc) {
      try { datiDoc = JSON.parse(jsonDoc); } catch(eP) {}
    }
 
    var acqDoc = (datiDoc && datiDoc.acquirente) ? datiDoc.acquirente : {};
    var immDoc = (datiDoc && datiDoc.immobile)   ? datiDoc.immobile   : {};
 
    var tplDoc = HtmlService.createTemplateFromFile('FirmaRemotaDocumentazione');
    tplDoc.token               = tokenDoc;
    tplDoc.nomeAcquirente      = acqDoc.nome         || '';
    tplDoc.telefonoAcquirente  = acqDoc.telefono     || '';
    tplDoc.cfAcquirente        = acqDoc.cf           || '';
    tplDoc.dataNascita         = acqDoc.dataNascita  || '';
    tplDoc.luogoNascita        = acqDoc.luogoNascita || '';
    tplDoc.residenza           = acqDoc.residenza    || '';
    tplDoc.tipoImmobile        = immDoc.tipo         || '';
    tplDoc.cittaImmobile       = immDoc.citta        || '';
    tplDoc.viaImmobile         = immDoc.via          || '';
    tplDoc.prezzoImmobile      = immDoc.prezzo       || '';
    tplDoc.incarico            = immDoc.incarico     || '';
    tplDoc.descrizioneImmobile = immDoc.descrizione  || '';
    tplDoc.agente              = (datiDoc && datiDoc.agente) ? datiDoc.agente : 'Antonio Giancani';
    tplDoc.gdprStato           = (datiDoc && datiDoc.gdprConsensus) ? datiDoc.gdprConsensus : 'presta';
    // Foto IDs come JSON string (array)
    var fotoArr = (datiDoc && datiDoc.fotoDocIds) ? datiDoc.fotoDocIds : [];
    tplDoc.fotoIdsJson = JSON.stringify(fotoArr);
 
    return tplDoc.evaluate()
      .setTitle('Autorizzazione Documenti — Immobiliare Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

  // 🆕 ROTTA VISUALIZZAZIONE PDF CLIENTE CON SCADENZA 6 MESI
  if (params.page === 'vedi_pdf' || params.azione === 'vedi_pdf') {
    let fileId = params.file;
    let timestamp = parseInt(params.t, 10) || 0;
    let adesso = new Date().getTime();
    let seiMesiMs = 6 * 30 * 24 * 60 * 60 * 1000; 
    
    if (adesso - timestamp > seiMesiMs) {
      let tplError = HtmlService.createTemplate('<body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:20px;text-align:center;">' +
        '<div style="max-width:400px;background:#1e293b;border:1px solid #334155;padding:30px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.5);">' +
        '<div style="color:#10b981;font-size:60px;margin-bottom:15px;">✓</div>' +
        '<h2 style="margin:0 0 10px;text-transform:uppercase;font-size:18px;letter-spacing:1px;">Visita Registrata</h2>' +
        '<p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:20px;">Hai regolarmente firmato e convalidato questo sopralluogo. L\'attestazione di visita gratuita risulta regolarmente depositata ed è valida a tutti gli effetti di legge.</p>' +
        '<div style="font-size:12px;color:#f97316;font-weight:bold;text-transform:uppercase;letter-spacing:2px;">Antonio Giancani</div>' +
        '</div>' +
        '</body>');
      return tplError.evaluate().setTitle("Visita Convalidata - Antonio Giancani");
    } else {
      return HtmlService.createHtmlOutput('<iframe src="https://drive.google.com/file/d/' + fileId + '/preview" style="width:100%;height:100%;border:none;"></iframe>')
        .setTitle("Foglio Visita - Antonio Giancani")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1');
    }
  }

  // 1️⃣ ROTTA: CENTRALE OPERATIVA BOSS
  if (params.page === 'centrale') {
    return HtmlService.createHtmlOutputFromFile('CentraleOperativa')
      .setTitle('Centrale Operativa Boss')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  // 2️⃣ ROTTA: FORM INCARICO VENDITA
  if (params.page === 'incarico' || params.incarico !== undefined) {
    return HtmlService.createTemplateFromFile('IncaricoVendita').evaluate()
      .setTitle('Incarico di Vendita — Immobiliare Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

 

  // 4️⃣ ROTTA: COCKPIT BOZZE TOTALI
  if (params.page === 'bozze') {
    let tpl = HtmlService.createTemplateFromFile('PannelloBozzeTotale');
    tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
    return tpl.evaluate()
      .setTitle("Cockpit Bozze — Immobiliare Giancani")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // ✳️ ROTTA UNIFICATA: CENTRO DI COMANDO / DASHBOARD DARIA
  if (params.page === 'comando' || params.page === 'centro' || params.page === 'dashboard' || params.centro !== undefined || params.dashboard !== undefined) {
    let tpl = HtmlService.createTemplateFromFile('DariaCommandCenter');
    tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
    
    return tpl.evaluate()
      .setTitle('DarIA Command Center — Antonio Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }


  // 6️⃣ ROTTA: FIRMA REMOTA FOGLIO VISITA
  if (params.azione === 'firma' && params.token) {
    let tpl = HtmlService.createTemplateFromFile('FirmaRemotaVisita');
    tpl.token    = params.token;
    tpl.cliIndex = params.cli || "0";
    tpl.nomeCliente      = "Cliente";
    tpl.telefonoCliente  = "";
    tpl.cfCliente        = "";
    tpl.nascitaCliente   = "";
    tpl.residenzaCliente = "";

    let chiave   = "FIRMA_" + params.token;
    let datiJson = PropertiesService.getScriptProperties().getProperty(chiave);

    if (datiJson) {
      try {
        let dati = JSON.parse(datiJson);
        let idx  = parseInt(tpl.cliIndex, 10);
        if (dati.clienti && dati.clienti[idx]) {
          tpl.nomeCliente      = dati.clienti[idx].nome        || "Cliente";
          tpl.telefonoCliente  = dati.clienti[idx].telefono    || "";
          tpl.cfCliente        = dati.clienti[idx].cf          || "";
          tpl.nascitaCliente   = dati.clienti[idx].dataNascita || "";
          tpl.residenzaCliente = dati.clienti[idx].residenza   || "";
        }
      } catch(e) {}
    }
    
    return tpl.evaluate()
      .setTitle("Firma Elettronica Sopralluogo - Immobiliare Giancani")
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

 // 7️⃣ ROTTA: APERTURA FORM FOGLIO VISITA (DARIA SMART INJECTION)
  if (params.visita !== undefined || params.page === 'visita') {
    let tpl = HtmlService.createTemplateFromFile('FoglioVisita');
    tpl.bozzaIniettata = null; // Di base è vuota

    // Se il link contiene l'ID della bozza generata dall'agenda
    if (params.idBozza) {
      try {
        let ss = SpreadsheetApp.openById(ID_STORICO_FOGLIO);
        let sheet = ss.getSheetByName("BOZZE_VISITE");
        if (sheet) {
          let dati = sheet.getDataRange().getValues();
          for (let i = 1; i < dati.length; i++) {
            if (String(dati[i][0]) === params.idBozza) {
              // Compone l'oggetto con i dati reali salvati dall'agenda
              tpl.bozzaIniettata = {
                idBozza: dati[i][0],
                agente: dati[i][2],
                clienti: JSON.parse(dati[i][3] || "[]"),
                immobili: JSON.parse(dati[i][4] || "[]")
              };
              break;
            }
          }
        }
      } catch(errBozza) {
        console.log("Errore recupero bozza in doGet: " + errBozza.toString());
      }
    }

    return tpl.evaluate()
      .setTitle('Foglio Visita — Immobiliare Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

  // 8️⃣ ROTTA: FIRMA INCARICO VENDITORE
  if (params.page === 'firma_incarico' && params.token) {
    let token    = params.token;
    let cliIndex = params.cli || '0';
    let chiave   = 'INCARICO_FIRMA_' + token;
    let datiJson = PropertiesService.getScriptProperties().getProperty(chiave);

    let nomeCliente = '', telefonoCliente = '', cfCliente = '';
    let residenzaCliente = '', nascitaCliente = '', luogoCliente = '';
    let indirizzoImmobileStr = '';
    let prezzoVenditaNum = 0;
    let provvigioneImponibileNum = 0;
    let provvigioneIvaNum = 0;
    let provvigioneTotaleNum = 0;
    let provvigioneTipoStr = 'FISSO';

    if (datiJson) {
      try {
        let dati = JSON.parse(datiJson);
        let idx  = parseInt(cliIndex, 10);
        let v    = dati.venditori && dati.venditori[idx] ? dati.venditori[idx] : {};

        nomeCliente         = v.nome         || '';
        telefonoCliente     = v.telefono     || '';
        cfCliente           = v.cf           || '';
        residenzaCliente    = v.residenza    || '';
        nascitaCliente      = v.dataNascita  || '';
        luogoCliente        = v.luogoNascita || '';
        prezzoVenditaNum = parseFloat(String(dati.prezzoVendita || '0').replace(/\./g,'').replace(',','.')) || 0;

        let calcProvv = calcolaProvvigioneAutomatica(prezzoVenditaNum);
        provvigioneImponibileNum = calcProvv.imponibile;
        provvigioneIvaNum        = calcProvv.iva;
        provvigioneTotaleNum     = calcProvv.totale;
        provvigioneTipoStr       = calcProvv.tipo;
        indirizzoImmobileStr = (dati.catasto && dati.catasto[0]) ? (dati.catasto[0].descrizione || '') : '';
      } catch(e) {}
    }

    let tmpl = HtmlService.createTemplateFromFile('FirmaIncarico');
    tmpl.nomeCliente            = nomeCliente;
    tmpl.telefonoCliente        = telefonoCliente;
    tmpl.cfCliente              = cfCliente;
    tmpl.residenzaCliente       = residenzaCliente;
    tmpl.nascitaCliente         = nascitaCliente;
    tmpl.luogoCliente           = luogoCliente;
    tmpl.token                  = token;
    tmpl.cliIndex               = cliIndex;
    tmpl.prezzoVendita          = prezzoVenditaNum;
    tmpl.provvigioneImponibile  = provvigioneImponibileNum;
    tmpl.provvigioneIva         = provvigioneIvaNum;
    tmpl.provvigioneTotale      = provvigioneTotaleNum;
    tmpl.provvigioneTipo        = provvigioneTipoStr;
    tmpl.indirizzoImmobile      = indirizzoImmobileStr;
    tmpl.idModelloFacSimile     = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC) ? CONFIG.ID_MODELLO_INC : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : '');
    tmpl.idModelloFacSimile2    = ID_MODELLO_PRIVACY_AML;

    return tmpl.evaluate()
      .setTitle('Firma Incarico — Immobiliare Giancani')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
  }

  // 9️⃣ ROTTA: OMNICHANNEL COMMENTI
  if (params.action === 'set_reply') {
    let commentId = params.id;
    let scelta = params.choice;
    try {
      let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('CODA_COMMENTI');
      let dati = sheet.getDataRange().getValues();
      for (let i = 1; i < dati.length; i++) {
        if (dati[i][1] === commentId && dati[i][4] === "DA_FARE") {
          if (scelta === 'STOP') {
            sheet.getRange(i + 1, 5).setValue("INTERVENTO_UMANO");
            return ContentService.createTextOutput("✅ DarIA NON risponderà a questo commento.");
          } else {
            let testoScelto = dati[i][5 + parseInt(scelta, 10)];
            sheet.getRange(i + 1, 10).setValue(testoScelto);
            sheet.getRange(i + 1, 5).setValue("SCELTA_FORZATA");
            return ContentService.createTextOutput("✅ Risposta prenotata! DarIA invierà: " + testoScelto);
          }
        }
      }
      return ContentService.createTextOutput("⚠️ Commento già processato o non trovato.");
    } catch(err) {
      return ContentService.createTextOutput("⚠️ Errore di sistema.");
    }
  }

  // 🔟 ROTTA: DOWNLOAD ALLEGATI
  if (params.doc_token) {
    let token = params.doc_token;
    let props = PropertiesService.getScriptProperties().getProperty("DOC_" + token);
    
    if (props) {
      try {
        let dataDoc = JSON.parse(props);
        let adesso = new Date().getTime();
        
        if (adesso > dataDoc.scadenza) {
          return HtmlService.createHtmlOutput(
            "<div style='font-family:system-ui,-apple-system,sans-serif; text-align:center; max-width:400px; margin:80px auto; padding:20px; border:2px solid #5c061a; border-radius:16px; background:#fff5f5;'>" +
            "<h2 style='color:#5c061a; margin-bottom:10px; font-weight:900;'>⏳ LINK SCADUTO</h2>" +
            "<p style='color:#475569; font-size:13px; line-height:1.5;'>L'accesso a questo documento protetto è terminato dopo 11 mesi dalla sottoscrizione del contratto, in conformità con i protocolli interni d'agenzia.</p>" +
            "</div>"
          );
        }
        return HtmlService.createHtmlOutput("<script>window.location.href='" + dataDoc.url + "';</script>");
      } catch(errJson) {}
    }
    return gestisciDownloadCliente(token);
  }

  // 1️⃣1️⃣ ROTTA: REPORT VENDITORI
  if (params.report !== undefined || params.venditori !== undefined) {
    let ticket = params.report || params.venditori || "";
    try {
      let tpl = HtmlService.createTemplateFromFile('ReportVenditore');
      tpl.ticket = ticket;
      return tpl.evaluate()
        .setTitle("Report Andamento - Immobiliare Giancani")
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
        .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
    } catch(errReport) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:system-ui;padding:30px;text-align:center;color:red;">' +
        '<h2>⚠️ Errore ReportVenditore</h2><p>' + errReport.toString() + '</p></div>'
      );
    }
  }

  // 1️⃣2️⃣ ROTTA: VIP ACQUIRENTI
  if (params.vip) {
    let numCliente = params.vip.replace(/\D/g, '');
    let template = HtmlService.createTemplateFromFile('VipAcquirenti');
    template.numero = numCliente;
    template.nome = cercaNomeInRubrica(numCliente) || "Cliente VIP";
    return template.evaluate()
      .setTitle('Selezione Esclusiva')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // 1️⃣3️⃣ ROTTA: CHAT DIRETTA DARIA
  if (params.chat) {
    let template = HtmlService.createTemplateFromFile('Chat');
    template.numero = params.chat;
    template.nome = params.nome || 'Cliente';
    return template.evaluate()
      .setTitle('Pannello DarIA')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // 1️⃣4️⃣ ROTTA: SIMULATORE MUTUO ACQUISTO
  if (params.mutuo) {
    let template = HtmlService.createTemplateFromFile('SimulatoreMutuo');
    template.prezzoPartenza = params.prezzo || 150000;
    return template.evaluate()
      .setTitle("Simulatore Mutuo - Immobiliare Giancani")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // 1️⃣5️⃣ ROTTA: REELS
  if (params.reels) {
    return HtmlService.createHtmlOutputFromFile('VetrinaReels')
      .setTitle('Giancani Reels - Vetrina Immersiva')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
  }

  // 1️⃣6️⃣ ROTTA: PANNELLO BOZZE INCARICHI
  if (params.bozze_incarichi !== undefined) {
    return paginaBozzeIncarichi();
  }

  // 1️⃣7️⃣ ROTTA: PANNELLO BOZZE VISITE
  if (params.bozze !== undefined) {
    let tpl = HtmlService.createTemplateFromFile('PannelloBozze');
    tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
    return tpl.evaluate()
      .setTitle("Bozze Visite — Giancani")
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  // 💀 FALLBACK DEFINITIVO
  return HtmlService.createHtmlOutputFromFile('VetrinaReels')
    .setTitle('Giancani Reels - Vetrina Immersiva')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}


    // ══════════════════════════════════════════════════════════════════════════════
// ── 1. DIRETTORE DI RETE PRINCIPALE (doPost UNIFICATO, SOCIAL & OTP) ─────────
// ══════════════════════════════════════════════════════════════════════════════
function doPost(e) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return respondOK();

  try {
    const json  = JSON.parse(e.postData.contents);
    const cache = CacheService.getScriptCache();
    let chatReale, num, testo, waName, isMultimedia = false;

    // ── INTERCETTAZIONE CLIC RIGHE ELENCO MENU BOSS (list_reply) ──
    if (json.object === 'whatsapp_business_account' &&
        json.entry && json.entry[0] &&
        json.entry[0].changes &&
        json.entry[0].changes[0].value.messages) {
      let msgInterattivo = json.entry[0].changes[0].value.messages[0];
      if (msgInterattivo.type === 'interactive' &&
          msgInterattivo.interactive &&
          msgInterattivo.interactive.list_reply) {
        let idScelto = msgInterattivo.interactive.list_reply.id;
        let chatId   = msgInterattivo.from;
        gestisciSelezioniMenuBoss(chatId, idScelto);
        lock.releaseLock();
        return respondOK();
      }
    }

    // ✈️ CANALE 1: TELEGRAM BOT
    if (json.message) {
      const tgMsg    = json.message;
      if (!tgMsg.text) return respondOK();
      const tgMsgKey = 'TG_MSG_' + tgMsg.message_id;
      if (cache.get(tgMsgKey)) return respondOK();
      cache.put(tgMsgKey, '1', 600);

      chatReale = 'TG_' + tgMsg.chat.id;
      num       = chatReale;
      testo     = tgMsg.text.trim();
      waName    = tgMsg.from.first_name || 'Utente Telegram';

      // ── COMANDO SPECIFICO TELEGRAM: /dashboard ──
      if (testo === '/dashboard' || testo.toLowerCase() === 'dashboard' || testo.startsWith('/dashboard')) {
        let urlDashboard = ScriptApp.getService().getUrl() + "?page=dashboard";
        let msgDashboard = "<b>📊 DASHBOARD ANALYTICS & MONITORAGGIO CANALI</b>\n\n" +
                           "Ecco il link per accedere alla plancia di controllo in tempo reale:\n" +
                           "• Monitoraggio Telegram, Facebook, Instagram, WhatsApp\n" +
                           "• Istogrammi attività vs soglia di sicurezza Meta\n" +
                           "• Registro interazioni su <code>DB_Interazioni</code>\n\n" +
                           "👉 " + urlDashboard + "\n\n" +
                           "Tocca il pulsante qui sotto per aprirla subito:";
        inviaTelegramConBottone(tgMsg.chat.id, msgDashboard, "📊 Apri Dashboard", urlDashboard);
        lock.releaseLock();
        return respondOK();
      }
    }

    // 🟢 CANALE 2: WHATSAPP META CLOUD API NATIVA
    else if (json.object === 'whatsapp_business_account' &&
             json.entry && json.entry[0] &&
             json.entry[0].changes &&
             json.entry[0].changes[0].value.messages) {
      const msg = json.entry[0].changes[0].value.messages[0];
      if (msg.from === CONFIG.META_PHONE_ID) return respondOK();
      if (cache.get(msg.id)) return respondOK();
      cache.put(msg.id, '1', 600);

      chatReale = msg.from;
      num       = chatReale.replace(/\D/g, '');
      waName    = json.entry[0].changes[0].value.contacts
                  ? json.entry[0].changes[0].value.contacts[0].profile.name
                  : 'Cliente WA';

      if (msg.type === 'text') {
        testo = msg.text.body.trim();
      }
      else if (msg.type === 'interactive') {
        let payloadPulsante = "";

        if (msg.interactive.type === 'list_reply') {
          payloadPulsante = msg.interactive.list_reply.id || "";
          testo           = payloadPulsante;
        } else if (msg.interactive.type === 'button_reply') {
          payloadPulsante = msg.interactive.button_reply.id || "";
          testo           = payloadPulsante;
        }

        // ── COMMENTI ──
        if (payloadPulsante && payloadPulsante.startsWith('cmt_')) {
          if (gestisciBottoniCommento(payloadPulsante, chatReale)) {
            lock.releaseLock();
            return respondOK();
          }
        }

        // ── AGENDA ORARIA: CONFERMA VISITA ──
        if (payloadPulsante && payloadPulsante.startsWith('agd_si_')) {
          let idBozzaCorrente = payloadPulsante.replace('agd_si_', '');
          let urlVisitaPrecompilata = CONFIG.MASTER_WEBAPP_URL + "?page=visita&idBozza=" + idBozzaCorrente;
          _inviaMetaWhatsApp(chatReale, "📝 *Perfetto Boss!* Ho preparato e precompilato la scheda della visita con tutti i dati trovati in memoria.\n\nTocca il pulsante sotto per aprirla sul tuo schermo ed avviare il sopralluogo:");
          inviaWhatsAppBottoneLink(num, "Accedi al modulo precompilato:", "Inizia Visita 🖋️", urlVisitaPrecompilata);
          lock.releaseLock();
          return respondOK();
        }

        if (payloadPulsante === "agd_no") {
          _inviaMetaWhatsApp(chatReale, "📋 Ricevuto Boss. Ho annullato la procedura di precompilazione per questo appuntamento.");
          lock.releaseLock();
          return respondOK();
        }

        // ── INCROCIO ──
        if (payloadPulsante === "btn_incrocio" || payloadPulsante === "boss_incrocio") {
          _inviaMetaWhatsApp(chatReale, "⏳ *Calcolo incroci in corso, Boss...* Sto verificando le richieste in target con l'ultimo immobile inserito.");
          IncrocioImmobileSpecifico(null);
          lock.releaseLock();
          return respondOK();
        }

        // ── RESOCONTO ──
        if (payloadPulsante === "btn_resoconto") {
          _inviaMetaWhatsApp(chatReale, "⚙️ *Esecuzione Resoconto Serale avviata, Boss...* Sto aggregando i dati di oggi.");
          inviaResocontoSerale();
          lock.releaseLock();
          return respondOK();
        }

        // ── INVIA CONFERME ──
        if (payloadPulsante === "btn_invia_conferme") {
          _inviaMetaWhatsApp(chatReale, "📅 *Elaborazione promemoria e conferme in corso...* Sto scansionando gli impegni di domani.");
          inviaRichiestaConferme();
          lock.releaseLock();
          return respondOK();
        }

        // ── REPORT VISTE ──
        if (payloadPulsante === "btn_viste_report") {
          let ticketDinamico = "VEND_TEST";
          try {
            let sheetRep    = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('REPORT_VENDITORI');
            let ultimeRighe = sheetRep.getLastRow();
            if (ultimeRighe > 1) ticketDinamico = sheetRep.getRange(ultimeRighe, 1).getValue() || "VEND_TEST";
          } catch(errTicket) {}
          let urlReportFisico = CONFIG.MASTER_WEBAPP_URL + "?report=" + ticketDinamico;
          inviaWhatsAppBottoneLink(num, "📈 *Pannello Statistiche & Viste Attivato*\n\nTocca il pulsante sotto per aprire l'interfaccia:", "Apri Report 📊", urlReportFisico);
          lock.releaseLock();
          return respondOK();
        }

        // ── BOZZE ──
        if (payloadPulsante === "btn_bozze") {
          let urlBozzePannello = CONFIG.MASTER_WEBAPP_URL + "?page=bozze";
          inviaWhatsAppBottoneLink(num, "🗂️ *COCKPIT BOZZE UNIFICATO*\n\nBoss, ecco la tua plancia totale per gestire contratti e visite in sospeso:", "Apri Cockpit Bozze 🗂️", urlBozzePannello);
          lock.releaseLock();
          return respondOK();
        }

        // ── FOGLIO VISITA ──
        if (payloadPulsante === "btn_registra_visita") {
          let adesso = new Date();
          let data   = Utilities.formatDate(adesso, "Europe/Rome", "dd/MM/yyyy");
          let ora    = Utilities.formatDate(adesso, "Europe/Rome", "HH:mm");
          let urlVisita = CONFIG.MASTER_WEBAPP_URL + "?visita=true";
          let msgVisita = `📝 *Nuovo Foglio Visita*\n\n📅 Data: *${data}*\n🕐 Ora: *${ora}*\n\nTocca il pulsante per aprire il modulo:`;
          inviaWhatsAppBottoneLink(num, msgVisita, "Apri Foglio Visita 🖋️", urlVisita);
          lock.releaseLock();
          return respondOK();
        }

        

        // ── REGIA LIVE CHAT ──
        if (payloadPulsante === "btn_chat_cockpit") {
          const prop = PropertiesService.getScriptProperties();
          prop.setProperty('stato_regia_' + num, 'attesa_numero');
          _inviaMetaWhatsApp(chatReale, "🧑‍💼 *REGIA LIVE CHAT*\n\nBoss, inviami il *Numero di Telefono* del cliente che vuoi controllare (es: 3201667156):\n\n_Scrivi \"annulla\" per fermarti._");
          lock.releaseLock();
          return respondOK();
        }

        // ── BLOCCO GENERICO btn_ / boss_ (deve stare sempre ULTIMO) ──
        if (payloadPulsante && (
          payloadPulsante.startsWith('boss_') ||
          payloadPulsante.startsWith('btn_')  ||
          payloadPulsante.includes('_doc_')   ||
          payloadPulsante.includes('_cli_')   ||
          payloadPulsante.includes('_prop_')  ||
          payloadPulsante.startsWith('tut_')  ||
          payloadPulsante === 'pubblica_video'
        )) {
          let comandoPulito = payloadPulsante.replace('btn_', 'boss_');
          if (payloadPulsante === 'btn_vetrina')    { inviaPulsanteReels(num);  lock.releaseLock(); return respondOK(); }
          if (payloadPulsante === 'btn_mutuo_boss') { inviaPulsanteMutuo(num);  lock.releaseLock(); return respondOK(); }
          gestisciPulsantiInterniWhatsApp(chatReale, comandoPulito);
          lock.releaseLock();
          return respondOK();
        }

        isMultimedia = false;
      }
      else if (msg.type === 'contacts') {
        try {
          let phoneObj     = msg.contacts[0].phones[0];
          let rawNum       = phoneObj.wa_id || phoneObj.phone || "";
          let numEstratto  = String(rawNum).replace(/\D/g, '');
          let nomeEstratto = msg.contacts[0].name.formatted_name || "Cliente";
          if (numEstratto.length >= 8) {
            testo        = "recupera " + numEstratto + " " + nomeEstratto;
            isMultimedia = false;
          } else {
            isMultimedia = true;
          }
        } catch(e) { isMultimedia = true; }
      } else {
        isMultimedia = true;
        testo = '';
      }
    }

    // 🟣 CANALE 3: FACEBOOK MESSENGER / INSTAGRAM
    else if (json.object === 'page' || json.object === 'instagram') {
      json.entry.forEach(function(entry) {
        let pageId = entry.id;
        let messagingEvents = entry.messaging || [];
        messagingEvents.forEach(function(event) {
          if (event.message && !event.message.is_echo && event.sender &&
              (event.message.text || event.message.body)) {
            chatReale = 'FB_' + event.sender.id;
            num       = chatReale;
            waName    = json.object === 'page' ? 'Utente FB' : 'Utente IG';
            testo     = event.message.text || event.message.body;
          }
        });
        let changes = entry.changes || [];
        changes.forEach(function(change) {
          if (change.field === 'feed') {
            let val = change.value || {};
            if (val.item === 'comment' && val.verb === 'add' &&
                val.from && val.from.id !== pageId) {
              let linkPost = val.post_id ? "https://facebook.com/" + val.post_id : "Link non disp.";
              salvaCommentoInCoda("fb_" + val.comment_id, val.message, val.from.name, "Facebook", linkPost);
            }
          }
          if (change.field === 'comments') {
            let val = change.value || {};
            if (val.from && val.id) {
              let usernameMittente = val.from.username || "Utente Instagram";
              let testoCommento    = val.text || "";
              let mediaId          = val.media ? val.media.id : "";
              let linkPost         = mediaId ? "https://instagram.com/p/" + mediaId : "Link Instagram";
              salvaCommentoInCoda("ig_" + val.id, testoCommento, usernameMittente, "Instagram", linkPost);
            }
          }
        });
      });
      if (!testo) return respondOK();
    } else {
      return respondOK();
    }

    // ══════════════════════════════════════════════════════════════════════════
    // ── MOTORE DI ELABORAZIONE CENTRALE DARIA (SMART ROUTING TESTUALE) ────────
    // ══════════════════════════════════════════════════════════════════════════
    const prop = PropertiesService.getScriptProperties();
    if (prop.getProperty('BANNATO_' + num) === 'true') return respondOK();

    if (typeof isRegiaAttiva === "function" && isRegiaAttiva(num)) {
      let messaggioCliente = isMultimedia ? "📎 [Allegato Multimediale]" : testo;
      inviaTelegramBoss(`👤 *${waName}* (${num}):\n${messaggioCliente}`);
      return respondOK();
    }

    const isBoss = CONFIG.ID_BOSS.some(function(id) { return String(num).includes(id); });
    prop.setProperty('last_msg_time_' + num, Date.now().toString());
    prop.setProperty('followup_count_' + num, '0');

    if (isMultimedia) {
      inviaMessaggioUmano(chatReale, "Ho ricevuto il tuo allegato! 📎 Lascio la parola ad Antonio per esaminarlo.");
      inviaTelegramBoss(`🔔 *FILE RICEVUTO!* Da: ${waName} (${num})`);
      return respondOK();
    }

    if (!isBoss && prop.getProperty('PAUSA_DARIA_' + num) === 'true') {
      try {
        SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').appendRow([new Date(), num, waName, 'U:' + testo]);
      } catch(e) {}
      inviaTelegramBoss('🔔 *MESSAGGIO MANUALE DA: ' + waName + '*\n📱 ID: ' + num + '\n💬 Testo: ' + testo);
      return respondOK();
    }

    // ── COMANDI TESTO BOSS ──

    if (testo && testo.toLowerCase().includes("documentazione") && isBoss) {
      let urlDoc = CONFIG.MASTER_WEBAPP_URL + "?page=documentazione";
      inviaWhatsAppBottoneLink(num, "📋 *Foglio Documentazione*\n\nModulo autorizzazione consegna documenti immobile:", "Apri Modulo 📋", urlDoc);
      lock.releaseLock();
      return respondOK();
    }

    if (testo && testo.toLowerCase().trim() === "dashboard" && isBoss) {
      _inviaMetaWhatsApp(chatReale, "📊 *DASHBOARD TOTALE AGENZIA*:\n" + CONFIG.MASTER_WEBAPP_URL + "?page=comando");
      return respondOK();
    }

    if (testo && testo.toLowerCase().trim() === "centrale" && isBoss) {
      _inviaMetaWhatsApp(chatReale, "🕹️ *CENTRALE OPERATIVA BOSS*:\n" + CONFIG.MASTER_WEBAPP_URL + "?page=centrale");
      return respondOK();
    }

    if (testo && testo.toLowerCase().includes("chiedo otp per verifica")) {
      let otpGenerato = Math.floor(1000 + Math.random() * 9000).toString();
      let numPulito   = num.replace(/\D/g, '').slice(-10);
      prop.setProperty('OTP_VISITA_'   + numPulito, otpGenerato);
      prop.setProperty('OTP_INCARICO_' + numPulito, otpGenerato);
      _inviaMetaWhatsApp(chatReale,
        `🔐 *IMMOBILIARE GIANCANI*\n\nEcco il tuo codice OTP di verifica: *${otpGenerato}*\n\nDettalo ad Antonio (o ad Andrea) sul posto per confermare la tua identità e sbloccare la firma grafica.`
      );
      lock.releaseLock();
      return respondOK();
    }

    if (testo && testo.toLowerCase().trim().startsWith("recupera ")) {
      let datiRecupero  = testo.substring(9).trim().split(" ");
      let numRecuperato = datiRecupero[0].replace(/\D/g, '');
      let nomeRecuperato= datiRecupero.slice(1).join(" ");
      if (numRecuperato.length < 9) return respondOK();
      let numCompleto = numRecuperato.startsWith("39") ? numRecuperato : "39" + numRecuperato;
      try {
        const cal          = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
        const eventiDomani = cal.getEventsForDay(new Date(Date.now() + 86400000));
        let evOk = false;
        eventiDomani.forEach(function(ev) {
          let tit = ev.getTitle() || "";
          if (!evOk && !tit.match(/3\d{8,9}/)) {
            ev.setTitle('【IN ATTESA】 ' + tit.replace(/【.*?】/g, '').trim() + ' ' + numCompleto);
            evOk = true;
          }
        });
      } catch(e) {}
      inviaPromemoriaPulsanti(numCompleto, "concordato");
      inviaMessaggioUmano(chatReale, `✅ Fatto Boss! Inserito in agenda e inviati i pulsanti a *${nomeRecuperato}*. 🚀`);
      return respondOK();
    }

    if (testo && testo.toLowerCase().trim() === "incrocio" && isBoss) {
      inviaMessaggioUmano(chatReale, "⏳ *Calcolo degli incroci in corso, Boss...* Sto setacciando il database richieste.");
      IncrocioImmobileSpecifico(null);
      lock.releaseLock();
      return respondOK();
    }

    if (testo && (
      testo.toLowerCase().includes('mutuo') ||
      testo.toLowerCase().includes('preventivo') ||
      testo.toLowerCase().includes('simulatore') ||
      testo === "btn_mutuo_boss" ||
      testo === "boss_mutuo_boss"
    )) {
      if (!String(chatReale).startsWith('TG_') && !String(chatReale).startsWith('FB_')) {
        inviaPulsanteMutuo(num);
      } else {
        inviaWhatsAppTesto(chatReale, `🏦 *Calcola il tuo Mutuo su Misura (Max 80%)* 📈\n\n👉 ` + CONFIG.MASTER_WEBAPP_URL + "?mutuo=1&prezzo=150000");
      }
      lock.releaseLock();
      return respondOK();
    }

    if (testo && (
      testo === "btn_vetrina" ||
      testo === "boss_vetrina" ||
      testo.toLowerCase().includes('vetrina')
    )) {
      if (!String(chatReale).startsWith('TG_') && !String(chatReale).startsWith('FB_')) {
        inviaPulsanteReels(num);
      } else {
        inviaWhatsAppTesto(chatReale, `🍿 *La tua Vetrina Reels è pronta!*\n\n👉 ` + CONFIG.MASTER_WEBAPP_URL + "?reels=1");
      }
      lock.releaseLock();
      return respondOK();
    }

    gestisciRispostaIA(chatReale, num, testo, waName);
    return respondOK();

  } catch (err) {
    inviaTelegramBoss("⚠️ *CRASH NEL DOPOST:*\n" + err.toString());
    try {
      SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Webhook Debug').appendRow([new Date(), "CRASH", "FATAL", err.toString()]);
    } catch(e) {}
    return respondOK();
  } finally {
    lock.releaseLock();
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── GESTIONE MENU LISTA BOSS (UNIFICATA) ──────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function gestisciSelezioniMenuBoss(chatId, idScelto) {
  let urlBaseWebApp = ScriptApp.getService().getUrl() || CONFIG.MASTER_WEBAPP_URL;
  let numFisso = String(chatId).replace(/\D/g, '');
  const prop = PropertiesService.getScriptProperties();

  switch(idScelto) {
    case 'btn_vetrina':
      _inviaMetaWhatsApp(chatId, "🎬 *Vetrina Reels Immersiva*:\n" + urlBaseWebApp + "?reels=true");
      break;

    case 'btn_dashboard':
      _inviaMetaWhatsApp(chatId, "📊 *DASHBOARD TOTALE AGENZIA*\n\nEcco la plancia analitica protetta da OTP:\n👉 " + urlBaseWebApp + "?page=comando");
      break;

    case 'btn_centrale':
      _inviaMetaWhatsApp(chatId, "🕹️ *CENTRALE OPERATIVA BOSS*\n\nEcco l'accesso alla centrale di comando:\n👉 " + urlBaseWebApp + "?page=centrale");
      break;

    case 'btn_nuovo_immobile':
      prop.setProperty('stato_carica_' + numFisso, 'attesa_messaggio');
      _inviaMetaWhatsApp(chatId, "🏗️ *Nuovo Immobile*:\nAvviato il caricamento guidato. Inviami la descrizione completa della casa.");
      break;

    case 'btn_resoconto':
      _inviaMetaWhatsApp(chatId, "⚙️ *Esecuzione Resoconto Serale avviata, Boss...*");
      if (typeof inviaResocontoSerale === "function") inviaResocontoSerale();
      break;

    case 'btn_incrocio':
      _inviaMetaWhatsApp(chatId, "⏳ *Calcolo incroci della banca dati in corso...*");
      if (typeof IncrocioImmobileSpecifico === "function") IncrocioImmobileSpecifico(null);
      break;

    case 'btn_invia_conferme':
      _inviaMetaWhatsApp(chatId, "🔄 *Promemoria automatici inviati all'agenda di domani!*");
      if (typeof inviaRichiestaConferme === "function") inviaRichiestaConferme();
      break;

    case 'btn_registra_visita':
      let adessoVis = new Date();
      let dataVis    = Utilities.formatDate(adessoVis, "Europe/Rome", "dd/MM/yyyy");
      let oraVis     = Utilities.formatDate(adessoVis, "Europe/Rome", "HH:mm");
      let urlVisitaReale = CONFIG.MASTER_WEBAPP_URL + "?visita=true"; 
      let msgVisita = `📝 *Nuovo Foglio Visita*\n\n📅 Data: *${dataVis}*\n🕐 Ora: *${oraVis}*\n\nTocca il pulsante per aprire il modulo:`;
      if (typeof inviaWhatsAppBottoneLink === "function") inviaWhatsAppBottoneLink(numFisso, msgVisita, "Apri Foglio Visita 🖋️", urlVisitaReale);
      break;

    case 'btn_documentazione':
      let adessoDoc = new Date();
      let dataDoc    = Utilities.formatDate(adessoDoc, "Europe/Rome", "dd/MM/yyyy");
      let oraDoc     = Utilities.formatDate(adessoDoc, "Europe/Rome", "HH:mm");
      let urlDocReale = CONFIG.MASTER_WEBAPP_URL + "?page=documentazione";
      let msgDoc = `📋 *Foglio Documentazione*\n\n📅 Data: *${dataDoc}*\n🕐 Ora: *${oraDoc}*\n\nTocca il pulsante per aprire il modulo di autorizzazione alla consegna documenti immobile:`;
      if (typeof inviaWhatsAppBottoneLink === "function") inviaWhatsAppBottoneLink(numFisso, msgDoc, "Apri Documentazione 📋", urlDocReale);
      break;

    case 'btn_bozze':
      let urlBozzeReale = CONFIG.MASTER_WEBAPP_URL + "?page=bozze";
      let msgBozze = `🗂️ *COCKPIT BOZZE UNIFICATO*\n\nBoss, ecco la tua plancia totale per gestire contratti e visite in sospeso:`;
      if (typeof inviaWhatsAppBottoneLink === "function") inviaWhatsAppBottoneLink(numFisso, msgBozze, "Apri Cockpit Bozze 🗂️", urlBozzeReale);
      break;

    case 'btn_registra_incarico':
      let adessoInc = new Date();
      let dataInc = Utilities.formatDate(adessoInc, "Europe/Rome", "dd/MM/yyyy");
      let msgIncarico = `📝 *Nuovo Incarico di Vendita in Esclusiva*\n\n📅 Data Sessione: *${dataInc}*\n\nTocca il pulsante per aprire il modulo catastale protetto con OTP Cloud:`;
      if (typeof inviaWhatsAppBottoneLink === "function") inviaWhatsAppBottoneLink(numFisso, msgIncarico, "Apri Modulo Incarico 📝", urlBaseWebApp + "?page=incarico");
      break;

    case 'btn_viste_report':
      _inviaMetaWhatsApp(chatId, "📈 *Generazione faldone statistiche video attivata...*");
      break;

    case 'btn_link_doc':
      _inviaMetaWhatsApp(chatId, "🔐 *Generatore Link Sicuro*:\nInvia un messaggio scritto così: \n_link doc [ID_FILE_DRIVE] [GIORNI]_");
      break;

    case 'btn_chat_cockpit':
      prop.setProperty('stato_regia_' + numFisso, 'attesa_numero');
      _inviaMetaWhatsApp(chatId, "🧑‍💼 *REGIA LIVE CHAT*\n\nBoss, inviami il *Numero di Telefono* del cliente che vuoi controllare (es: 3201667156):\n\n_Scrivi \"annulla\" per fermarti._");
      break;
  }
}
// ══════════════════════════════════════════════════════════════
// ── 2. BLOCCO FUNZIONI STRUTTURALI UNIFICATE ──────────────────
// ══════════════════════════════════════════════════════════════
function RESET_STATUS_BOSS() {
  PropertiesService.getScriptProperties().deleteProperty('PAUSA_DARIA_393201667156');
  Logger.log("✅ Numero del Boss sbloccato con successo!");
}

function pattugliaCommentiYouTube() {
  if (!CONFIG.YOUTUBE_CHANNEL_ID || CONFIG.YOUTUBE_CHANNEL_ID === "INSERISCI_QUI_IL_TUO_ID_CANALE") return;
  try {
    let response = YouTube.CommentThreads.list('snippet', { allThreadsRelatedToChannelId: CONFIG.YOUTUBE_CHANNEL_ID, maxResults: 15, order: 'time' });
    let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('CODA_COMMENTI');
    if (!sheet) return;
    let dati = sheet.getDataRange().getValues();
    let idEsistenti = dati.map(row => row[1]);
    let items = response.items || [];
    for (let i = 0; i < items.length; i++) {
      let snippet = items[i].snippet.topLevelComment.snippet;
      let commentId = items[i].id; 
      let prefixedId = "yt_" + commentId; 
      let mittente = snippet.authorDisplayName;
      let testoComm = snippet.textOriginal;
      let channelIdMittente = snippet.authorChannelId ? snippet.authorChannelId.value : "";
      let videoId = snippet.videoId;
      let linkPost = videoId ? "https://www.youtube.com/watch?v=" + videoId : "Link non disponibile";
      
      if (channelIdMittente === CONFIG.YOUTUBE_CHANNEL_ID) continue; 
      if (idEsistenti.includes(prefixedId)) continue; 
      
      salvaCommentoInCoda(prefixedId, testoComm, mittente, "YouTube", linkPost);
    }
  } catch(err) {}
}

function salvaCommentoInCoda(commentId, testoComm, mittente, piattaforma, linkPost = "") {
  try {
    let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('CODA_COMMENTI');
    if (!sheet) {
      sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).insertSheet('CODA_COMMENTI');
      sheet.appendRow(["DATA_ARRIVO", "ID_COMMENTO", "MITTENTE", "TESTO_COMMENTO", "STATO", "MINUTI_ATTESA", "OPZIONE_1", "OPZIONE_2", "OPZIONE_3", "TESTO_DA_INVIARE", "LINK_POST", "PIATTAFORMA"]);
    }
    
    let minutiAttesaCasuali = Math.floor(Math.random() * (25 - 10 + 1)) + 10; 
    let profiloAgenziaReale = ottieniProfiloAgenzia(); 
    
    const sysPrompt = `Sei DarIA, l'assistente social dell'Agenzia Immobiliare Giancani di Favara. Profilo aziendale: ${profiloAgenziaReale}.
    L'utente ${mittente} ha scritto questo commento su ${piattaforma}: '${testoComm}'.
    Devi generare ESATTAMENTE e SOLO 3 opzioni di risposta in lingua italiana, separate dal simbolo |||. Non aggiungere introduzioni.
    
    ⚠️ REGOLA TASSATIVA ANTI-ALLUCINAZIONE: NON inventare mai dettagli sulle case (stanze, mq, prezzi, balconi) se non sono esplicitamente scritti nel commento dell'utente! Se mancano i dettagli dell'immobile specifico, rimanda ad Antonio Giancani o ai messaggi privati senza inventare nulla.
    
    OPZIONE 1 (REGOLA PRIVATO): Invito cordiale ed elegante a scriverci in privato (DM) o su WhatsApp per ricevere subito le planimetrie, foto esclusive e la scheda dettagliata di questa soluzione.
    OPZIONE 2 (ENGAGEMENT REALE): Una domanda aperta incentrata sulle esigenze generali del cliente (es. se cerca a Favara o Agrigento, o che tipologia sta cercando in generale), senza fare riferimento a dati inventati.
    OPZIONE 3 (CONTATTO DIRETTO): Invito persuasivo a contattare Antonio Giancani al 393201667156 (chiamata o WhatsApp) per verificare la disponibilità e fissare un sopralluogo sul posto.`;
    
    let groqRes = callGroq(sysPrompt, "Genera le 3 opzioni");
    let opzioni = groqRes.split("|||");
    let opz1 = opzioni[0] ? opzioni[0].trim() : "Grazie per il commento! Ci scriva in privato per ricevere subito il materiale riservato e le planimetrie di questa soluzione. 📩";
    let opz2 = opzioni[1] ? opzioni[1].trim() : "Ti ringraziamo! Stai cercando una soluzione simile a Favara o valuti anche altre zone? 😊";
    let opz3 = opzioni[2] ? opzioni[2].trim() : "Per informazioni dettagliate e per fissare un sopralluogo, contatta direttamente Antonio al 393201667156! 📞";

    sheet.appendRow([new Date(), commentId, mittente, testoComm, "DA_FARE", minutiAttesaCasuali, opz1, opz2, opz3, "", linkPost, piattaforma]);
    
    let webAppUrl = CONFIG.MASTER_WEBAPP_URL; 
    let link1 = `${webAppUrl}?action=set_reply&id=${commentId}&choice=1`;
    let link2 = `${webAppUrl}?action=set_reply&id=${commentId}&choice=2`;
    let link3 = `${webAppUrl}?action=set_reply&id=${commentId}&choice=3`;
    let linkStop = `${webAppUrl}?action=set_reply&id=${commentId}&choice=STOP`;

    let msgSpiaTG = `🚨 *NUOVO COMMENTO SU ${piattaforma.toUpperCase()}*\n👤 Da: ${mittente}\n💬 "${testoComm}"\n🔗 *Link:* ${linkPost}\n\nScegli la mossa di DarIA:\n\n1️⃣ *[Invia Privato DM]* → ${opz1}\n🔗 [Approva Opzione 1](${link1})\n\n2️⃣ *[Invia Engagement]* → ${opz2}\n🔗 [Approva Opzione 2](${link2})\n\n3️⃣ *[Invia Contatto Diretto]* → ${opz3}\n🔗 [Approva Opzione 3](${link3})\n\n🛑 [Blocca Risposta Automatizzata](${linkStop})`;
    inviaTelegramBoss(msgSpiaTG);
    inviaNotificaWABoss(commentId, mittente, testoComm, piattaforma, linkPost, opz1, opz2, opz3);
  } catch(err) {
    try { inviaTelegramBoss("⚠️ Errore salvataggio commento: " + err.toString()); } catch(e) {}
  }
}

function _inviaRispostaCommentoIG(commentId, testo) {
  // ⛔ META BLOCCATO: Risposta commento Instagram convogliata su Telegram
  Logger.log("⛔ [BLOCCO META] Risposta commento Instagram bloccata per commentId: " + commentId);
  inviaTelegramBoss("📸 *[RISPOSTA COMMENTO IG BLOCCATA — CONVOGLIATA SU TELEGRAM]*
🆔 Commento: " + commentId + "
💬 Testo risposta: " + testo);
  return true;
}

function _inviaRispostaCommentoFB(commentId, testo) {
  // ⛔ META BLOCCATO: Risposta commento FB convogliata su Telegram
  Logger.log("⛔ [BLOCCO META] Risposta commento Facebook bloccata per commentId: " + commentId);
  inviaTelegramBoss("📘 *[RISPOSTA COMMENTO FB BLOCCATA — CONVOGLIATA SU TELEGRAM]*
🆔 Commento: " + commentId + "
💬 Testo risposta: " + testo);
  return true;
}

function _inviaRispostaCommentoYT(commentId, testo) {
  try {
    YouTube.Comments.insert({ snippet: { parentId: commentId, textOriginal: testo } }, 'snippet');
    return true;
  } catch(err) { return false; }
}

function inviaWhatsAppTesto(id, t) {
  if (!t) return;
  // ⛔ META BLOCCATO: Qualsiasi messaggio verso WhatsApp/FB viene convogliato su Telegram
  var targetId = String(id).startsWith('TG_') ? String(id).replace('TG_', '') : CONFIG.TELEGRAM_CHAT_ID;
  var prefisso = String(id).startsWith('TG_') ? '' : '📲 [CONVOGLIATO SU TELEGRAM — Destinatario originario: ' + id + ']

';
  _inviaTelegramTesto(targetId, prefisso + t);
}

function _inviaMessaggioFB(senderId, testo) {
  // ⛔ META BLOCCATO: Chiamata a Facebook Messenger bloccata, messaggio convogliato su Telegram
  Logger.log("⛔ [BLOCCO META] _inviaMessaggioFB bloccata per ID: " + senderId);
  _inviaTelegramTesto(CONFIG.TELEGRAM_CHAT_ID, "📘 *[MESSAGGIO FB BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*
👤 Destinatario: " + senderId + "

💬 " + testo);
  return;
}

function _inviaMetaWhatsApp(id, testo) {
  // ⛔ META BLOCCATO: Chiamata a Graph API bloccata, messaggio convogliato su Telegram
  Logger.log("⛔ [BLOCCO META] _inviaMetaWhatsApp bloccata per ID: " + id);
  _inviaTelegramTesto(CONFIG.TELEGRAM_CHAT_ID, "📲 *[MESSAGGIO WA BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*
👤 Destinatario: " + id + "

💬 " + testo);
  return;
  // CHIAMATA ORIGINALE ARCHIVIATA:
  let numPulito = String(id).replace(/\D/g, '');
  if (numPulito.length > 15) numPulito = numPulito.substring(0, 15);
  UrlFetchApp.fetch('https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages', {
    method: 'post', contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify({
      messaging_product: 'whatsapp', recipient_type: 'individual', to: numPulito, type: 'text', text: { preview_url: true, body: testo }
    }),
    muteHttpExceptions: true
  });
}

function _inviaTelegramTesto(chatId, testo) {
  if (!testo) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/sendMessage', {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: chatId, text: testo }), muteHttpExceptions: true
  });
}

function inviaTelegramBoss(testo) {
  if (!CONFIG.TELEGRAM_TOKEN || !CONFIG.TELEGRAM_CHAT_ID) {
    Logger.log("❌ ERRORE CRITICO: CONFIG.TELEGRAM_TOKEN o CONFIG.TELEGRAM_CHAT_ID non sono definiti!");
    return;
  }
  let testoPulito = String(testo).replace(/\*/g, '');
  let url = 'https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/sendMessage';
  try {
    let response = UrlFetchApp.fetch(url, {
      method: 'post', 
      contentType: 'application/json',
      payload: JSON.stringify({ chat_id: CONFIG.TELEGRAM_CHAT_ID, text: testoPulito }),
      muteHttpExceptions: true
    });
    if (response.getResponseCode() !== 200) {
      Logger.log("❌ Telegram ha risposto con errore: " + response.getContentText());
    } else {
      Logger.log("✅ Messaggio Telegram inviato correttamente.");
    }
  } catch (e) {
    Logger.log("❌ Errore nella connessione a Telegram: " + e.toString());
  }
}

function inviaMessaggioUmano(chatId, testoCompleto) {
  if (!testoCompleto) return;
  let blocchi = [];
  
  if (testoCompleto.includes('\n\n')) {
    blocchi = testoCompleto.split('\n\n').filter(b => b.trim().length > 0);
  } else {
    let parole = testoCompleto.split(' ');
    if (parole.length > 15) {
      blocchi.push(parole.slice(0, 10).join(' ') + '...');
      blocchi.push(parole.slice(10).join(' '));
    } else {
      blocchi.push(testoCompleto);
    }
  }
  
  blocchi.forEach(function(parte) {
    if (parte.trim().length < 1) return;
    Utilities.sleep(Math.floor(Math.random() * (4000 - 1000 + 1)) + 1000);
    inviaWhatsAppTesto(chatId, parte.trim());
  });
}




function pescaRisposta(tag, nomeCliente) {
  nomeCliente = nomeCliente || '';
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('IMPOSTAZIONI_BOT');
    const dati  = sheet.getDataRange().getValues();
    let varianti = [];
    for (let i = 0; i < dati.length; i++) {
      if (String(dati[i][0]).toUpperCase() === tag.toUpperCase() && dati[i][1]) {
        varianti.push(String(dati[i][1]).replace(/\\n/g, '\n').replace('[NOME]', nomeCliente));
      }
    }
    if (varianti.length > 0) return varianti[Math.floor(Math.random() * varianti.length)];
  } catch(e) {}
  if (tag === 'BENVENUTO') return 'Ciao ' + nomeCliente + '! Sono DarIA, l\'IA dell\'Agenzia Immobiliare Giancani di Favara. Come posso aiutarti oggi? Vuoi COMPRARE o VENDERE?';
  if (tag === 'CHIEDI_NOME') return 'Ciao! Sono DarIA, l\'IA dell\'Agenzia Immobiliare Giancani. Prima di iniziare, con chi ho il piacere di parlare? (Scrivi il tuo Nome e Cognome)';
  if (tag === 'FIRMA')    return '\n\n📍 DarIA - Agenzia Immobiliare Giancani\nCorso Vittorio Veneto 151, Favara (AG)\n📲 Scrivi ad Antonio: https://wa.me/393201667156';
  if (tag === 'ERRORE')   return 'Scusami, in questo momento ho tantissime richieste! Dimmi semplicemente se vuoi COMPRARE o VENDERE.';
  return '';
}

function ottieniProfiloAgenzia() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('IMPOSTAZIONI_BOT');
    const dati  = sheet.getDataRange().getValues();
    for (let i = 0; i < dati.length; i++) {
      if (String(dati[i][0]).toUpperCase() === 'PROFILO_AGENZIA' && dati[i][1]) return String(dati[i][1]);
    }
  } catch(e) {}
  return 'Antonio Giancani, Classe 1981, Agente Immobiliare dal 2007 e Consulente Unicredit Re Service dal 2016. Esperto in compravendite, stime e perizie, fotografo, cerimoniere e pilota di drone.';
}

function pescaContestoEditoriale(testoCommento) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Piano_Editoriale_2026');
    if (!sheet) return "";
    const dati       = sheet.getDataRange().getValues();
    const testoNorm  = String(testoCommento || "").toLowerCase();
    const parole     = testoNorm.split(/\s+/).filter(p => p.length > 3);
    const evergreen = dati.slice(1).filter(function(row) {
      const stato  = String(row[5]).toUpperCase().trim();
      const testo  = String(row[2]).trim();
      return stato === 'SI' && testo.length > 30;
    });
    if (evergreen.length === 0) return "";
    let migliore     = null;
    let punteggioMax = 0;
    evergreen.forEach(function(row) {
      const testoPost = String(row[2]).toLowerCase();
      const punteggio = parole.reduce(function(acc, p) {
        return acc + (testoPost.includes(p) ? 1 : 0);
      }, 0);
      if (punteggio > punteggioMax) {
        punteggioMax = punteggio;
        migliore     = row;
      }
    });
    if (!migliore) migliore = evergreen[Math.floor(Math.random() * evergreen.length)];
    return String(migliore[2]).substring(0, 450);
  } catch(err) {
    Logger.log("❌ pescaContestoEditoriale: " + err.toString());
    return "";
  }
}

// ── 3. LOGICA RISPOSTA PRINCIPALE E IA (AREA OPERATIVA) ────────
// ══════════════════════════════════════════════════════════════
function cercaNomeInRubrica(numeroCercato) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('SCHEDE_CLIENTI');
    const dati  = sheet.getDataRange().getValues();
    let idTarget = String(numeroCercato).replace('+', '').trim().toLowerCase();
    for (let i = 1; i < dati.length; i++) {
      let cellaNumero = String(dati[i][1]).replace('+', '').trim().toLowerCase();
      if (cellaNumero === idTarget || cellaNumero.includes(idTarget) || idTarget.includes(cellaNumero)) {
        return String(dati[i][2]);
      }
    }
  } catch(e) {}
  return null;
}

// [La funzione completa 'gestisciRispostaIA' viene mantenuta esattamente come l'hai configurata, senza i blocchi ridondanti in fondo]

function VERIFICA_SISTEMA_COMPLETA() {
  function getConf(chiave) {
    return (typeof CONFIG !== 'undefined' && CONFIG[chiave]) ? CONFIG[chiave] : "⚠️ MANCANTE";
  }
  let report = "🔍 *REPORT AUTODIAGNOSI GIANCANI*\n\n";
  report += "🟢 *Configurazione Base:*\n";
  report += "Token WA: " + getConf('WHATSAPP_TOKEN') + "\n";
  report += "Phone ID: " + getConf('META_PHONE_ID') + "\n";
  report += "Telegram Chat ID: " + getConf('TELEGRAM_CHAT_ID') + "\n\n";
  report += "🟢 *1. Verifica WhatsApp:*\n";
  let token = typeof CONFIG !== 'undefined' ? CONFIG.WHATSAPP_TOKEN : "";
  if (!token || token === "⚠️ MANCANTE") {
    report += "❌ Token WhatsApp non configurato!\n\n";
  } else {
    report += "✅ Token presente.\n\n";
  }
  report += "🤖 *2. Verifica IA (Groq):*\n";
  if (typeof CONFIG === 'undefined' || !CONFIG.KEYS || !CONFIG.KEYS.GROQ_1) {
    report += "❌ Chiavi Groq mancanti nel file CONFIG!\n\n";
  } else {
    report += "✅ Chiavi Groq rilevate.\n\n";
  }
  let urlTG = 'https://api.telegram.org/bot' + getConf('TELEGRAM_TOKEN') + '/sendMessage';
  let options = {
    method: 'post', contentType: 'application/json',
    payload: JSON.stringify({ chat_id: getConf('TELEGRAM_CHAT_ID'), text: report }), muteHttpExceptions: true
  };
  UrlFetchApp.fetch(urlTG, options);
  Logger.log("Diagnostica inviata a Telegram.");
}

function controllaEInviaFlowUp() {
  try {
    let prop = PropertiesService.getScriptProperties();
    let tutteLeProp = prop.getProperties();
    let adesso = Date.now();
    let sogliaInattivita = 2 * 60 * 60 * 1000; 

    for (let chiave in tutteLeProp) {
      if (chiave.startsWith('last_msg_time_')) {
        let numero = chiave.replace('last_msg_time_', '');
        if (tutteLeProp['PAUSA_DARIA_' + numero] === 'true' || tutteLeProp['BANNATO_' + numero] === 'true') continue;
        let ultimoMsgTime = parseInt(tutteLeProp[chiave], 10);
        let conteggioFollowUp = parseInt(tutteLeProp['followup_count_' + numero] || '0', 10);
        
        if (conteggioFollowUp < 1 && (adesso - ultimoMsgTime) >= sogliaInattivita) {
          let nomeCliente = cercaNomeInRubrica(numero) || "Cliente";
          let messaggioFollowUp = `Ciao *${nomeCliente}*! 😊 Volevo solo assicurarmi che avessi ricevuto il materiale che ti ho inviato poco fa.\n\nHai dubbi o c'è qualche dettaglio degli immobili che vorresti approfondire direttamente con Antonio?`;
          inviaWhatsAppTesto(numero, messaggioFollowUp);
          prop.setProperty('followup_count_' + numero, (conteggioFollowUp + 1).toString());
          try {
            SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').appendRow([new Date(), numero, nomeCliente, 'B:[Sollecito Automatico] ' + messaggioFollowUp]);
          } catch(eLog) {}
          console.log("Follow-up inviato con successo a +" + numero);
        }
      }
    }
  } catch (errore) {
    console.log("Errore nel monitoraggio FlowUp: " + errore.toString());
  }
}



function paginaDashboardTotale() {
  let tpl = HtmlService.createTemplateFromFile('DashboardTotale');
  tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
  return tpl.evaluate()
    .setTitle("Centro di Comando DarIA — Immobiliare Giancani")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}


// =========================================================================
// // API ENDPOINTS FOR CENTRALE OPERATIVA (co*)
// =========================================================================

function _dcSes(tok) { 
  return _verificaSessioneCentrale(tok); 
}

function coBenchmark(tok, zona, tipo) { 
  var sessione = _verificaSessioneCentrale(tok); 
  if (!sessione) return { ok: false, error: "Non autorizzato" }; 
  return dbBenchmark(zona, tipo); 
}

function coGetProposte(tok, idImm) { 
  var sessione = _verificaSessioneCentrale(tok); 
  if (!sessione) return { ok: false, error: "Non autorizzato" }; 
  return dbGetProposte(idImm); 
}

function coLookupTelefono(tok, tel) { 
  var sessione = _verificaSessioneCentrale(tok); 
  if (!sessione) return { ok: false, error: "Non autorizzato" }; 
  return dbLookupTelefono(tel); 
}

function coIncrociAcquirenti(tok, imm) { 
  var sessione = _verificaSessioneCentrale(tok); 
  if (!sessione) return { ok: false, error: "Non autorizzato" }; 
  return dbIncrociAcquirenti(imm); 
}

function coSalvaFeedbackVisita(tok, fv) { 
  var sessione = _verificaSessioneCentrale(tok); 
  if (!sessione) return { ok: false, error: "Non autorizzato" }; 
  return dbSalvaFeedbackVisita(fv); 
}

