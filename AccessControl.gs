// Sistema RBAC - Ruoli e Permessi
// ============================================================

// Gerarchia ruoli (numero più basso = più potere)
const Ruoli = {
  ADMIN:         1,   // Antonio, Andrea
  AGENTE:        2,   // Collaboratori interni
  COLLABORATORE: 3,   // Esterni autorizzati
  CLIENTE:       4    // Default per tutti gli altri
};

const AccessControl = {

  // Restituisce il ruolo numerico dell'utente
  // Accetta sia numeri WA (393201667156) che ID TG (TG_1723292483) che FB (FB_123456)
  getRuolo: function(telefonoID) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('UTENTI');
      if (!sheet) return Ruoli.CLIENTE;
      const dati = sheet.getDataRange().getValues();

      let idPulito = String(telefonoID).replace(/\D/g, '');

      for (let i = 1; i < dati.length; i++) {
        let rigaId = String(dati[i][0]).replace(/\D/g, '');
        if (rigaId === idPulito || rigaId.includes(idPulito) || idPulito.includes(rigaId)) {
          let ruoloStr = String(dati[i][2]).toUpperCase().trim();
          return Ruoli[ruoloStr] || Ruoli.CLIENTE;
        }
      }
    } catch(e) {
      SystemLogger.error('AccessControl', 'Errore lettura ruolo per ' + telefonoID, e.message);
    }
    return Ruoli.CLIENTE;
  },

  // Restituisce il nome del ruolo come stringa leggibile
  getNomeRuolo: function(telefonoID) {
    let r = this.getRuolo(telefonoID);
    for (let key in Ruoli) {
      if (Ruoli[key] === r) return key;
    }
    return 'CLIENTE';
  },

  // Controlla se l'utente può eseguire una specifica azione
  puoEseguire: function(telefonoID, azione) {
    const livello = this.getRuolo(telefonoID);

    // Policy delle azioni: array di ruoli AUTORIZZATI
    const policy = {
      'UPLOAD_DOC':      [Ruoli.ADMIN, Ruoli.AGENTE],
      'DELETE_DOC':      [Ruoli.ADMIN],
      'CREA_LINK':       [Ruoli.ADMIN, Ruoli.AGENTE, Ruoli.COLLABORATORE],
      'VEDI_TUTTI':      [Ruoli.ADMIN, Ruoli.AGENTE],
      'COMANDI_BOSS':    [Ruoli.ADMIN],
      'REPORT':          [Ruoli.ADMIN, Ruoli.AGENTE],
      'BLOCCA_UTENTE':   [Ruoli.ADMIN],
      'NUOVO_IMMOBILE':  [Ruoli.ADMIN, Ruoli.AGENTE]
    };

    if (!policy[azione]) return false;
    return policy[azione].includes(livello);
  },

  // Registra un nuovo utente nel foglio UTENTI (se non esiste già)
  registraUtente: function(telefonoID, nome, ruolo) {
    try {
      ruolo = ruolo || 'CLIENTE';
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('UTENTI');
      if (!sheet) return;

      const dati = sheet.getDataRange().getValues();
      let idPulito = String(telefonoID).replace(/\D/g, '');

      // Controlla se esiste già
      for (let i = 1; i < dati.length; i++) {
        if (String(dati[i][0]).replace(/\D/g, '') === idPulito) return; // Già presente
      }

      const dataOggi = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
      sheet.appendRow([telefonoID, nome, ruolo.toUpperCase(), dataOggi]);
      SystemLogger.info('AccessControl', 'Nuovo utente registrato: ' + nome + ' (' + ruolo + ')', { id: telefonoID });
    } catch(e) {
      SystemLogger.error('AccessControl', 'Errore registrazione utente', e.message);
    }
  }

};


// ============================================================
// 📈 FUNZIONI DI FOLLOW-UP E REPORT VENDITORI — Antonio Giancani
// Versione: 1.0 | Rilevamento automatico e personal branding
// ============================================================

/**
 * 🔄 FOLLOW-UP AUTOMATICO DOPO 23 ORE
 * Cerca nel foglio DB_CLIENTI i clienti che non sentiamo da circa 23 ore
 * e invia loro un messaggio per riattivare la conversazione.
 * Rispetta rigorosamente le linee guida del personal branding "Antonio Giancani".
 */
function controllaEInviaFollowUp() {
  Logger.log("🚀 Avvio controllo follow-up automatico (limite: 23 ore)...");
  try {
    const ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
    const sheet = ss.getSheetByName('DB_CLIENTI');
    if (!sheet) {
      Logger.log("⚠️ Scheda DB_CLIENTI non trovata.");
      return;
    }

    const dati = sheet.getDataRange().getValues();
    const adesso = new Date();
    const limiteMs = 23 * 60 * 60 * 1000; // 23 ore in millisecondi
    let inviati = 0;

    for (let i = 1; i < dati.length; i++) {
      let idCliente = dati[i][0];
      let nomeCliente = dati[i][1];
      let telefonoWA = String(dati[i][2]).replace(/\D/g, '');
      let ultimoContattoStr = dati[i][7]; // Colonna H - Ultimo_Contatto

      if (!telefonoWA || !ultimoContattoStr) continue;

      let ultimoContatto = new Date(ultimoContattoStr);
      let diffMs = adesso.getTime() - ultimoContatto.getTime();

      // Se l'ultimo contatto è avvenuto tra 23 e 24 ore fa (per evitare messaggi duplicati continui)
      if (diffMs >= limiteMs && diffMs < (24 * 60 * 60 * 1000)) {
        let chiaveProperties = 'FOLLOWUP_INVIATO_' + telefonoWA;
        let giaInviatoOggi = PropertiesService.getScriptProperties().getProperty(chiaveProperties);

        if (!giaInviatoOggi) {
          // Messaggio personalizzato orientato al personal branding di Antonio Giancani (no agenzia)
          let testoMessaggio = `Ciao ${nomeCliente}, come stai? Spero tutto bene.\n\nVolevo chiederti se sei riuscito a dare un'occhiata alle proposte immobiliari che abbiamo valutato insieme.\n\nResto a tua completa disposizione se hai domande o se vuoi organizzare un sopralluogo.\n\nUn caro saluto,\nAntonio Giancani`;

          // Invia il messaggio usando il canale omnichannel
          inviaMessaggioOmnichannel(telefonoWA, testoMessaggio);
          
          // Segna come inviato per 24 ore
          PropertiesService.getScriptProperties().setProperty(chiaveProperties, 'true');
          
          // Aggiorna la data sul foglio
          sheet.getRange(i + 1, 8).setValue(adesso);
          inviati++;
        }
      }
    }
    Logger.log("✅ Controllo completato. Follow-up inviati oggi: " + inviati);
  } catch(e) {
    Logger.log("❌ Errore in controllaEInviaFollowUp: " + e.toString());
  }
}

/**
 * 📅 INVIO MENSILE AUTOMATICO REPORT VENDITORI
 * Legge la scheda REPORT_VENDITORI e invia il link del report
 * a ciascun proprietario via WhatsApp.
 */
function inviaReportMensileVenditori() {
  Logger.log("🚀 Avvio invio periodico report venditori...");
  try {
    const ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
    const sheet = ss.getSheetByName('REPORT_VENDITORI');
    if (!sheet) {
      Logger.log("⚠️ Scheda REPORT_VENDITORI non trovata.");
      return;
    }

    const dati = sheet.getDataRange().getValues();
    let inviati = 0;

    for (let i = 1; i < dati.length; i++) {
      let idReport = dati[i][0];
      let telefonoWA = String(dati[i][2]).replace(/\D/g, ''); // Colonna Telefono_WA
      let nomeProprietario = dati[i][1];
      
      if (!telefonoWA || telefonoWA.length < 8) continue;
      
      // Crea il link dinamico al report protetto
      let urlReport = CONFIG.MASTER_WEBAPP_URL + "?report=" + idReport;
      
      // Messaggio focalizzato su Antonio Giancani (senza menzionare l'agenzia)
      let testoMessaggio = `Gentile ${nomeProprietario},\n\nho preparato il report aggiornato sull'andamento del tuo immobile con tutte le statistiche di visualizzazione e di mercato di questo mese.\n\nPuoi visualizzare la tua plancia grafica protetta cliccando sul link qui sotto:\n👉 ${urlReport}\n\nPer qualsiasi informazione o per fare il punto della situazione, sono a tua disposizione.\n\nAntonio Giancani`;
      
      inviaMessaggioOmnichannel(telefonoWA, testoMessaggio);
      inviati++;
    }
    Logger.log("✅ Invio report completato. Messaggi inviati: " + inviati);
  } catch(e) {
    Logger.log("❌ Errore in inviaReportMensileVenditori: " + e.toString());
  }
}


