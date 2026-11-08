// Gestione automatica gerarchia cartelle immobili su Drive
// ============================================================

const DriveManager = {

  // Crea la struttura cartelle per un nuovo immobile
  // Restituisce l'ID della cartella principale creata
  creaCartellaImmobile: function(proprietario, indirizzo, dataIncarico) {
    try {
      // Controlla se esiste una cartella root configurata
      let rootFolder;
      if (CONFIG.DRIVE_ROOT_FOLDER_ID && CONFIG.DRIVE_ROOT_FOLDER_ID !== 'INSERISCI_QUI_ID_CARTELLA') {
        rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_ROOT_FOLDER_ID);
      } else {
        // Fallback: usa una cartella "Immobili_Giancani" nella root di Drive
        let iter = DriveApp.getFoldersByName('Immobili_Giancani');
        rootFolder = iter.hasNext() ? iter.next() : DriveApp.createFolder('Immobili_Giancani');
      }

      let nomePulito = proprietario.toUpperCase().replace(/[^A-Z0-9\s]/g, '').trim();
      let indirizzoP = indirizzo.toUpperCase().replace(/[^A-Z0-9\s,]/g, '').trim();
      let folderName = nomePulito + ' - ' + indirizzoP + ' - ' + dataIncarico;

      // Controllo duplicati
      let existing = rootFolder.searchFolders("title = '" + folderName + "'");
      if (existing.hasNext()) {
        let existingFolder = existing.next();
        SystemLogger.info('DriveManager', 'Cartella già esistente: ' + folderName, { id: existingFolder.getId() });
        return existingFolder.getId();
      }

      // Crea cartella principale
      let mainFolder = rootFolder.createFolder(folderName);

      // Crea sottocartelle standardizzate
      let subFolders = ['DOCUMENTI', 'FOTO', 'PLANIMETRIE', 'ATTI', 'APE', 'VISURE', 'ALTRO'];
      subFolders.forEach(function(sf) {
        mainFolder.createFolder(sf);
      });

      SystemLogger.info('DriveManager', 'Cartella creata: ' + folderName, { id: mainFolder.getId() });
      return mainFolder.getId();

    } catch(e) {
      SystemLogger.error('DriveManager', 'Errore creazione cartella immobile', e.message);
      return null;
    }
  },

  // Salva un documento in una sottocartella specifica dell'immobile
  // categoria: 'DOCUMENTI' | 'FOTO' | 'PLANIMETRIE' | 'ATTI' | 'APE' | 'VISURE' | 'ALTRO'
  salvaDocumento: function(idCartellaPrincipale, blob, categoria, nomeFile) {
    try {
      let mainFolder = DriveApp.getFolderById(idCartellaPrincipale);
      categoria = categoria.toUpperCase();

      // Cerca la sottocartella
      let subIter = mainFolder.searchFolders("title = '" + categoria + "'");
      let targetFolder = subIter.hasNext() ? subIter.next() : mainFolder.createFolder(categoria);

      blob.setName(nomeFile);
      let file = targetFolder.createFile(blob);

      // Rende il file leggibile con link (necessario per i link temporanei)
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      SystemLogger.info('DriveManager', 'File salvato: ' + nomeFile, { categoria: categoria, fileId: file.getId() });
      return file.getId();

    } catch(e) {
      SystemLogger.error('DriveManager', 'Errore salvataggio documento', e.message);
      return null;
    }
  },

  // Ottieni l'ID cartella di un immobile dal DATABASE_IMMOBILI (colonna ID_CARTELLA_DRIVE)
  // Se la colonna non esiste ancora, restituisce null
  getIdCartellaDaDB: function(idImmobile) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_IMMOBILI');
      if (!sheet) return null;
      const dati = sheet.getDataRange().getValues();
      for (let i = 1; i < dati.length; i++) {
        if (String(dati[i][0]) === String(idImmobile)) {
          return dati[i][CONFIG.COL_CARTELLA_DRIVE] || null;
        }
      }
    } catch(e) {
      SystemLogger.error('DriveManager', 'Errore lettura cartella da DB', e.message);
    }
    return null;
  },

  // Salva l'ID cartella Drive nel DATABASE_IMMOBILI
  setIdCartellaSuDB: function(rigaSheet, idCartella) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_IMMOBILI');
      if (!sheet) return;
      sheet.getRange(rigaSheet, CONFIG.COL_CARTELLA_DRIVE + 1).setValue(idCartella);
    } catch(e) {
      SystemLogger.error('DriveManager', 'Errore scrittura cartella su DB', e.message);
    }
  },

  // Scarica il blob di un media da WhatsApp Meta API
  scaricaMediaWhatsApp: function(mediaId) {
    try {
      // Step 1: ottieni URL del media
      let res = UrlFetchApp.fetch('https://graph.facebook.com/v18.0/' + mediaId, {
        headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN }
      });
      let mediaUrl = JSON.parse(res.getContentText()).url;

      // Step 2: scarica il blob
      let mediaRes = UrlFetchApp.fetch(mediaUrl, {
        headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN }
      });
      return mediaRes.getBlob();
    } catch(e) {
      SystemLogger.error('DriveManager', 'Errore download media WA', e.message);
      return null;
    }
  }

};
                                   

