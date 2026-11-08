// Link temporanei sicuri per condivisione documenti
// ============================================================

const DocumentManager = {

  // Genera un link temporaneo sicuro per un file Drive
  // durataGiorni: default 7 giorni
  // maxAccessi: default 0 = illimitati
  generaLinkTemporaneo: function(idFileDrive, durataGiorni, richiestoDa, maxAccessi) {
    try {
      durataGiorni = durataGiorni || 7;
      maxAccessi   = maxAccessi   || 0;

      const scadenza = new Date();
      scadenza.setDate(scadenza.getDate() + durataGiorni);

      const token = Utilities.getUuid();
      const dataCreazione = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      const dataScadenza  = Utilities.formatDate(scadenza, CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('LINK_TEMPORANEI');
      if (!sheet) {
        SystemLogger.error('DocumentManager', 'Foglio LINK_TEMPORANEI non trovato', null);
        return null;
      }

      sheet.appendRow([
        token,
        idFileDrive,
        dataCreazione,
        dataScadenza,
        0,            // Accessi effettuati
        maxAccessi,   // Max accessi (0 = illimitati)
        'ATTIVO',
        richiestoDa || 'sistema'
      ]);

      // Il link punta al doGet della Web App con il token
      const webAppUrl = CONFIG.MASTER_WEBAPP_URL;
      const linkSicuro = webAppUrl + '?doc_token=' + token;

      SystemLogger.info('DocumentManager', 'Link temporaneo generato', {
        fileId: idFileDrive,
        scadenza: dataScadenza,
        richiedente: richiestoDa
      });

      return linkSicuro;

    } catch(e) {
      SystemLogger.error('DocumentManager', 'Errore generazione link temporaneo', e.message);
      return null;
    }
  },

  // Valida e consuma un token (chiamata da doGet)
  // Restituisce { valido: true/false, idFile: '...', motivo: '...' }
  validaToken: function(token) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('LINK_TEMPORANEI');
      if (!sheet) return { valido: false, motivo: 'Sistema non disponibile' };

      const dati = sheet.getDataRange().getValues();

      for (let i = 1; i < dati.length; i++) {
        if (String(dati[i][0]) === token) {
          const stato      = String(dati[i][6]);
          const scadenza   = new Date(dati[i][3]);
          const accessi    = parseInt(dati[i][4]) || 0;
          const maxAccessi = parseInt(dati[i][5]) || 0;
          const idFile     = String(dati[i][1]);

          if (stato !== 'ATTIVO') {
            return { valido: false, motivo: 'Link non più attivo' };
          }
          if (new Date() > scadenza) {
            sheet.getRange(i + 1, 7).setValue('SCADUTO');
            return { valido: false, motivo: 'Link scaduto' };
          }
          if (maxAccessi > 0 && accessi >= maxAccessi) {
            sheet.getRange(i + 1, 7).setValue('ESAURITO');
            return { valido: false, motivo: 'Numero massimo di accessi raggiunto' };
          }

          // Aggiorna contatore accessi
          sheet.getRange(i + 1, 5).setValue(accessi + 1);

          return { valido: true, idFile: idFile };
        }
      }

      return { valido: false, motivo: 'Token non trovato' };

    } catch(e) {
      SystemLogger.error('DocumentManager', 'Errore validazione token', e.message);
      return { valido: false, motivo: 'Errore di sistema' };
    }
  },

  // Revoca manualmente un link (es. il boss lo annulla)
  revocaLink: function(token) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('LINK_TEMPORANEI');
      const dati = sheet.getDataRange().getValues();
      for (let i = 1; i < dati.length; i++) {
        if (String(dati[i][0]) === token) {
          sheet.getRange(i + 1, 7).setValue('REVOCATO');
          return true;
        }
      }
    } catch(e) {
      SystemLogger.error('DocumentManager', 'Errore revoca link', e.message);
    }
    return false;
  },

  // Costruisce la pagina HTML di redirect per doGet
  // Da chiamare dentro doGet quando arriva ?doc_token=...
  gestisciDownload: function(token) {
    const risultato = DocumentManager.validaToken(token);

    if (!risultato.valido) {
      return HtmlService.createHtmlOutput(
        '<html><body style="font-family:sans-serif;text-align:center;padding:50px;">' +
        '<h2>⛔ Accesso negato</h2><p>' + risultato.motivo + '</p>' +
        '<p style="color:#999;font-size:12px;">Agenzia Immobiliare Giancani</p>' +
        '</body></html>'
      );
    }

    try {
      const file = DriveApp.getFileById(risultato.idFile);
      const nomeFile = file.getName();
      const downloadUrl = file.getDownloadUrl();

      return HtmlService.createHtmlOutput(
        '<html><body style="font-family:sans-serif;text-align:center;padding:50px;">' +
        '<h2>📄 ' + nomeFile + '</h2>' +
        '<p>Il download inizierà automaticamente...</p>' +
        '<p><a href="' + downloadUrl + '" style="color:#075e54;font-weight:bold;">Clicca qui se non parte</a></p>' +
        '<p style="color:#999;font-size:12px;">🏡 Agenzia Immobiliare Giancani - Favara (AG)</p>' +
        '<script>setTimeout(function(){ window.location.href = "' + downloadUrl + '"; }, 1500);</script>' +
        '</body></html>'
      );
    } catch(e) {
      SystemLogger.error('DocumentManager', 'Errore apertura file Drive', e.message);
      return HtmlService.createHtmlOutput('<html><body><h2>⚠️ File non disponibile</h2></body></html>');
    }
  }

};
// ============================================================
// GESTIONE LINK PROTETTI CON SCADENZA 1 ANNO — CLIENTI
// ============================================================
function gestisciDownloadCliente(token) {
  try {
    let chiave = "DOC_" + token;
    let propVal = PropertiesService.getScriptProperties().getProperty(chiave);

    if (!propVal) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:system-ui;text-align:center;padding:40px;background:#0f172a;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        '<div style="font-size:3rem;">⛔</div>' +
        '<h2 style="color:#f87171;">Accesso Negato</h2>' +
        '<p style="color:#94a3b8;">Token non trovato o link scaduto.</p>' +
        '<a href="https://wa.me/393201667156" style="margin-top:20px;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">📞 Contatta Giancani</a>' +
        '</div>'
      );
    }

    let datiDoc = JSON.parse(propVal);

    // Controlla scadenza
    if (new Date().getTime() > datiDoc.scadenza) {
      return HtmlService.createHtmlOutput(
        '<div style="font-family:system-ui;text-align:center;padding:40px;background:#0f172a;color:white;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;">' +
        '<div style="font-size:3rem;">⏳</div>' +
        '<h2 style="color:#fbbf24;">Link Scaduto</h2>' +
        '<p style="color:#94a3b8;">Questo link era valido 1 anno ed è ora scaduto.</p>' +
        '<a href="https://wa.me/393201667156" style="margin-top:20px;background:#16a34a;color:white;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">📞 Richiedi nuova copia</a>' +
        '</div>'
      );
    }

    // Redirect al PDF
    return HtmlService.createHtmlOutput(
      '<html><head>' +
      '<meta http-equiv="refresh" content="0;url=' + datiDoc.url + '">' +
      '<style>body{font-family:system-ui;background:#0f172a;color:white;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;}</style>' +
      '</head><body>' +
      '<p>📄 Apertura documento... <a href="' + datiDoc.url + '" style="color:#fbbf24;">Clicca qui se non si apre</a></p>' +
      '</body></html>'
    );

  } catch(e) {
    return HtmlService.createHtmlOutput('<p style="color:red;">Errore: ' + e.toString() + '</p>');
  }
}





