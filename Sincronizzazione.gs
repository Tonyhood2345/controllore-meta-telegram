// ==========================================

function SincronizzaDatabaseImmobili() {
  try {
    // 1. Apri il foglio SORGENTE (Il file con i dati originali)
    const idSorgente = "19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc";
    const ssSorgente = SpreadsheetApp.openById(idSorgente);
    const sheetSorgente = ssSorgente.getSheetByName("Foglio1");
    
    if (!sheetSorgente) {
      Logger.log("Errore: La scheda 'Foglio1' non esiste nel file sorgente.");
      return;
    }
    
    const datiSorgente = sheetSorgente.getDataRange().getValues();
    
    if (datiSorgente.length === 0) {
      Logger.log("Nessun dato trovato nel foglio sorgente.");
      return;
    }

    const datiFiltrati = [];
    
    // Aggiungi sempre la prima riga di intestazioni (Tipo, Data, Ora...)
    datiFiltrati.push(datiSorgente[0]);
    
    // Controlla le righe degli immobili
    for (let i = 1; i < datiSorgente.length; i++) {
      let riga = datiSorgente[i];
      if (!riga || riga.length < 4) continue; 
      
      // 🎯 COLONNA D = INDICE 3 (A=0, B=1, C=2, D=3)
      let valoreColonnaD = (riga[3] || "").toString().trim().toLowerCase(); 
      
      // 🛡️ Se la colonna D contiene o corrisponde alla parola "altro", scarta la riga
      if (valoreColonnaD.includes("altro")) {
        continue; 
      }
      
      datiFiltrati.push(riga);
    }
    
    // 2. Apri il foglio LOCALE dello Sheet di DarIA
    const idLocale = "1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g";
    const ssLocale = SpreadsheetApp.openById(idLocale);
    
    let sheetLocale = ssLocale.getSheetByName("DATABASE_IMMOBILI");
    if (!sheetLocale) {
      sheetLocale = ssLocale.getSheets()[0]; 
    }
    
    Logger.log("Scrittura e pulizia sulla scheda: " + sheetLocale.getName());
    
    sheetLocale.clearContents();
    
    if (datiFiltrati.length > 0) {
      sheetLocale.getRange(1, 1, datiFiltrati.length, datiFiltrati[0].length).setValues(datiFiltrati);
      Logger.log("✅ Sincronizzazione completata ed escluse le righe 'Altro'. Caricate righe pulite: " + datiFiltrati.length);
    }
    
  } catch(e) {
    Logger.log("⚠️ Errore durante la sincronizzazione: " + e.message);
  }
}
/**
 * Controlla e ripristina automaticamente la riga 1 (intestazioni) 
 * di TUTTI i fogli utilizzati da DarIA, webhook e log di Agenda 73.
 */
/**
 * Controlla e ripristina la riga 1 con le intestazioni corrette.
 * AGGIORNATO: Il foglio REPORT_VENDITORI ora include la colonna Telefono_WA per l'invio diretto!
 */
function ripristinaTutteLeSchedeDarIA() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var tutteLeSchede = {
    "DB_IMMOBILI": [
      "ID_Immobile", "ID_Proprietario", "Stato", "Tipologia", "Comune", 
      "Indirizzo_Zona", "Superficie_MQ", "Prezzo_Richiesta", "Descrizione_Evergreen", 
      "Link_Reel_Vetrina", "Cartella_Drive"
    ],
    "DB_PROPRIETARI": [
      "ID_Proprietario", "Nome", "Cognome", "Telefono_WA", "Email", "Note_Interne"
    ],
    "DB_CLIENTI": [
      "ID_Cliente", "Nome_Cognome", "Telefono_WA", "Budget_Massimo", 
      "Tipologia_Cercata", "Zona_Preferita", "Note_DarIA", "Ultimo_Contatto"
    ],
    "DATABASE_RICHIESTE": [
      "ID_Richiesta", "ID_Cliente", "Data_Inserimento", "Tipologia", "Budget_Max", 
      "Zone_Interesse", "Note_Specifiche", "Stato_Incrocio"
    ],
    
    // === SCHEDA REPORT VENDITORI AGGIORNATA ===
    "REPORT_VENDITORI": [
      "ID_Report", "ID_Proprietario", "Telefono_WA", "ID_Immobile", "Data_Invio", 
      "Visualizzazioni_Reel", "Contatti_Ricevuti", "Visite_Effettuate", "Note_Aggiornamento"
    ],

    "DB_TICKETS_VISITE": [
      "ID_Ticket", "Data_Ora", "ID_Immobile", "Cliente_Acquirente", 
      "Telefono_Cliente", "Stato_Firma", "Codice_OTP_Inviato", "Foto_ID_Drive"
    ],
    "ElencoVideo": [
      "ID_Video", "Titolo_Immobile", "Link_TikTok", "Link_Instagram", 
      "Link_YouTube", "Data_Pubblicazione", "Stato_Montaggio"
    ],
    "Piano_Editoriale_2026": [
      "ID_Post", "Data_Pubblicazione", "Testo_Originale_FB", "Tipo_Media", 
      "Link_Media_Sorgente", "Stato_Evergreen", "Conteggio_Interazioni"
    ],
    "DB_NOTIFICHE_SOCIAL": [
      "ID_Notifica", "Data_Ora", "Piattaforma", "ID_Utente_Social", 
      "Username", "Testo_Commento", "Link_Post_Originale", "Stato_Gestione"
    ],
    "Chat_IA_Log": [
      "ID_Log", "Data_Ora", "Telefono_Cliente", "Ruolo", 
      "Messaggio_Testo", "Token_Usati", "Modello_AI"
    ],
    "Webhook Debug": [
      "Data_Ora_Ricezione", "Origine_Payload", "Stato_Risposta", 
      "Contenuto_JSON_Greggio", "Errore_Dettaglio"
    ],
    "Log Agenda": [
      "ID_Azione", "Data_Ora", "Utente_Script", "Funzione_Eseguita", 
      "Stato_Operazione", "Descrizione_Log"
    ]
  };

  for (var nomeFoglio in tutteLeSchede) {
    var foglio = ss.getSheetByName(nomeFoglio);
    if (!foglio) {
      foglio = ss.insertSheet(nomeFoglio);
    }
    
    var primaCella = foglio.getRange("A1").getValue();
    var intestazioneCorretta = tutteLeSchede[nomeFoglio];
    
    if (primaCella !== intestazioneCorretta[0]) {
      if (foglio.getLastRow() > 0 && primaCella !== "") {
        foglio.insertRowBefore(1);
      }
      
      foglio.getRange(1, 1, 1, intestazioneCorretta.length).setValues([intestazioneCorretta]);
      
      var rangeIntestazione = foglio.getRange(1, 1, 1, intestazioneCorretta.length);
      rangeIntestazione.setFontWeight("bold");
      
      if (nomeFoglio.includes("Log") || nomeFoglio.includes("Debug")) {
        rangeIntestazione.setBackground("#d9ead3");
      } else {
        rangeIntestazione.setBackground("#e0e0e0");
      }
      
      rangeIntestazione.setHorizontalAlignment("center");
      foglio.autoResizeColumns(1, intestazioneCorretta.length);
    }
  }
}

