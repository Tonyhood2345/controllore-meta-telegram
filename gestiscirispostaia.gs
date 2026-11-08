// ==========================================

function gestisciRispostaIA(chatId, numero, testoUtente, waName) {
  waName       = waName || '';
  const testoNorm = testoUtente.toLowerCase().trim();
  const ruoloUtente = AccessControl.getRuolo(numero);
  
 
  // 🎯 SBLOCCO AMMINISTRATORE FISSO: Se il numero è il tuo, sei il BOSS sempre e comunque!
     let isBoss = String(numero).includes("393201667156") || String(chatId).includes("393201667156") || (ruoloUtente === Ruoli.ADMIN);
  
  const isAgente    = (ruoloUtente === Ruoli.AGENTE || ruoloUtente === Ruoli.ADMIN);
  const prop      = PropertiesService.getScriptProperties();

// ══════════════════════════════════════════════════════════
    // 🛠️ AREA COMANDI RISERVATI: BOSS & AMMINISTRATORI
    // ══════════════════════════════════════════════════════════
    if (isBoss) {

      if (testoNorm === 'annulla' || testoNorm.includes('comandi') || testoNorm.includes('funzioni') || testoNorm.includes('resoconto')) {
        prop.deleteProperty('stato_carica_' + numero);
        prop.deleteProperty('stato_modifica_' + numero);
        prop.deleteProperty('stato_pubblica_' + numero);
        prop.deleteProperty('stato_regia_' + numero);
        if (testoNorm === 'annulla') { inviaMessaggioUmano(chatId, "❌ Operazione guidata annullata, Boss."); return; }
        // ← Invia il menu e fermati subito
        if (testoNorm.includes('comandi') || testoNorm.includes('funzioni')) {
          if (String(chatId).startsWith('TG_') || String(chatId).startsWith('FB_')) {
            inviaMessaggioUmano(chatId, '🛠️ *SUPER MENU BOSS*\n\n📊 resoconto\n🚀 nuovo immobile\n👥 elenco utenti\n🏡 elenco proprietari\n📅 invia conferme\n📈 invia report\n🔄 azzera contatori');
          } else {
            inviaMenuBossWhatsApp(numero);
          }
          return;
        }
      }

      // ── 🔥 INNESTO CHIRURGICO 2: ATTIVAZIONE DIGITANDO "menu" ──
      if (testoNorm === 'menu') {
        inviaMenuBossWhatsApp(numero);
        return; // Ferma l'esecuzione qui evitando che l'IA risponda sopra al menu
      }

      // [LO STATO REGIA CHAT COCKPIT LIVE CHE SEGUE...]
      let statoRegia = prop.getProperty('stato_regia_' + numero);
    if (statoRegia === 'attesa_numero') {
      let targetNum = testoUtente.replace(/\D/g, ''); // Pulisce il testo tenendo solo i numeri
      
      if (targetNum.length < 9) {
        inviaMessaggioUmano(chatId, "⚠️ *Numero non valido.* Inserisci un numero di telefono corretto (almeno 9 cifre) oppure scrivi \"annulla\":");
        return;
      }
      
      // Auto-aggiunta del prefisso Italia se manca
      if (!targetNum.startsWith("39") && targetNum.startsWith("3")) {
        targetNum = "39" + targetNum;
      }
      
      // Cerca se il nome è già registrato in rubrica
      let nomeTrovato = cercaNomeInRubrica(targetNum) || "Cliente";
      let urlCockpitLive = CONFIG.MASTER_WEBAPP_URL + "?chat=" + targetNum + "&nome=" + encodeURIComponent(nomeTrovato); 
      let msgCockpitLive = `🧑‍💼 *Console Controllo Regia Live*\n\nHo configurato lo schermo per l'utente richiesto:\n👤 *Cliente:* ${nomeTrovato}\n📱 *ID:* +${targetNum}\n\n👉 Tocca il pulsante sotto per aprire lo storico completo e gestire DarIA:`;
      
      // Spara la card con il pulsante URL al tuo WhatsApp
      inviaWhatsAppBottoneLink(numero, msgCockpitLive, "Apri Chat Live 💬", urlCockpitLive);
      
      // Spegne lo stato di attesa
      prop.deleteProperty('stato_regia_' + numero);
      return;
    }

    // 🚀 INTERRUTTORE WIZARD: NUOVO IMMOBILE + DRIVE
    if (testoNorm === 'btn_nuovo_immobile' || testoNorm.includes('nuovo immobile')) {
      prop.setProperty('stato_carica_' + numero, 'attesa_messaggio'); 
      inviaMessaggioUmano(chatId, '🚀 *DARIA GUIDA INSERIMENTO IMMOBILE*\n\nGira o incolla qui la *Descrizione del post* comprensiva dei link social esistenti. Io estrarrò i link e passerò allo step successivo.\n\n_Scrivi "annulla" per fermarti._');
      return;
    }

    // 🗑️ INTERRUTTORE DISMESSA RECORD: CANCELLA IMMOBILE
    if (testoNorm.startsWith('cancella immobile ')) {
      let queryCancella = testoUtente.substring(18).trim().toLowerCase();
      let sheetDB = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("DATABASE_IMMOBILI");
      let datiDB = sheetDB.getDataRange().getValues();
      let eliminato = false;

      for (let i = 1; i < datiDB.length; i++) {
        if (String(datiDB[i][0]).toLowerCase() === queryCancella || String(datiDB[i][4]).toLowerCase().includes(queryCancella)) {
          sheetDB.deleteRow(i + 1); 
          inviaMessaggioUmano(chatId, `🗑️ Record immobile *${queryCancella.toUpperCase()}* rimosso con successo dal database!`);
          eliminato = true;
          break;
        }
      }
      if (!eliminato) inviaMessaggioUmano(chatId, "⚠️ Immobile non trovato nel foglio.");
      return;
    }

    // 📢 INTERRUTTORE PUBBLICAZIONE: LINK + GENERAZIONE COPY IA
    if (testoNorm.startsWith('pubblica link ') || prop.getProperty('stato_pubblica_' + numero) === 'attesa_descrizione') {
      let linkSocial = prop.getProperty('stato_pubblica_' + numero) === 'attesa_descrizione' ? testoUtente.trim() : testoUtente.substring(14).trim();
      
      if (!linkSocial.startsWith('http')) {
        prop.setProperty('stato_pubblica_' + numero, 'attesa_descrizione');
        inviaMessaggioUmano(chatId, "🔗 Boss, inviami il *Link completo (URL)* da elaborare:");
        return;
      }

      inviaMessaggioUmano(chatId, "🤖 _Analisi del link e generazione copy in corso con Groq..._");
      let profiloAgenzia = ottieniProfiloAgenzia();
      let promptCopymaker = `Sei DarIA, l'esperta copywriter dell'Immobiliare Giancani di Favara. Profilo: ${profiloAgenzia}. Genera un post di vendita immobiliare persuasivo, ricco di emoji, inserendo Corso Vittorio Veneto 151 a Favara ed il telefono 393201667156. Basati su questo link: ${linkSocial}. Rispondi SOLO col testo del post finito.`;
      
      let copyGenerato = callGroq(promptCopymaker, "Crea testo post");
      prop.setProperty('temp_link_fb_' + numero, linkSocial);
      prop.setProperty('stato_pubblica_' + numero, 'attesa_conferma_finale');

      let msgVerifica = `📝 *PROPOSTA DI POST GENERATA PER FACEBOOK:*\n\n${copyGenerato}\n\n═════════════════════\n👉 *Boss, rispondi con "OK" per pubblicare questo testo su GitHub, oppure scrivi direttamente la descrizione che preferisci per sovrascriverlo!*`;
      inviaMessaggioUmano(chatId, msgVerifica);
      return;
    }

    // Macchina a stati finale per la conferma ed invio a GitHub
    if (prop.getProperty('stato_pubblica_' + numero) === 'attesa_conferma_finale') {
      let linkDaInviare = prop.getProperty('temp_link_fb_' + numero);
      let testoFinalePost = testoNorm === 'ok' ? "Nuova splendida occasione in esclusiva Immobiliare Giancani!" : testoUtente;
      
      try {
        let sheetPE = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Piano_Editoriale_2026');
        sheetPE.appendRow(["POST_" + Math.floor(Math.random()*1000), Utilities.formatDate(new Date(), CONFIG.TIMEZONE, "dd/MM/yyyy"), testoFinalePost, "VIDEO", linkDaInviare, "SI", 0]);
        avviaWorkflowGitHub('TELEGRAMGRUPPOVIDEOAgenziaBOT', 'main.yml');
        inviaMessaggioUmano(chatId, "✅ *POST INVIATO A GITHUB!* Inserito nel Piano Editoriale 2026 ed attivato il bot Actions. 🚀");
      } catch(e) { inviaMessaggioUmano(chatId, "❌ Errore scrittura foglio post: " + e.message); }
      
      prop.deleteProperty('stato_pubblica_' + numero);
      prop.deleteProperty('temp_link_fb_' + numero);
      return;
    }

    if (testoNorm === 'btn_tutorial' || testoNorm.includes('tutorial comandi')) {
      inviaTutorialComandi(chatId);
      return;
    }

    if (testoNorm === 'btn_apri_reels_vetrina' || testoNorm === '🍿 guarda i video') {
      inviaPulsanteReels(numero);
      return;
    }

    // 🔥 1. COMANDO SPECIFICO: INVIA VETRINA CON PULSANTE A UN CLIENTE
    if (testoNorm.startsWith('invia vetrina ')) {
      let targetNum = testoNorm.replace('invia vetrina ', '').replace(/\D/g, '');
      if (targetNum.length < 8) {
         inviaMessaggioUmano(chatId, '⚠️ Errore: Inserisci un numero di telefono valido. Es: invia vetrina 3201234567');
         return;
      }
      if (!targetNum.startsWith("39")) targetNum = "39" + targetNum;
      
      inviaPulsanteReels(targetNum);
      inviaMessaggioUmano(chatId, `✅ BOOM! Vetrina Reels inviata con PULSANTE CTA NATIVO a +${targetNum}! 🚀`);
      return;
    }

    // 🔥 2. COMANDO GENERICO: RICHIESTA VETRINA PER IL BOSS STESSO
    if (testoNorm.includes('vetrina')) {
      if (!String(chatId).startsWith('TG_') && !String(chatId).startsWith('FB_')) {
        inviaPulsanteReels(numero);
      } else {
        let urlReels = CONFIG.MASTER_WEBAPP_URL + "?reels=1";
        inviaWhatsAppTesto(chatId, `🍿 *La tua Vetrina Reels è pronta!*\n\n👉 ${urlReels}`);
      }
      return;
    }
 
    if (testoNorm === 'btn_link_doc' || testoNorm.startsWith('link doc ')) {
      if (testoNorm === 'btn_link_doc') {
        inviaMessaggioUmano(chatId,
          '🔐 *Genera Link Documento*\n\n' +
          'Scrivi:\n*link doc [ID_FILE_DRIVE] [giorni]*\n\n' +
          'Es: _link doc 1aBcDeFgHiJkLmN 7_'
        );
      } else {
        _gestisciComandoLinkDoc(testoUtente, chatId, numero);
      }
      return;
    }

    // 🚨 🔘 PULSANTI INTERATTIVI DI GESTIONE APPUNTAMENTI PER IL BOSS
    if (testoNorm.startsWith('boss_conf_')) { 
      let targetNum = testoNorm.replace('boss_conf_', '').trim(); 
      EseguiConfermaBoss(targetNum, chatId); 
      return; 
    }
    if (testoNorm.startsWith('boss_spos_')) { 
      let targetNum = testoNorm.replace('boss_spos_', '').trim(); 
      EseguiSpostaBoss(targetNum, chatId); 
      return; 
    }
    if (testoNorm.startsWith('boss_disd_')) { 
      let targetNum = testoNorm.replace('boss_disd_', '').trim(); 
      EseguiDisdettaBoss(targetNum, chatId); 
      return; 
    }
    if (testoNorm.startsWith('pubblica link ')) {
      let linkDaPubblicare = testoUtente.substring(14).trim();
      if (!linkDaPubblicare.includes('facebook.com')) { inviaMessaggioUmano(chatId, '⚠️ Errore link FB.'); return; }
   



      try {
        let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Foglio1');
        let headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        let colFB = headers.indexOf('Link_Facebook'), colPub = headers.indexOf('Pubblicato'), colDesc = headers.indexOf('Descrizione'), colTipo = headers.indexOf('Tipo');
        let nuovaRiga = new Array(headers.length).fill('');
        nuovaRiga[colFB] = linkDaPubblicare; nuovaRiga[colPub] = 'SI';
        if (colDesc > -1) nuovaRiga[colDesc] = 'Un\'altra splendida occasione in esclusiva!';
        if (colTipo > -1) nuovaRiga[colTipo] = 'POST';
        sheet.appendRow(nuovaRiga);
        avviaWorkflowGitHub('TELEGRAMGRUPPOVIDEOAgenziaBOT', 'main.yml');
        inviaMessaggioUmano(chatId, '✅ Link salvato e Bot attivato. 🚀');
      } catch(e) { inviaMessaggioUmano(chatId, '❌ Errore: ' + e.message); }
      return;
    }
    
    if (testoNorm.includes('avvia bot immobiliare')) { avviaBotGitHub('bot-immobiliare-giancani-Antonio', 'orario.yml', 'main', chatId); return; }
    if (testoNorm.includes('avvia bot chiesa')) { avviaBotGitHub('Bot-Chiesa-Frasi-quotidiani', 'bot_chiesa-3.yml', 'main', chatId); return; }
    
    if (testoNorm.includes('conferme')) { inviaRichiestaConferme(); inviaMessaggioUmano(chatId, '⏳ Generando richieste...'); return; }
    if (testoNorm.includes('invia report'))   { inviaReportMensileVenditori(); inviaMessaggioUmano(chatId, '⏳ Inizio invio report...'); return; }
    if (testoNorm.includes('azzera contatori')) { azzeraContatori(); inviaMessaggioUmano(chatId, '✅ Contatori azzerati.'); return; }
    
    if (testoNorm === "incrocio") {
      inviaMessaggioUmano(chatId, "⏳ *Calcolo degli incroci in corso, Boss...* Sto setacciando il database richieste.");
      IncrocioImmobileSpecifico(null); 
      return;
    }
    
    if (testoNorm.includes('elenco utenti'))     { inviaMessaggioUmano(chatId, ottieniElencoUtenti()); return; }
    if (testoNorm.includes('elenco proprietari')) { inviaMessaggioUmano(chatId, ottieniElencoProprietari()); return; }

    

    if (testoNorm.includes('resoconto') || testoNorm === 'btn_resoconto') { 
      inviaMessaggioUmano(chatId, '⚙️ Ricevuto comando resoconto. Avvio calcolo dal database...');
      inviaResocontoSerale(); 
      return; 
    }
    
    if (testoNorm.startsWith('blocca '))  { let targetNum = testoNorm.replace('blocca ', '').replace(/\D/g, ''); prop.setProperty('BANNATO_' + targetNum, 'true'); inviaMessaggioUmano(chatId, '🚫 Utente +' + targetNum + ' BLOCCATO.'); return; }
    if (testoNorm.startsWith('sblocca ')) { let targetNum = testoNorm.replace('sblocca ', '').replace(/\D/g, ''); prop.deleteProperty('BANNATO_' + targetNum); inviaMessaggioUmano(chatId, '✅ Utente +' + targetNum + ' SBLOCCATO.'); return; }
    if (testoNorm.startsWith('scheda di'))    { inviaMessaggioUmano(chatId, ottieniSchedaCliente(testoUtente.substring(9).trim())); return; }
    if (testoNorm.startsWith('leggi chat '))  { inviaMessaggioUmano(chatId, ottieniChatCompleta(testoUtente.substring(11).trim())); return; }
    if (testoNorm.startsWith('rispondi a ')) {
      let args = testoUtente.substring(11).trim().split(' '); let targetID = args.shift(); let testoDaInviare = args.join(' ');
      if (!testoDaInviare) { inviaMessaggioUmano(chatId, '⚠️ Formato: rispondi a [Numero/ID] [Tuo Messaggio]'); return; }
      inviaWhatsAppTesto(targetID, testoDaInviare); inviaMessaggioUmano(chatId, '✅ Messaggio recapitato a ' + targetID); return;
    }
    if (testoNorm.includes('nuovo immobile')) { prop.setProperty('stato_carica_' + numero, 'attesa_messaggio'); inviaMessaggioUmano(chatId, '🚀 Gira qui descrizione e link social.'); return; }
    if (testoNorm.startsWith('link doc ')) { _gestisciComandoLinkDoc(testoUtente, chatId, numero); return; }

    if (testoNorm.startsWith('ruolo ')) {
      let partiRuolo = testoUtente.split(' ');
      let targetNum = (partiRuolo[1] || '').replace(/\D/g, '');
      let nuovoRuolo = (partiRuolo[2] || 'CLIENTE').toUpperCase();
      if (targetNum && ['ADMIN','AGENTE','COLLABORATORE','CLIENTE'].includes(nuovoRuolo)) {
        AccessControl.registraUtente(targetNum, 'Utente ' + targetNum, nuovoRuolo);
        inviaMessaggioUmano(chatId, '✅ Ruolo *' + nuovoRuolo + '* assegnato a +' + targetNum);
      } else { inviaMessaggioUmano(chatId, '⚠️ Formato: *ruolo [numero] [ADMIN|AGENTE|COLLABORATORE|CLIENTE]*'); }
      return;
    }

    // STATI AVANZAMENTO WIZARD CARICAMENTO NUOVO IMMOBILE
    let statoC = prop.getProperty('stato_carica_' + numero);
    if (statoC === 'attesa_messaggio') {
      let links = estraiLinkSocial(testoUtente);
      prop.setProperties({ 't_desc': testoUtente.split('http')[0].trim(), 't_yt': links.yt, 't_fb': links.fb, 't_ig': links.ig });
      prop.setProperty('stato_carica_' + numero, 'attesa_indirizzo'); inviaMessaggioUmano(chatId, '✅ Salvati! 📍 Ora scrivi l\'*Indirizzo Completo*.'); return;
    }
    if (statoC === 'attesa_indirizzo') { prop.setProperty('t_ind', testoUtente); prop.setProperty('stato_carica_' + numero, 'attesa_proprietario'); inviaMessaggioUmano(chatId, '📌 Indirizzo ok. 👤 Scrivi *Nome Proprietario* e *Telefono*.'); return; }
    if (statoC === 'attesa_proprietario') {
      let ticket   = generaTicket();
      let dataOggi = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy');
      let infoProp = testoUtente.split(' ');
      let telProp  = infoProp.find(function(x) { return x.match(/\d{8,}/); }) || '';
      let nomeProp = testoUtente.replace(telProp, '').trim();
      let indirizzo = prop.getProperty('t_ind') || '';
      let descrizione = prop.getProperty('t_desc') || '';

      let idCartellaDrive = '';
      try {
        idCartellaDrive = DriveManager.creaCartellaImmobile(nomeProp, indirizzo, dataOggi) || '';
      } catch(e) { SystemLogger.warn('NuovoImmobile', 'Cartella Drive non creata: ' + e.message, null); }

      let rigaDB = new Array(30).fill('');
      rigaDB[CONFIG.COL_DESCRIZIONE] = descrizione;
      rigaDB[CONFIG.COL_YOUTUBE]     = prop.getProperty('t_yt');
      rigaDB[CONFIG.COL_FACEBOOK]    = prop.getProperty('t_fb');
      rigaDB[CONFIG.COL_CITTA]       = indirizzo.split(',').pop().trim();
      rigaDB[1]                      = dataOggi;
      if (CONFIG.COL_CARTELLA_DRIVE) rigaDB[CONFIG.COL_CARTELLA_DRIVE] = idCartellaDrive;
      SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_IMMOBILI').appendRow(rigaDB);

      let rigaRep = new Array(20).fill('');
      rigaRep[CONFIG.REP_TICKET]   = ticket;
      rigaRep[CONFIG.REP_TELEFONO] = telProp;
      rigaRep[CONFIG.REP_VENDITORE]= nomeProp;
      rigaRep[CONFIG.REP_INDIRIZZO]= indirizzo;
      rigaRep[CONFIG.REP_DATA]     = dataOggi;
      rigaRep[CONFIG.REP_LINK_FB]  = prop.getProperty('t_fb');
      SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('REPORT_VENDITORI').appendRow(rigaRep);

      prop.deleteProperty('stato_carica_' + numero);
      SystemLogger.info('NuovoImmobile', 'Immobile aggiunto: ' + nomeProp + ' - ' + indirizzo, { ticket: ticket, drive: idCartellaDrive });

      let msgConferma = '🎉 *COMPLETATO!*\nImmobile in catalogo. Ticket *' + ticket + '*.';
      if (idCartellaDrive) msgConferma += '\n\n📁 Cartella Drive creata con sottocartelle:\nDOCUMENTI / FOTO / PLANIMETRIE / ATTI / APE / VISURE / ALTRO';
      inviaMessaggioUmano(chatId, msgConferma);
      return;
    }

    // 🏦 AGGIORNAMENTO PROMPT ADMIN ANTI-ALLUCINAZIONE
    try {
      let memoriaChat = getBreveMemoria(numero), profilo = ottieniProfiloAgenzia();
      const sysAdmin = `Sei DarIA, l'assistente digitale dell'Agenzia Immobiliare Giancani. Stai parlando con Antonio (il Boss). 
      ⚠️ REGOLA TASSATIVA: Non inventare MAI immobili, prezzi, mq, appuntamenti o dati di log. Se il Boss ti incolla un testo, un errore o un comando che non riconosci, non inventare risposte simulate. Limitati a rispondere in modo sintetico (max 1 riga) chiedendo istruzioni o ricordandogli di digitare 'comandi' per aprire il pannello reale.`;
      
      let rispostaIA = callGroq(sysAdmin, testoUtente);
      inviaMessaggioUmano(chatId, rispostaIA + pescaRisposta('FIRMA'));
      return;
    } catch(e) { return; }
  } // ✅ AREA BOSS CHIUSA CORRETTAMENTE QUI!

  // ══════════════════════════════════════════════════════════
  // 👤 AREA UTENTI COMMERCIALI (ONBOARDING, PRIVACY, ACQUISTI)
  // ══════════════════════════════════════════════════════════
  
  let nome = cercaNomeInRubrica(numero);
  if (!nome) {
    if (prop.getProperty('awaiting_name_' + numero) === 'true') {
      let nomeDigitato = estraiNomeConIA(testoUtente);
      if (!nomeDigitato) { inviaMessaggioUmano(chatId, 'Scusami, potresti scrivermi *solo* il tuo Nome e Cognome?'); return; }
      prop.setProperty('nome_temp_' + numero, nomeDigitato); prop.deleteProperty('awaiting_name_' + numero); prop.setProperty('awaiting_privacy_' + numero, 'true');
      inviaMessaggioUmano(chatId, 'Piacere, ' + nomeDigitato + '! 🤝\nPer aiutarti, la legge (GDPR) mi impone l\'autorizzazione. 👉 *Rispondi "SI" per confermare!*'); return;
    }
    if (prop.getProperty('awaiting_privacy_' + numero) === 'true') {
      if (testoNorm.includes('si') || testoNorm.includes('sì') || testoNorm.includes('ok') || testoNorm.includes('accetto') || testoNorm.includes('confermo')) {
        prop.deleteProperty('awaiting_privacy_' + numero); 
        let nomeDefinitivo = prop.getProperty('nome_temp_' + numero) || waName || 'Cliente';
        try { SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('SCHEDE_CLIENTI').appendRow([new Date(), '+' + numero, nomeDefinitivo, 'Privacy via WhatsApp']); } catch(e) {}
        AccessControl.registraUtente(numero, nomeDefinitivo, 'CLIENTE');
        
        // 🚀 NUOVO PITCH DI PRESENTAZIONE DELLE CAPACITÀ DI DARIA
        let msgPresentazione = `Perfetto ${nomeDefinitivo}! ✅ Il tuo profilo sicuro è attivo.\n\n` +
                               `🤖 *Sono DarIA, l'assistente digitale dell'Immobiliare Giancani, e sono qui per accelerare i tuoi progetti. Ecco tutto quello che posso fare per te all'istante:*\n\n` +
                               `🎬 *1. Vetrina Reels Immersiva:* Chiedimi "vetrina" per accedere alla nostra area riservata stile TikTok e scorrere i video verticali degli immobili.\n\n` +
                               `🎯 *2. Incrocio Predittivo:* Se cerchi casa, inserisci la tua richiesta. Ti incrocerò in automatico con le soluzioni fuori mercato prima che vadano online!\n\n` +
                               `📅 *3. Agenda Digitale H24:* Vuoi visitare una casa? Chiedimi di fissare un appuntamento. Ti mostrerò i giorni liberi e potrai bloccare o spostare l'orario con un clic.\n\n` +
                               `📄 *4. Faldone Documenti:* Vuoi vendere? Scrivimi "vendo" e ti preparerò la checklist esatta dei documenti catastali e urbanistici necessari.\n\n` +
                               `🏦 *5. Simulatore Mutuo Reale:* Chiedimi "mutuo" per simulare all'istante la tua rata ideale all'80% con i tassi aggiornati delle banche reali!\n\n` +
                               `👉 *Dimmi subito, Boss: qual è il tuo obiettivo oggi? Vuoi COMPRARE o VENDERE casa?*`;
                               
        inviaMessaggioUmano(chatId, msgPresentazione); 
        inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '🎉 *NUOVO CONTATTO REGISTRATO*\n' + nomeDefinitivo + ' (+' + numero + ')'); 
        return;
      } else { 
        inviaMessaggioUmano(chatId, '⚠️ Devo prima registrare il tuo consenso per i tuoi dati. 👉 Rispondi *SI* per accettare!'); 
        return; 
      }
    }
    let nomeValidoWA = waName && waName.length > 2 && !CONFIG.TROLL_NAMES.some(function(t) { return waName.toLowerCase().includes(t); });
    if (nomeValidoWA) {
      prop.setProperty('nome_temp_' + numero, waName); prop.setProperty('awaiting_privacy_' + numero, 'true');
      inviaMessaggioUmano(chatId, 'Ciao ' + waName + '! 👋 Sono *DarIA*. Per aiutarti, la legge (GDPR) richiede la tua autorizzazione. 👉 *Rispondi "SI" per accettare e iniziare!*');
    } else {
      prop.setProperty('awaiting_name_' + numero, 'true');
      inviaMessaggioUmano(chatId, 'Ciao! 👋 Sono *DarIA*. Per iniziare, *come ti chiami (Nome e Cognome)?* ✍️');
    }
    return;
  }

  prop.setProperty('nome_cache_' + numero, nome);
  if (/^ciao|^salve|^buongiorno|^buonasera|^inizio/i.test(testoNorm)) { inviaMessaggioUmano(chatId, pescaRisposta('BENVENUTO', nome)); return; }

  if (prop.getProperty('stato_appuntamento_' + numero) === 'in_attesa') {
    if (/lunedì|martedì|mercoledì|giovedì|venerdì|sabato|\d{1,2}\/\d{1,2}/i.test(testoNorm) || /1\)|2\)|3\)/.test(testoNorm) || /^[123]$/.test(testoNorm.trim())) {
      prop.deleteProperty('stato_appuntamento_' + numero);
      
      try {
        const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
        let dateRange = [new Date(), new Date(Date.now() + 86400000), new Date(Date.now() + 172800000)];
        let evDaSpostare = null;
        
        dateRange.forEach(function(d) {
          cal.getEventsForDay(d).forEach(function(ev) {
            if (!evDaSpostare && ev.getTitle().includes(String(numero).replace(/^39/, ''))) {
              evDaSpostare = ev;
            }
          });
        });
        
        if (evDaSpostare) {
          let matchData = testoUtente.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{1,2})/);
          if (matchData) {
            let giorno = parseInt(matchData[1]);
            let mese = parseInt(matchData[2]) - 1;
            let ore = parseInt(matchData[3]);
            let minutes = parseInt(matchData[4]);
            
            let nuovaDataInizio = new Date();
            nuovaDataInizio.setDate(giorno);
            nuovaDataInizio.setMonth(mese);
            nuovaDataInizio.setHours(ore, minutes, 0, 0);
            let nuovaDataFine = new Date(nuovaDataInizio.getTime() + (60 * 60 * 1000));
            
            evDaSpostare.setTime(nuovaDataInizio, nuovaDataFine);
            let vecchioTitolo = evDaSpostare.getTitle().replace(/【.*?】/g, '').trim();
            evDaSpostare.setTitle('【IN ATTESA BOSS】 ' + vecchioTitolo);
            evDaSpostare.setColor('6');
          }
        }
      } catch(e) {}

      inviaMenuBossRichiestaPulsanti(numero, nome, testoUtente);
      inviaMessaggioUmano(chatId, 'Perfetto! Ho girato la tua richiesta ad Antonio. Ti confermeremo la disponibilità a brevissimo! ⏳' + pescaRisposta('FIRMA')); 
      return;
    }
  }

  if (/appuntamento|visionare|visitare|vedere/i.test(testoNorm)) {
    let liberi = trovaAppuntamentiLiberi();
    if (liberi.length > 0) {
      prop.setProperty('stato_appuntamento_' + numero, 'in_attesa');
      let msg = 'Ecco alcuni orari liberi:\n'; liberi.forEach(function(opz, idx) { msg += '👉 ' + (idx + 1) + ') ' + opz + '\n'; }); msg += '\nScrivimi un orario per fissare l\'appuntamento!';
      inviaMessaggioUmano(chatId, msg + pescaRisposta('FIRMA'));
    } else { inviaMessaggioUmano(chatId, 'L\'agenda sembra piena! Scrivi ad Antonio: https://wa.me/393201667156'); }
    return;
  }

  let isIntentVendita = /vendo|voglio vendere|vendere|valutazione/i.test(testoNorm), isAttesaTipoVendita = prop.getProperty('stato_vendita_' + numero) === 'attesa_tipo';
  if (isIntentVendita || isAttesaTipoVendita) {
    let tipoImmobile = estraiCategoriaConIA(testoNorm);
    if (tipoImmobile && tipoImmobile !== 'null') {
      prop.deleteProperty('stato_vendita_' + numero);
      registraRichiestaUnificata(Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'), nome, '+' + numero, 'VENDITA', tipoImmobile, 'N/A', 'Da Valutare');
      inviaMessaggioUmano(chatId, 'Ottima scelta! 🏡 Ecco i documenti necessari per il tuo *' + tipoImmobile.toUpperCase() + '*:\n\n' + ottieniListaDocumenti(tipoImmobile) + '\n\n🎬 Guarda qui: ' + CONFIG.LINK_VIDEO_TOP + '\nAntonio ti ricontatterà presto!');
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '🚨 *NUOVA VENDITA*\n👤 ' + nome + '\n🏡 Vuole vendere: *' + tipoImmobile.toUpperCase() + '*'); return;
    } else if (isIntentVendita) {
      prop.setProperty('stato_vendita_' + numero, 'attesa_tipo'); inviaMessaggioUmano(chatId, '🚀 Specificami che tipo di immobile vuoi vendere:' + MENU_IMMOBILI_EMOJI); return;
    } else if (isAttesaTipoVendita && (!tipoImmobile || tipoImmobile === 'null')) { prop.deleteProperty('stato_vendita_' + numero); }
  }

  let isIntentAcquisto = /comprare|acquisto|cerco|acquistare/i.test(testoNorm), statoAcquisto = prop.getProperty('stato_acquisto_' + numero);
  if (statoAcquisto === 'attesa_budget') {
    let budgetScelto = testoUtente, tipoScelto = prop.getProperty('tipo_scelto_' + numero), cittaScelta = prop.getProperty('citta_scelta_' + numero);
    prop.deleteProperty('stato_acquisto_' + numero); prop.deleteProperty('tipo_scelto_' + numero); prop.deleteProperty('citta_scelta_' + numero);
    registraRichiestaUnificata(Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'), nome, '+' + numero, 'ACQUISTO', tipoScelto, cittaScelta, budgetScelto);
    let countKey = 'daily_count_' + numero, currentCount = parseInt(prop.getProperty(countKey)) || 0;
    if (currentCount >= CONFIG.MAX_DAILY_LINKS) { inviaMessaggioUmano(chatId, '⚠️ Limite giornaliero raggiunto. Scrivi ad Antonio!' + pescaRisposta('FIRMA')); return; }
    
    // ✅ RISPOSTA GRAFICA NATIVA: Invece di inviare i link testo, lancia la lista a pulsanti interattivi
    inviaMenuProprieta(numero);
    inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '🚨 *NUOVO ACQUISTO*\n👤 ' + nome + '\n🏠 Cerca: ' + tipoScelto + ' a ' + cittaScelta + '\n💰 Budget: ' + budgetScelto);
    logConversazioneIA(numero, nome, testoUtente, 'Inviata Lista Proprietà Interattiva WhatsApp');
    return;
  }
  if (statoAcquisto === 'attesa_citta') {
    let cittaScelta = estraiCitta(testoNorm);
    if (cittaScelta) { prop.setProperty('citta_scelta_' + numero, cittaScelta); prop.setProperty('stato_acquisto_' + numero, 'attesa_budget'); inviaMessaggioUmano(chatId, 'Ottimo! Zona: *' + cittaScelta.toUpperCase() + '* 📍\nQual è il tuo *budget massimo*? 💰'); }
    else { inviaMessaggioUmano(chatId, 'Scusami, prova così:' + MENU_CITTA_EMOJI); } return;
  }
  let categoriaPulita = estraiCategoriaConIA(testoNorm);
  if (categoriaPulita && categoriaPulita !== 'null' && statoAcquisto !== 'attesa_citta' && statoAcquisto !== 'attesa_budget') {
    prop.setProperty('stato_acquisto_' + numero, 'attesa_citta'); prop.setProperty('tipo_scelto_' + numero, categoriaPulita); inviaMessaggioUmano(chatId, 'Hai indicato *' + categoriaPulita.toUpperCase() + '*. 🏡 Adesso dimmi:' + MENU_CITTA_EMOJI); return;
  } else if (isIntentAcquisto || statoAcquisto === 'attesa_tipo') {
    if (isIntentAcquisto) { prop.setProperty('stato_acquisto_' + numero, 'attesa_tipo'); inviaMessaggioUmano(chatId, 'Fantastico ' + nome + '! Indicami cosa cerchi:' + MENU_IMMOBILI_EMOJI); }
    else { prop.deleteProperty('stato_acquisto_' + numero); } return;
  }

  let isIntentAffitto = /affitto|locazione/i.test(testoNorm);
  if (isIntentAffitto && !prop.getProperty('stato_affitto_' + numero)) { prop.setProperty('stato_affitto_' + numero, 'attesa_tipo'); inviaMessaggioUmano(chatId, 'Che *tipo di immobile* cerchi in affitto?'); return; }
  if (prop.getProperty('stato_affitto_' + numero) === 'attesa_tipo') { prop.setProperty('temp_tipo_affitto_' + numero, testoUtente); prop.setProperty('stato_affitto_' + numero, 'attesa_prezzo'); inviaMessaggioUmano(chatId, 'Quale sarebbe il *budget mensile massimo*? 💰'); return; }
  if (prop.getProperty('stato_affitto_' + numero) === 'attesa_prezzo') {
    let tipoRichiesto = prop.getProperty('temp_tipo_affitto_' + numero), prezzoRichiesto = testoUtente;
    registraRichiestaUnificata(Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm'), nome, '+' + numero, 'AFFITTO', tipoRichiesto, 'N/A', prezzoRichiesto);
    prop.deleteProperty('stato_affitto_' + numero); prop.deleteProperty('temp_tipo_affitto_' + numero);
    inviaMessaggioUmano(chatId, 'Ho segnato tutto! ✅\n🏠 *Tipo:* ' + tipoRichiesto + '\n💰 *Budget:* ' + prezzoRichiesto + '\nTi contatteremo presto!');
    inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '🚨 *NUOVO AFFITTO*\n👤 ' + nome + '\n🏠 Cerca: ' + tipoRichiesto + '\n💰 Budget: ' + prezzoRichiesto); return;
  }

  try {
    let memoriaChat = getBreveMemoria(numero), profilo = ottieniProfiloAgenzia();
    
    // 🏦 AGGIORNAMENTO PROMPT DI SISTEMA CON REGOLE RIGIDE SUL DATABASE IMMOBILI E MUTUI
const sys = 'Sei DarIA, assistente virtuale empatica e persuasiva dell\'Agenzia Immobiliare Giancani di Favara. INFORMAZIONI SU ANTONIO GIANCANI: ' + profilo + '.\n' +
            '⚠️ REGOLA DI FONTE ASSOLUTA E TASSATIVA: Per qualsiasi informazione, dettaglio, descrizione, prezzo o disponibilità degli immobili, devi attingerti ESCLUSIVAMENTE ai dati ufficiali estratti dal foglio di calcolo configurato (es. colonna E del DATABASE_IMMOBILI). Non inventare, ipotizzare o integrare mai dettagli che non siano esplicitamente presenti nel database fornito dallo script.\n\n' +
            'REGOLE DI INGAGGIO ACQUIRENTI:\n' +
            '1) Se un cliente acquirente manifesta la necessità di fare un mutuo, chiede informazioni sui costi di una rata o esprime incertezza sul budget, offrigli SUBITO il modulo interattivo di calcolo dicendo che glielo stai inviando.\n' +
            '2) Se un cliente vuole vedere foto o video delle case, o se la conversazione si sta spegnendo, digli che gli invierai la vetrina video immersiva dei Reels Off-Market.\n' +
            '3) Se un cliente cerca un immobile specifico, procedi a profilarlo su tipologia, zona e budget.\n' +
            '4) ⚠️ REGOLA FINANZIARIA TASSATIVA: Non inventare MAI tassi di interesse, percentuali o importi di rate mensili in chat. Spiega solo che riceverà il modulo interattivo di calcolo per confiCODIgurarlo autonomamente.\n' +
            '5) Sii sempre brevissima (max 2 righe), cordiale, professionale e chiudi con una domanda per profilare le sue esigenze.' + memoriaChat;
                
  let rispostaIA = callGroq(sys, testoUtente);
    
    // 🎛️ INTELLIGENZA GRAFICA POST-RISPOSTA IA: Intercetta cosa ha scritto la IA e lancia i relativi moduli a pulsante nativi
    let rispostaLower = rispostaIA.toLowerCase();
    inviaMessaggioUmano(chatId, rispostaIA + pescaRisposta('FIRMA'));
    logConversazioneIA(numero, nome, testoUtente, rispostaIA);
    
    if (rispostaLower.includes('mutuo') || rispostaLower.includes('simulatore') || rispostaLower.includes('calcolatore')) {
      inviaPulsanteMutuo(numero);
    } else if (rispostaLower.includes('vetrina') || rispostaLower.includes('reels') || rispostaLower.includes('video')) {
      inviaPulsanteReels(numero);
    }
  } catch(e) { 
    inviaMessaggioUmano(chatId, pescaRisposta('ERRORE') + pescaRisposta('FIRMA')); 
  }
}

