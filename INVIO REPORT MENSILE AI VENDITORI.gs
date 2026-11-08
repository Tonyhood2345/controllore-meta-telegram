// ==========================================

// ==========================================
// CONFIGURAZIONE GLOBALE BROADCAST VENDITORI
// ==========================================

/**
 * DARIA: GENERA IL MESSAGGIO UNICO PER IL TUO BROADCAST VENDITORI
 * Questa è la funzione che devi cliccare! Spedisce il messaggio di anteprima a te.
 */
function inviaMessaggioGuidaBroadcast() {
  try {
    let linkReport = WEB_APP_URL_BROADCAST;
    
    let msg = `📊 *AGGIORNAMENTO MENSILE IMMOBILI* 🏡\n\n` +
              `Gentile Proprietario, 👋 qui è l'Agenzia Giancani.\n\n` +
              `Ci teniamo a farti sapere che siamo costantemente sul pezzo e stiamo lavorando attivamente ogni giorno, sfruttando le migliori strategie immobiliari e di marketing (Social, Web e Portali), per trovare l'acquirente perfetto per la tua casa! 💪🚀\n\n` +
              `Abbiamo appena aggiornato la tua **Area Privata VIP** con tutti i dati di questo mese (Visualizzazioni dei video, click sui portali e appuntamenti fisici effettuati sul posto).\n\n` +
              `👇 *Tocca il pulsante qui sotto, inserisci il tuo numero di telefono e accedi subito alla tua Dashboard interattiva personalizzata:*`;
    
    // Spedisce ad Antonio (CONFIG.ANTONIO_CHAT_ID), pronto per essere inoltrato nel Broadcast dei venditori
    inviaWhatsAppBottoneLink(CONFIG.ANTONIO_CHAT_ID, msg, "Apri Report 📊", linkReport);
    
    inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, `✅ *Messaggio Broadcast pronto!* Controlla la chat qui sotto e inoltralo alla tua lista broadcast.`);
  } catch(e) {
    if (typeof CONFIG !== 'undefined' && CONFIG.ANTONIO_CHAT_ID) {
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, "⚠️ Errore DarIA Broadcast: " + e.message);
    } else {
      Logger.log("Errore: " + e.message);
    }
  }
}

/**
 * MOTORINO DI RICERCA INTERNO (CHIAMATO DALLA PAGINA WEB REPORTVENDITORE)
 * Riceve il numero digitato dal cliente, estrae la riga e calcola i 6 canali senza bloccarsi!
 */

// =========================================================================
// 🛠️ FUNZIONE MANCANTE: INVIA MESSAGGIO CON PULSANTI LINK (API META UFFICIALE)
// =========================================================================
function inviaWhatsAppBottoneLink(numero, testoBody, testoBottone, urlLink) {
  try {
    let numPulito = String(numero).replace(/\D/g, '');
    
    // Configura l'URL ufficiale di Meta usando i tuoi parametri CONFIG esistenti
    let url = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
    
    let payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: numPulito,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: testoBody },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: testoBottone.substring(0, 20), // Meta impone un limite tassativo di max 20 caratteri sul testo del tasto!
            url: urlLink
          }
        }
      }
    };

    var options = { 
      method: 'post', 
      contentType: 'application/json', 
      headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN }, 
      payload: JSON.stringify(payload), 
      muteHttpExceptions: true 
    };

    var risposta = UrlFetchApp.fetch(url, options);
    Logger.log("Risposta Meta: " + risposta.getContentText());
    
  } catch(err) {
    Logger.log("Errore critico inviaWhatsAppBottoneLink: " + err.toString());
  }
}



/**
 * MOTORINO DI RICERCA BLINDATO (CHIAMATO DALLA PAGINA WEB)
 * Pulisce i numeri da entrambi i lati per evitare che la pagina rimanga su "In attesa..."
 */
function sbloccaDatiConTelefono(telefonoInserito) {
  try {
    if (!telefonoInserito) return null;
    
    const logSheetId = (typeof CONFIG !== 'undefined' && CONFIG.LOG_SHEET_ID) ? CONFIG.LOG_SHEET_ID : SpreadsheetApp.getActiveSpreadsheet().getId();
    const ss = SpreadsheetApp.openById(logSheetId);
    const sheet = ss.getSheetByName("REPORT_VENDITORI");
    if (!sheet) return null;
    
    const dati = sheet.getDataRange().getValues();
    let rigaTrovata = null;
    
    // 1. Pulisce il numero inserito dall'utente (tiene solo i numeri)
    let telCercato = String(telefonoInserito).replace(/\D/g, '');
    
    // Se l'utente scrive il numero senza 39 iniziale (es. 320...), lo standardizziamo togliendolo anche se c'è
    if (telCercato.startsWith("39") && telCercato.length > 10) {
      telCercato = telCercato.substring(2);
    }
    
    // 2. Ciclo di confronto elastico sulla Colonna C (Telefono_WA)
    for (let i = 1; i < dati.length; i++) {
      if (!dati[i][2]) continue;
      
      // Pulisce il numero scritto nella riga del foglio Excel
      let telRiga = String(dati[i][2]).replace(/\D/g, '');
      if (telRiga.startsWith("39") && telRiga.length > 10) {
        telRiga = telRiga.substring(2);
      }
      
      // Confronto puro sul numero locale (es. 320166...)
      if (telRiga === telCercato && telCercato !== "") {
        rigaTrovata = dati[i];
        break;
      }
    }
    
    if (!rigaTrovata) {
      Logger.log("Nessuna riga trovata per il telefono: " + telefonoInserito);
      return null;
    }
    
// 3. Estrazione pulita dei dati adattata al tuo foglio attuale
    let idReport         = rigaTrovata[0]; // Colonna A
    let nomeProprietario = rigaTrovata[1]; // Colonna B
    let idImmobile       = rigaTrovata[3]; // Colonna D
    let dataRaw          = rigaTrovata[4]; // Colonna E
    
    // Scambiamo gli indici per leggere i dati esattamente dove si trovano ora:
    let totaleVisite     = parseInt(rigaTrovata[6], 10) || 0; // Legge 50 dalla Colonna G (e accende i grafici!)
    let visiteEffettuate = parseInt(rigaTrovata[7], 10) || 0; // Legge 15 dalla Colonna H
    let contattiRicevuti = 0;                                 // Puoi impostarlo a un valore fisso o a una nuova colonna se serve
    let noteAgente       = rigaTrovata[8] || "L'immobile sta riscuotendo un ottimo interesse."; // Colonna I
    
    // Calcolo giorni dal lancio
    let giorniLancio = 7; 
    if (dataRaw instanceof Date) {
      giorniLancio = Math.max(1, Math.ceil((new Date().getTime() - dataRaw.getTime()) / (1000 * 60 * 60 * 24)));
    } else if (dataRaw) {
      let parti = String(dataRaw).split('/');
      if (parti.length === 3) {
        let dataOggetto = new Date(parti[2], parti[1] - 1, parti[0]);
        giorniLancio = Math.max(1, Math.ceil((new Date().getTime() - dataOggetto.getTime()) / (1000 * 60 * 60 * 24)));
      }
    }
    
    // Ripartizione proporzionale per i 6 canali del grafico a torta
    let tiktok        = Math.floor(totaleVisite * 0.35);
    let facebook      = Math.floor(totaleVisite * 0.20);
    let instagram     = Math.floor(totaleVisite * 0.25);
    let youtube       = Math.floor(totaleVisite * 0.08);
    let immobiliareIt = Math.floor(totaleVisite * 0.07);
    let idealistaIt   = totaleVisite - (tiktok + facebook + instagram + youtube + immobiliareIt);
    
    return {
      ticket: idReport,
      proprietario: nomeProprietario,
      indirizzo: idImmobile,
      visiteSocial: totaleVisite,
      visiteLoco: visiteEffettuate,
      documenti: contattiRicevuti,
      notaAndamento: noteAgente,
      giorniLancio: giorniLancio,
      ttViews: tiktok, fbViews: facebook, igViews: instagram, ytViews: youtube, immobViews: immobiliareIt, ideaViews: idealistaIt
    };
    
  } catch(e) {
    Logger.log("Errore sbloccaDatiConTelefono: " + e.toString());
    return null;
  }
}




