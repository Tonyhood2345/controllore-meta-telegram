// ==========================================



// ============================================================
// MOTORE INVIO CONFERME E PROMEMORIA (META API) - VERSIONE AGGIORNATA
// ============================================================

function inviaRichiestaConferme() {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    const eventi = cal.getEventsForDay(new Date(Date.now() + 86400000));
    
    // 🤷‍♂️ CASO AGENDA VUOTA: Notifica immediata al Boss
    if (eventi.length === 0) {
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, "🤷‍♂️ Boss, ho controllato l'agenda di domani ma è completamente vuota. Nessuna conferma da inviare!");
      return;
    }

    let conteggioInviati = 0;
    let elencoInviati = ""; 

    eventi.forEach(function(ev) {
      let titolo = ev.getTitle() ? ev.getTitle().trim() : "";
      let orario = Utilities.formatDate(ev.getStartTime(), CONFIG.TIMEZONE, "HH:mm");
      
      if (!titolo.includes('【CONFERMATO】') && !titolo.includes('【DISDETTO】') && !titolo.includes('【DA POSTICIPARE】') && !titolo.includes('【IN ATTESA】')) {
        
        let numeroSenzaPrefisso = estraiNumeroForte(titolo);
        
        if (!numeroSenzaPrefisso) {
          numeroSenzaPrefisso = cercaInRubricaGoogle(titolo, orario) || cercaNumeroPerPromemoria(titolo);
        }
        
        // 🟢 PIANO A: IL NUMERO ESISTE -> INVIA IL PROMEMORIA NATIVO
        if (numeroSenzaPrefisso) {
          let numPulito = numeroSenzaPrefisso.replace(/\D/g, "");
          if (!(numPulito.startsWith("39") && numPulito.length > 10)) {
             numPulito = "39" + numPulito;
          }
          
          // INVIO PULSANTI INTERATTIVI DI CONFERMA
          inviaPromemoriaPulsanti(numPulito, orario);
          
          // AGGIORNAMENTO CALENDARIO
          let nuovoTitolo = titolo.replace(/【.*?】/g, '').trim();
          if (!nuovoTitolo.includes(numPulito)) {
              nuovoTitolo += ` ${numPulito}`;
          }
          ev.setTitle('【IN ATTESA】 ' + nuovoTitolo);
          
          conteggioInviati++;
          elencoInviati += `\n👤 ${nuovoTitolo} (+${numPulito})`; 
        } 
        // 🔴 PIANO B: IL NUMERO NON C'È -> ALLARME GRAFFETTA
        else {
          let nomeCliente = titolo.replace(/【.*?】/g, '').trim();
          let alertMsg = `⚠️ *ALLARME NUMERO MANCANTE*\nNon trovo il numero di *${nomeCliente}* per l'appuntamento di domani alle ${orario}.\n\n👉 *Rispondimi condividendo la sua scheda contatto* (con la graffetta 📎)...\noppure scrivi:\n"recupera [numero] [nome]"`;
          
          inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, alertMsg);
        }
      }
    });

    // 📊 REPORT FINALE INVIO CONTROLLATO
    if (conteggioInviati > 0) {
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, `✅ *Promemoria Inviati:* Ho mandato la richiesta a ${conteggioInviati} appuntamenti per domani:\n${elencoInviati}`);
    } else {
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, "✅ Tutto già aggiornato Boss! Gli appuntamenti di domani hanno già l'etichetta o il promemoria inviato.");
    }

  } catch (e) { 
    inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, "⚠️ Errore invio conferme: " + e.message); 
  }
}

// ── FUNZIONE INVIO PULSANTI (UNICA E CORRETTA) ──

// ── FUNZIONE DI SUPPORTO: INVIO BOTTONI SLOTS LIBERI (META API NATIVO) ──
function inviaPulsantiPosticipo(numeroPulito, liberi) {
  let url = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  let numTarget = String(numeroPulito).replace(/\D/g, '');
  
  // Compressione dei giorni per rientrare nei 20 caratteri massimi di Meta per pulsante
  let buttons = liberi.map(function(opz, idx) {
    let abbreviato = opz.replace('Lunedì', 'Lun')
                        .replace('Martedì', 'Mar')
                        .replace('Mercoledì', 'Mer')
                        .replace('Giovedì', 'Gio')
                        .replace('Venerdì', 'Ven')
                        .replace('Sabato', 'Sab')
                        .replace('alle ', '')
                        .replace('🌇 ', '')
                        .replace('🌅 ', '').trim();
                        
    if (abbreviato.length > 20) abbreviato = abbreviato.substring(0, 20);
    
    return {
      type: 'reply',
      reply: { id: 'slot_' + idx, title: abbreviato }
    };
  });

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numTarget,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { 
        text: `🔄 *Riprogrammazione Appuntamento* 🏡\n\nNessun problema, ho inoltrato la richiesta di posticipo ad Antonio.\n\nEcco i primi 3 slot disponibili in agenzia nei prossimi giorni. Clicca direttamente sul pulsante dell'orario che ti è più comodo per fissarlo in automatico! 👇` 
      },
      action: { buttons: buttons }
    }
  };

  UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}
// ── FUNZIONI DI SUPPORTO AL MOTORE (SEGUGI) ──

function estraiNumeroForte(testo) {
  if (!testo) return null;
  
  // Pulisce tutto tranne i numeri
  let pulito = String(testo).replace(/\D/g, ''); 
  
  // Se inizia con 39 (prefisso ITA) ed è abbastanza lungo, decapita il 39 per non confondere il conteggio
  if (pulito.startsWith('39') && pulito.length >= 11) {
      pulito = pulito.substring(2); 
  }
  
  // Ora cerca il VERO numero di cellulare di 10 cifre che inizia per 3
  let match = pulito.match(/3\d{8,9}/); 
  return match ? match[0] : null;
}

function trovaAppuntamentiLiberi() {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    if (!cal) return []; 
    
    let opzioni = [];
    let dateToCheck = new Date();
    dateToCheck.setDate(dateToCheck.getDate() + 1); 
    const giorniSettimana = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    
    let workingDaysChecked = 0; 
    
    while(opzioni.length < 3 && workingDaysChecked < 7) { 
      let dayIndex = dateToCheck.getDay();
      
      // Salta solo la Domenica (0)
      if (dayIndex !== 0) { 
        let isSabato = (dayIndex === 6);
        let dataStr = `${giorniSettimana[dayIndex]} ${Utilities.formatDate(dateToCheck, CONFIG.TIMEZONE, "dd/MM")}`;

        // 🌅 CONTROLLO MATTINA (09:00 - 13:00) - Tutti i giorni lavorativi
        let mStart = new Date(dateToCheck); mStart.setHours(9, 0, 0, 0);
        let mEnd = new Date(dateToCheck); mEnd.setHours(13, 0, 0, 0);
        let mEvents = cal.getEvents(mStart, mEnd);
        
        let slotM1 = true; // 09:30 - 11:30
        let slotM2 = true; // 11:00 - 13:00
        let slotM3 = true; // 10:30 - 12:30 (Scialuppa di salvataggio)
        
        mEvents.forEach(function(ev) {
          let evS = ev.getStartTime().getTime(); let evE = ev.getEndTime().getTime();
          if (evS < new Date(dateToCheck).setHours(11, 30, 0, 0) && evE > new Date(dateToCheck).setHours(9, 30, 0, 0)) slotM1 = false;
          if (evS < new Date(dateToCheck).setHours(13, 0, 0, 0) && evE > new Date(dateToCheck).setHours(11, 0, 0, 0)) slotM2 = false;
          if (evS < new Date(dateToCheck).setHours(12, 30, 0, 0) && evE > new Date(dateToCheck).setHours(10, 30, 0, 0)) slotM3 = false;
        });
        
        if (slotM1 && opzioni.length < 3) opzioni.push(`🌅 ${dataStr} alle 09:30`);
        if (slotM2 && opzioni.length < 3) opzioni.push(`🌅 ${dataStr} alle 11:00`);
        else if (!slotM1 && slotM3 && opzioni.length < 3) opzioni.push(`🌅 ${dataStr} alle 10:30`);

        // 🌇 CONTROLLO POMERIGGIO (16:30 - 20:00) - SOLO Lunedì -> Venerdì
        if (!isSabato && opzioni.length < 3) {
          let pStart = new Date(dateToCheck); pStart.setHours(16, 30, 0, 0);
          let pEnd = new Date(dateToCheck); pEnd.setHours(20, 0, 0, 0);
          let pEvents = cal.getEvents(pStart, pEnd);
          
          let slotP1 = true; // 16:30 - 18:30
          let slotP2 = true; // 18:00 - 20:00
          
          pEvents.forEach(function(ev) {
            let evS = ev.getStartTime().getTime(); let evE = ev.getEndTime().getTime();
            if (evS < new Date(dateToCheck).setHours(18, 30, 0, 0) && evE > new Date(dateToCheck).setHours(16, 30, 0, 0)) slotP1 = false;
            if (evS < new Date(dateToCheck).setHours(20, 0, 0, 0) && evE > new Date(dateToCheck).setHours(18, 0, 0, 0)) slotP2 = false;
          });

          if (slotP1 && opzioni.length < 3) opzioni.push(`🌇 ${dataStr} alle 16:30`);
          if (slotP2 && opzioni.length < 3) opzioni.push(`🌇 ${dataStr} alle 18:00`);
        }
        
        workingDaysChecked++;
      }
      dateToCheck.setDate(dateToCheck.getDate() + 1);
    }
    return opzioni;
  } catch (e) { return []; }
}

// 📅 INVIA PROMEMORIA APPUNTAMENTO AL CLIENTE CON PULSANTI INTERATTIVI NATIVI + COPIA DI EMERGENZA AL BOSS
function inviaPromemoriaPulsanti(numeroPulito, orario) {
  let urlMeta = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  let numTarget = String(numeroPulito).replace(/\D/g, '');
  if (!numTarget.startsWith("39") && numTarget.length > 8) numTarget = "39" + numTarget;

  // 📝 1. IL TESTO DEL PROMEMORIA (Unificato per l'invio automatico e manuale)
  let testoPromemoria = `📢 *PROMEMORIA APPUNTAMENTO IMMOBILIARE* 🏡\n\nCiao! Ti ricordiamo il tuo appuntamento programmato con l'Immobiliare Giancani per domani alle ore *${orario}*.\n\nPer favore, conferma la tua presenza rispondendo direttamente a questo messaggio scrivendo:\n👉 *CONFERMO*\n👉 *POSTICIPO*\n👉 *DISDICO*`;

  // 🟢 PAYLOAD INTERATTIVO NATIVO PER IL CLIENTE
  let payloadCliente = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numTarget,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { 
        text: `📢 *PROMEMORIA APPUNTAMENTO IMMOBILIARE* 🏡\n\nCiao! Ti ricordiamo il tuo appuntamento programmato con l'Immobiliare Giancani per domani alle ore *${orario}*.\n\nPer favore, conferma la tua presenza cliccando direttamente su uno dei pulsanti qui sotto:` 
      },
      footer: { text: 'Gestione automatica Super Agenda 73' },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'client_confermo', title: '✅ Confermo' } },
          { type: 'reply', reply: { id: 'client_posticipo', title: '🔄 Posticipo' } },
          { type: 'reply', reply: { id: 'client_disdico', title: '❌ Disdico' } }
        ]
      }
    }
  };

  let opzioniCliente = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payloadCliente),
    muteHttpExceptions: true
  };

  // Spara il pulsante interattivo al cliente
  UrlFetchApp.fetch(urlMeta, opzioniCliente);

// ══════════════════════════════════════════════════════════════
  // 🛡️ AREA PARACADUTE MANUALE: INVIO PULSANTE URL NATIVO AL BOSS
  // ══════════════════════════════════════════════════════════
  try {
    let numBossPulito = String(CONFIG.ANTONIO_CHAT_ID).replace(/\D/g, '');
    let urlMeta = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
    
    // Genera il link precompilato specifico per il cliente
    let urlInoltroManuale = `https://api.whatsapp.com/send?phone=${numTarget}&text=${encodeURIComponent(testoPromemoria)}`;
    
    // 🎛️ PAYLOAD INTERATTIVO CTA PER IL BOSS (Il testo del bottone ha max 20 caratteri)
    let payloadBoss = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: numBossPulito,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        header: { type: 'text', text: '🪂 EMERGENZA PROMEMORIA' },
        body: { text: `👤 *Cliente:* +${numTarget}\n🕒 *Orario:* ${orario}\n\n🆘 Boss, se i pulsanti automatici di Meta falliscono o l'utente si blocca, tocca il pulsante sotto per forzare l'invio manuale dal tuo telefono:` },
        footer: { text: 'Scialuppa di salvataggio Super Agenda 73' },
        action: {
          name: 'cta_url',
          parameters: {
            display_text: 'Invia Manuale 🚀', // Max 20 caratteri spaccati!
            url: urlInoltroManuale
          }
        }
      }
    };

    let opzioniBoss = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
      payload: JSON.stringify(payloadBoss),
      muteHttpExceptions: true
    };

    // Spara il pulsante di emergenza sulla tua chat personale
    UrlFetchApp.fetch(urlMeta, opzioniBoss);

  } catch(errBoss) {
    Logger.log("Errore invio paracadute grafico al Boss: " + errBoss.toString());
  }
}


function TEST_INVIO_TEMPLATE() {
  let url = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  
  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: '393201667156', // Il tuo numero personale
    type: 'template',
    template: {
      name: 'promemoria_appuntamento',
      language: { code: 'it' },
      components: [
        {
          type: 'header',
          parameters: [{
            type: 'image',
            image: { link: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=500&q=80' } // 🔥 Foto obbligatoria per sbloccare l'header!
          }]
        },
        {
          type: 'body',
          parameters: [{ type: 'text', text: '11:30' }] // Variabile per l'orario {{1}}
        }
      ]
    }
  };

  let res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  Logger.log("📡 RISPOSTA DIRETTA DI META: " + res.getContentText());
}

