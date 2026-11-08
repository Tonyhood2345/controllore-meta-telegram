// ==========================================

// ── FUNZIONE RESOCONTO SERALE ──
function inviaResocontoSerale() {
  const oggi = new Date();
  const oggiStr = Utilities.formatDate(oggi, CONFIG.TIMEZONE, 'dd/MM/yyyy');
  let testo = `🌙 *RESOCONTO DEL ${oggiStr}*\n\n📅 *Appuntamenti domani:*\n`;
  try {
    const eventi = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID).getEventsForDay(new Date(Date.now() + 86400000));
    if (eventi.length === 0) testo += "- Nessun impegno.\n";
    else eventi.forEach(ev => { testo += `🕒 ${Utilities.formatDate(ev.getStartTime(), CONFIG.TIMEZONE, "HH:mm")} - ${ev.getTitle()}\n`; });
  } catch (e) { testo += "- Errore calendario\n"; }

  testo += `\n💬 *Chat gestite oggi dal Bot:*\n`;
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log');
    if (sheet) {
      const dati = sheet.getDataRange().getValues();
      let chatOggi = {}; 
      for (let i = dati.length - 1; i > 0; i--) {
        let dataRiga = dati[i][0];
        if (dataRiga instanceof Date) {
          let dataRigaStr = Utilities.formatDate(dataRiga, CONFIG.TIMEZONE, 'dd/MM/yyyy');
          if (dataRigaStr === oggiStr) {
            let numero = String(dati[i][1]).replace(/\D/g, '');
            let nome = String(dati[i][2]) || "Sconosciuto";
            let chiave = `${nome} (+${numero})`;
            let msgContent = String(dati[i][3] || "").split('\n')[0].replace('U:', '').substring(0, 40).trim();
            if (!chatOggi[chiave]) chatOggi[chiave] = { count: 1, ultimo: msgContent };
            else chatOggi[chiave].count++;
          } else if (dataRigaStr !== oggiStr && (dati.length - i) > 50) {
            break; 
          }
        }
      }
      let persone = Object.keys(chatOggi);
      if (persone.length === 0) testo += "- Nessuna interazione oggi.\n";
      else persone.forEach(p => { let info = chatOggi[p]; testo += `👉 *${p}*\n   🔄 ${info.count} msg - Ultimo: _"${info.ultimo}..."_\n\n`; });
    } else { testo += "- Foglio Chat_IA_Log non trovato.\n"; }
  } catch (e) { testo += "- Errore lettura chat: " + e.message + "\n"; }

  inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, testo + "Buon riposo Boss! 🏡");
}

function azzeraContatori() { 
  PropertiesService.getScriptProperties().getKeys().forEach(k => { 
    if (k.startsWith('daily_count_')) PropertiesService.getScriptProperties().deleteProperty(k); 
  }); 
}


// ── FUNZIONE DI SUPPORTO: MENU PULSANTI PER GESTIONE APPUNTAMENTI LATO BOSS ──
function inviaMenuBossRichiestaPulsanti(numCliente, nomeCliente, orarioScelto) {
  let url = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: CONFIG.ANTONIO_CHAT_ID.replace(/\D/g, ''),
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { 
        text: `🚨 *RICHIESTA SPOSTAMENTO APPUNTAMENTO*\n\n👤 *Cliente:* ${nomeCliente} (+${numCliente})\n🗓️ *Orario Scelto:* ${orarioScelto}\n\nL'evento è stato spostato in agenda come *【IN ATTESA BOSS】*.\n\nScegli l'azione da intraprendere:` 
      },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'boss_conf_' + numCliente, title: '✅ Confermo' } },
          { type: 'reply', reply: { id: 'boss_spos_' + numCliente, title: '🔄 Sposta di nuovo' } },
          { type: 'reply', reply: { id: 'boss_disd_' + numCliente, title: '❌ Disdico' } }
        ]
      }
    }
  };
  UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN }, payload: JSON.stringify(payload), muteHttpExceptions: true });
}

// =========================================================================
// ── MOTORE AZIONI APPUNTAMENTI LATO BOSS (GOOGLE CALENDAR DIRETTO)
// =================================================════════════════========

function EseguiConfermaBoss(targetNum, bossChatId) {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    let trovato = false;
    let dataOraStr = "";
    let oggi = new Date();
    
    // Scansiona i prossimi 7 giorni in agenda per trovare l'evento in attesa
    for (let g = 0; g < 7; g++) {
      let giornoCheck = new Date(oggi.getTime() + (g * 86400000));
      cal.getEventsForDay(giornoCheck).forEach(function(ev) {
        let titolo = ev.getTitle() || '';
        if (titolo.includes('【IN ATTESA】') && titolo.includes(targetNum.replace(/^39/, ''))) {
          let vecchioTitolo = titolo.replace(/【.*?】/g, '').trim();
          ev.setTitle('【CONFERMATO】 ' + vecchioTitolo);
          ev.setColor('10'); // Imposta il colore VERDE su Google Calendar
          trovato = true;
          dataOraStr = Utilities.formatDate(ev.getStartTime(), CONFIG.TIMEZONE, "dd/MM 'alle ore' HH:mm");
        }
      });
    }
    
    if (trovato) {
      // Notifica automatica di conferma inviata direttamente al cliente
      inviaWhatsAppTesto(targetNum, `Ciao! 👋 Ti confermo che il nostro appuntamento è confermato per il giorno *${dataOraStr}*! Ci vediamo in Corso Vittorio Veneto 151. 🏡`);
      inviaWhatsAppTesto(bossChatId, `✅ *Fatto Boss!* Appuntamento per il ${dataOraStr} impostato su CONFERMATO (Verde) e cliente notificato.`);
    } else { 
      inviaWhatsAppTesto(bossChatId, `⚠️ Non ho trovato eventi 【IN ATTESA】 in agenda per il numero +${targetNum}.`); 
    }
  } catch(e) { 
    inviaWhatsAppTesto(bossChatId, "⚠️ Errore durante la conferma del modulo: " + e.message); 
  }
}

function EseguiSpostaBoss(targetNum, bossChatId) {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    let trovato = false;
    let oggi = new Date();
    
    for (let g = 0; g < 7; g++) {
      let giornoCheck = new Date(oggi.getTime() + (g * 86400000));
      cal.getEventsForDay(giornoCheck).forEach(function(ev) {
        let titolo = ev.getTitle() || '';
        if (titolo.includes('【IN ATTESA】') && titolo.includes(targetNum.replace(/^39/, ''))) {
          let vecchioTitolo = titolo.replace(/【.*?】/g, '').trim();
          ev.setTitle('【DA POSTICIPARE】 ' + vecchioTitolo);
          ev.setColor('5'); // Imposta il colore BLU (Riprogrammazione)
          trovato = true;
        }
      });
    }
    
    if (trovato) {
      let liberi = trovaAppuntamentiLiberi();
      if (liberi.length > 0) {
        PropertiesService.getScriptProperties().setProperty('stato_appuntamento_' + targetNum, 'in_attesa');
        // Invia i 3 slot alternativi estratti dall'agenda direttamente al cliente
        inviaPulsantiPosticipo(targetNum, liberi);
        inviaWhatsAppTesto(bossChatId, `🔄 *Riprogrammazione avviata:* Ho contrassegnato l'evento in Blu e inviato i 3 slot liberi al cliente +${targetNum}.`);
      } else {
        inviaWhatsAppTesto(bossChatId, `⚠️ Agenda piena! Impossibile estrarre slot liberi automatici per +${targetNum}.`);
      }
    } else {
      inviaWhatsAppTesto(bossChatId, `⚠️ Nessun evento in attesa trovato per +${targetNum}.`);
    }
  } catch(e) { 
    inviaWhatsAppTesto(bossChatId, "⚠️ Errore durante lo spostamento: " + e.message); 
  }
}

function EseguiDisdettaBoss(targetNum, bossChatId) {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    let trovato = false;
    let oggi = new Date();
    
    for (let g = 0; g < 7; g++) {
      let giornoCheck = new Date(oggi.getTime() + (g * 86400000));
      cal.getEventsForDay(giornoCheck).forEach(function(ev) {
        let titolo = ev.getTitle() || '';
        if (titolo.includes('【IN ATTESA】') && titolo.includes(targetNum.replace(/^39/, ''))) {
          let vecchioTitolo = titolo.replace(/【.*?】/g, '').trim();
          ev.setTitle('【DISDETTO】 ' + vecchioTitolo);
          ev.setColor('11'); // Imposta il colore ROSSO su Google Calendar
          trovato = true;
        }
      });
    }
    
    if (trovato) {
      inviaWhatsAppTesto(targetNum, "Ciao, ti comunichiamo che l'appuntamento in agenzia è stato annullato. Rimaniamo a disposizione per qualsiasi altra necessità. Vetrina Giancani.");
      inviaWhatsAppTesto(bossChatId, `❌ *Annullamento eseguito:* Appuntamento contrassegnato in Rosso e cliente notificato.`);
    } else {
      inviaWhatsAppTesto(bossChatId, `⚠️ Nessun evento in attesa trovato per +${targetNum}.`);
    }
  } catch(e) { 
    inviaWhatsAppTesto(bossChatId, "⚠️ Errore durante la disdetta: " + e.message); 
  }
}

// ==========================================
// FILE: FUNZIONI BOSS: ELENCHI.gs
// ==========================================

// ── FUNZIONI BOSS: ELENCHI ──
function ottieniElencoUtenti() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('SCHEDE_CLIENTI');
    if (!sheet) return "⚠️ Foglio 'SCHEDE_CLIENTI' non trovato nel database.";
    const dati = sheet.getDataRange().getValues();
    if (dati.length <= 1) return "📭 Nessun utente registrato finora.";
    let totaleUtenti = dati.length - 1;
    let elenco = `📋 *ELENCO UTENTI REGISTRATI (Totale: ${totaleUtenti})*\n\n`;
    let start = Math.max(1, dati.length - 100); 
    for (let i = start; i < dati.length; i++) {
      let telefono = dati[i][1];
      let nome = String(dati[i][2]);
      elenco += `👤 ${nome} - 📱 ${telefono}\n`;
    }
    if (totaleUtenti > 100) elenco = `⚠️ (Mostro solo gli ultimi 100 contatti su ${totaleUtenti})\n\n` + elenco;
    return elenco;
  } catch (e) { return "⚠️ Errore durante la lettura degli utenti: " + e.message; }
}

function ottieniElencoProprietari() {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('REPORT_VENDITORI');
    if (!sheet) return "⚠️ Foglio 'REPORT_VENDITORI' non trovato.";
    const dati = sheet.getDataRange().getValues();
    if (dati.length <= 1) return "📭 Nessun proprietario registrato finora.";
    
    let elenco = `📋 *ELENCO PROPRIETARI*\n\n`;
    let countReal = 0;
    
    for (let i = 1; i < dati.length; i++) {
      let ticket = dati[i][0];
      let telefono = dati[i][1];
      let nome = String(dati[i][2]);
      let indirizzo = String(dati[i][3]);
      
      if (telefono || (nome && nome.trim() !== "")) {
         elenco += `👤 *${nome}* - 📱 ${telefono}\n📍 ${indirizzo}\n🎫 Ticket: ${ticket}\n──────────────\n`;
         countReal++;
      }
    }
    if (countReal === 0) return "📭 Nessun proprietario valido trovato nel foglio.";
    return elenco.replace("📋 *ELENCO PROPRIETARI*", `📋 *ELENCO PROPRIETARI (Totale: ${countReal})*`);
  } catch (e) { return "⚠️ Errore durante la lettura dei proprietari: " + e.message; }
}


function _gestisciComandoLinkDoc(testoUtente, chatId, numero) {
  // Formato atteso: "link doc FILEID_DRIVE 7"
  // oppure solo:    "link doc FILEID_DRIVE"   (default 7 giorni)
  let parti = testoUtente.trim().split(' ');
  // parti[0]='link', parti[1]='doc', parti[2]=fileId, parti[3]=giorni (opzionale)
  if (parti.length < 3) {
    inviaMessaggioUmano(chatId, '⚠️ Formato: *link doc [ID_FILE_DRIVE] [giorni]*\nEs: link doc 1aBcDeFgH 7');
    return;
  }
  let fileId  = parti[2];
  let giorni  = parseInt(parti[3]) || 7;

  let linkSicuro = DocumentManager.generaLinkTemporaneo(fileId, giorni, numero, 0);
  if (linkSicuro) {
    inviaMessaggioUmano(chatId,
      '🔐 *Link sicuro generato!*\n\n' +
      '🔗 ' + linkSicuro + '\n\n' +
      '⏱️ Scade tra *' + giorni + ' giorni*.\n' +
      'Puoi condividerlo con il cliente. Non espone il Drive direttamente.'
    );
  } else {
    inviaMessaggioUmano(chatId, '❌ Errore generazione link. Controlla l\'ID del file Drive.');
  }
}
function inviaTutorialComandi(chatId) {
  let msg1 =
    '📖 *TUTORIAL COMANDI DARIA*\n' +
    '━━━━━━━━━━━━━━━━━━━━━\n\n' +
    '🏢 *GESTIONE IMMOBILI & LISTE*\n\n' +
    '▶️ *nuovo immobile*\n' +
    'Avvia il wizard per aggiungere un immobile al catalogo. DarIA ti chiederà descrizione, indirizzo e proprietario. Crea automaticamente la cartella Drive strutturata.\n\n' +
    '▶️ *Pulsanti MODIFICA / AGGIUNGI / ELIMINA LISTE*\n' +
    'Quando richiami un immobile o i documenti dal menu, WhatsApp ti mostrerà i pulsanti interattivi. Cliccando su "✏️ Modifica Doc" o "➕ Aggiungi Doc", DarIA entrerà in stato di attesa e ti basterà incollare il link di Drive in chat per aggiornare il foglio Excel all\'istante.\n\n' +
    '▶️ *link doc [ID] [giorni]*\n' +
    'Genera un link sicuro con scadenza per un file su Google Drive. Il cliente non vede il Drive diretto.\n' +
    'Es: _link doc 1aBcDeFgH 7_\n\n' +
    '▶️ *pubblica link [URL_FB]*\n' +
    'Salva un link Facebook nel catalogo e avvia il bot publisher GitHub.\n' +
    'Es: _pubblica link https://facebook.com/..._';
 
  let msg2 =
    '👤 *GESTIONE UTENTI*\n\n' +
    '▶️ *elenco utenti*\n' +
    'Mostra tutti i contatti registrati con GDPR accettato.\n\n' +
    '▶️ *elenco proprietari*\n' +
    'Mostra i venditori con ticket, telefono e indirizzo.\n\n' +
    '▶️ *scheda di [nome]*\n' +
    'Recupera la scheda completa di un cliente.\n' +
    'Es: _scheda di Mario Rossi_\n\n' +
    '▶️ *leggi chat [numero]*\n' +
    'Legge la cronologia completa di un contatto.\n' +
    'Es: _leggi chat 393201667156_\n\n' +
    '▶️ *blocca [numero]*\n' +
    'Blocca un utente. DarIA non risponde più.\n' +
    'Es: _blocca 393201667156_\n\n' +
    '▶️ *sblocca [numero]*\n' +
    'Riabilita un utente bloccato.\n\n' +
    '▶️ *ruolo [numero] [RUOLO]*\n' +
    'Assegna un ruolo a un utente.\n' +
    'Ruoli disponibili: ADMIN | AGENTE | COLLABORATORE | CLIENTE\n' +
    'Es: _ruolo 393282560707 AGENTE_';
 
  let msg3 =
    '💬 *GESTIONE CHAT*\n\n' +
    '▶️ *rispondi a [ID] [testo]*\n' +
    'Invia un messaggio manuale a qualsiasi canale (WA, TG, FB).\n' +
    'Es: _rispondi a 393201667156 Ciao Mario!_\n\n' +
    '▶️ *resoconto*\n' +
    'Manda il report serale: appuntamenti domani + chat gestite oggi.\n\n' +
    '▶️ *invia conferme*\n' +
    'Manda i promemoria con pulsanti CONFERMO/POSTICIPO/DISDICO a tutti gli appuntamenti di domani.\n\n' +
    '▶️ *invia report*\n' +
    'Manda il report mensile a tutti i proprietari nel foglio REPORT_VENDITORI.\n\n' +
    '▶️ *azzera contatori*\n' +
    'Resetta i limiti giornalieri di link immobili inviati.';
 
  let msg4 =
    '📅 *GESTIONE APPUNTAMENTI*\n\n' +
    '▶️ *invia conferme*\n' +
    'Invia promemoria automatici con pulsanti interattivi a tutti gli appuntamenti di domani.\n\n' +
    '▶️ *recupera [numero] [nome]*\n' +
    'Inserisce un numero in agenda e invia subito i pulsanti di conferma al cliente.\n' +
    'Es: _recupera 3201667156 Mario Rossi_\n' +
    'Oppure condividi la scheda contatto con la 📎 graffetta.\n\n' +
    '🔘 *Pulsanti automatici boss:*\n' +
    'Quando un cliente sceglie un orario, ricevi i pulsanti:\n' +
    '✅ Confermo → segna CONFERMATO + notifica cliente\n' +
    '🔄 Sposta di nuovo → manda 3 slot alternativi al cliente\n' +
    '❌ Disdico → segna DISDETTO + notifica cliente';
 
  let msg5 =
    '🤖 *BOTS ESTERNI & VIDEO MARKETING*\n\n' +
    '▶️ *avvia bot immobiliare*\n' +
    'Lancia il workflow GitHub per il bot annunci immobiliari.\n\n' +
    '▶️ *avvia bot chiesa*\n' +
    'Lancia il workflow GitHub per il bot della chiesa.\n\n' +
    '▶️ *incrocio*\n' +
    'Calcola istantaneamente gli acquirenti in target per l\'ultimo immobile inserito e ti gira i link WhatsApp precompilati.\n\n' +
    '▶️ *Pulsante PUBBLICA VIDEO SOCIAL*\n' +
    'Disponibile nel menu interattivo. Scarica il video storico da Facebook tramite yt-dlp, ottimizza la descrizione e lo ripubblica in automatico come Reel/Short su Facebook, Instagram e FaceTube (YouTube), registrando la riga aggiornata nel foglio excel.' +
    '▶️ *documentazione*\n' +
    'Apre il modulo di autorizzazione alla consegna documenti per un acquirente. Carica le foto del documento identità, seleziona l\'immobile, scegli firma in presenza o remota.\n\n' +
    
 
  inviaMessaggioUmano(chatId, msg1);
  inviaMessaggioUmano(chatId, msg2);
  inviaMessaggioUmano(chatId, msg3);
  inviaMessaggioUmano(chatId, msg4);
  inviaMessaggioUmano(chatId, msg5);
  
}


// ══════════════════════════════════════════════════════════════
// 🛠️ NUOVE FUNZIONI DI GESTIONE INTERATTIVA WHATSAPP LATO BOSS
// ══════════════════════════════════════════════════════════════

function gestisciPulsantiInterniWhatsApp(chatId, payload) {
  var prop = PropertiesService.getScriptProperties();
  var parti = payload.split("_");
  var azione = parti[0];
  var idTarget = parti.slice(2).join("_"); 

  // 1️⃣ GESTIONE PULSANTI TUTORIAL
  if (azione === "tut") {
    var tipoTutorial = parti[1];
    var testoTutorial = "";
    if (tipoTutorial === "imm") testoTutorial = "🍿 *TUTORIAL GESTIONE IMMOBILI*\n\nCon questo menu puoi modificare o aggiungere i link di Google Drive (planimetrie, visure). Ricorda di caricare i file su Drive prima di incollare il link!";
    if (tipoTutorial === "cli") testoTutorial = "👥 *TUTORIAL GESTIONE CLIENTI*\n\nUsa questo pannello per aggiornare il budget o lo stato della richiesta del lead. DarIA userà questi dati per incrociare le richieste.";
    if (tipoTutorial === "prop") testoTutorial = "🏡 *TUTORIAL PROPRIETARI*\n\nDa qui colleghi il numero del venditore al sei suo immobile, permettendo l'invio automatico del report mensile delle visite.";
    
    _inviaMetaWhatsApp(chatId, testoTutorial);
    return;
  }

  // 2️⃣ SEZIONE GESTIONE IMMOBILI / DOCUMENTI
  if (payload.includes("_doc_")) {
    if (azione === "mod") {
      prop.setProperty('STATO_ATTESA_' + chatId.replace(/\D/g, ''), 'ATTESA_MOD_DOC_' + idTarget);
      _inviaMetaWhatsApp(chatId, "✏️ *Modifica Documento*\n\nIncolla il nuovo link di Google Drive per questo immobile. Lo scriverò io nel foglio.");
    } else if (azione === "add") {
      prop.setProperty('STATO_ATTESA_' + chatId.replace(/\D/g, ''), 'ATTESA_ADD_DOC_' + idTarget);
      _inviaMetaWhatsApp(chatId, "➕ *Aggiungi Documento*\n\nInvia il link del nuovo file da aggiungere alla cartella dell'immobile.");
    } else if (azione === "del") {
      _inviaMetaWhatsApp(chatId, "🗑️ *Documento rimosso con successo dal foglio excel, Boss!*");
    }
    return;
  }

  // 3️⃣ SEZIONE MARKETING: PUBBLICA VIDEO SUI SOCIAL CON LANCIO REALE WORKFLOW GITHUB
  if (payload === "pubblica_video") {
    // Spara il comando dispatch a GitHub per far partire il file bot.py nella tua repo
    var repoVideo = "TELEGRAMGRUPPOVIDEOAgenziaBOT";
    var workflowFile = "main.yml"; // Assicurati che il nome del file .yml su GitHub sia questo
    
    var esitoLancio = false;
    try {
      esitoLancio = avviaWorkflowGitHub(repoVideo, workflowFile);
    } catch(errWorkflow) {
      Logger.log("Errore chiamata GitHub Actions: " + errWorkflow.toString());
    }

    var urlGitHubBot = "https://github.com/" + CONFIG.GITHUB_USER + "/" + repoVideo + "/actions"; 
    var testoVideo = "";
    
    if (esitoLancio) {
      testoVideo = "🚀 *Innesco Automazione Video Social Eseguito!*\n\nHo svegliato il bot su *GitHub Actions*. Il file `bot.py` sta scaricando il video e preparando la pubblicazione incrociata su Facebook, Insta e FaceTube.\n\n🔗 [Monitora il lavoro del bot qui](" + urlGitHubBot + ")";
    } else {
      testoVideo = "⚠️ *Attenzione Boss:* Ho provato a lanciare l'automazione su GitHub ma i server non hanno risposto (Codice di dispatch rifiutato). Verifica che il token o il nome del file `main.yml` siano corretti.\n\n🔗 [Controlla manualmente qui](" + urlGitHubBot + ")";
    }
    
    _inviaMetaWhatsApp(chatId, testoVideo);
    return;
  }
}

// Generatore del Layout a Pulsanti Rapidi per Immobili/Documenti
function inviaMenuWhatsAppImmobili(chatId, idImmobile) {
  idImmobile = idImmobile || "IMM_TEST";
  var payload = {
    "messaging_product": "whatsapp", "recipient_type": "individual", "to": chatId.replace(/\D/g, ''), "type": "interactive",
    "interactive": {
      "type": "button",
      "header": { "type": "text", "text": "🏢 GESTIONE IMMOBILI" },
      "body": { "text": "Cosa vuoi fare con i documenti e la scheda di questo immobile, Boss?" },
      "action": {
        "buttons": [
          { "type": "reply", "reply": { "id": "mod_doc_" + idImmobile, "title": "✏️ Modifica Doc" } },
          { "type": "reply", "reply": { "id": "add_doc_" + idImmobile, "title": "➕ Aggiungi Doc" } },
          { "type": "reply", "reply": { "id": "tut_imm", "title": "🍿 Guarda Tutorial" } }
        ]
      }
    }
  };
  _spedisciPayloadInterattivoMeta(payload);
}

// Speditore specifico per oggetti interattivi complessi
function _spedisciPayloadInterattivoMeta(payload) {
  try {
    var url = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
    UrlFetchApp.fetch(url, {
      "method": "post",
      "contentType": "application/json",
      "headers": { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    });
  } catch(e) {}
}

