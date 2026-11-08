// ==========================================

// ══════════════════════════════════════════════════════════════
// ── 7. PANNELLO CONTROLLO HTML E INTERVENTO MANUALE ───────────
// ══════════════════════════════════════════════════════════════
function logConversazioneIA(num, nome, user, bot) {
  try { 
    SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').appendRow([new Date(), num, nome, 'U:' + user + '\nB:' + bot]); 
  } catch(e) {}
  
  // Utilizza l'URL Master stabile della WebApp
  let webAppUrl = CONFIG.MASTER_WEBAPP_URL;
  let linkChat  = webAppUrl + '?chat=' + num + '&nome=' + encodeURIComponent(nome);
  let icona = String(num).startsWith('TG_') ? '🔵 TELEGRAM' : '🟢 WHATSAPP';
  
  // ✈️ 1. Avviso su Telegram Boss (Resta testuale nativo)
  let messaggioSpia = '💬 *NUOVA CHAT (' + icona + ')*\n👤 Cliente: ' + nome + ' (ID: ' + num + ')\n\n🗣️ *Cliente:*\n' + user + '\n\n🤖 *DarIA:*\n' + bot + '\n\n🕹️ *PRENDI IL CONTROLLO:*\n👉 ' + linkChat;
  inviaTelegramBoss(messaggioSpia);
  
  // 🟢 2. SCIALUPPA GRAFICA SU WHATSAPP BOSS (Card con Bottone CTA Ufficiale Meta)
  let msgWA = `💬 *Interazione DarIA (${icona})*\n\n👤 *Cliente:* ${nome}\n🗣️ *User:* ${user}\n🤖 *Bot:* ${bot}\n\n🤖 _DarIA è operativa. Se desideri subentrare manualmente e metterla in pausa, tocca il pulsante sotto:_`;
  
  // "Subentra Live 🧑‍💼" ha esattamente 17 caratteri. Ampiamente dentro il limite dei 20 caratteri di Meta!
  inviaWhatsAppBottoneLink(CONFIG.ANTONIO_CHAT_ID, msgWA, "Subentra Live 🧑‍💼", linkChat);
}

function htmlPrendiControllo(numero) {
  PropertiesService.getScriptProperties().setProperty('PAUSA_DARIA_' + numero, 'true');
  return "✅ Hai il controllo. DarIA è in pausa.";
}

function htmlRiattivaDarIA(numero) {
  PropertiesService.getScriptProperties().deleteProperty('PAUSA_DARIA_' + numero);
  return "🤖 DarIA riattivata. Gestirà lei i prossimi messaggi.";
}

function htmlInviaMessaggio(numero, testo) {
  _inviaMetaWhatsApp(numero, testo); 
  try { SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').appendRow([new Date(), numero, 'Antonio (Manuale)', 'B:' + testo]); } catch(e) {}
  return "Messaggio inviato a +" + numero;
}


// ══════════════════════════════════════════════════════════════
// ── 5. FUNZIONE SATELLITE: GENERAZIONE E INVIO MENU BOSS ──────
// ══════════════════════════════════════════════════════════════
function inviaMenuBossWhatsApp(numero) {
  let numPulito = String(numero).replace(/\D/g, '');
  // 🚀 API v21.0: Massima stabilità per i messaggi interattivi
  let urlMeta = 'https://graph.facebook.com/v21.0/' + CONFIG.META_PHONE_ID + '/messages';

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numPulito,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: '🛠️ CONTROLLO BOSS' },
      body: { text: 'Seleziona un\'azione rapida dal menu interattivo d\'agenzia.' },
      footer: { text: 'Immobiliare Giancani • DARIA' },
      action: {
        button: 'Apri Menu 📋',
       sections: [
          {
            title: '🎬 MARKETING', 
            rows: [
              { id: 'btn_vetrina', title: 'Vetrina Reels', description: 'Visualizza la vetrina stile TikTok' },
              { id: 'btn_nuovo_immobile', title: 'Nuovo Immobile', description: 'Avvia il caricamento guidato di una casa' },
              { id: 'btn_chat_cockpit', title: 'Regia Live Chat 🧑\u200D💼', description: 'Controlla e blocca l\'ultima chat attiva' }
            ]
          },
          {
            title: '📊 AGENZIA', 
            rows: [
              { id: 'btn_resoconto', title: 'Resoconto Serale', description: 'Calcola le statistiche giornaliere' },
              { id: 'btn_incrocio', title: 'Incrocio Predittivo', description: 'Setaccia il database delle richieste' },
              { id: 'btn_dashboard', title: 'Dashboard Totale 📊', description: 'Apri la plancia analitica con OTP' }, // 🔥 RIGA 1
              { id: 'btn_centrale', title: 'Centrale Operativa 🕹️', description: 'Apri la centrale di controllo Boss' } // 🔥 RIGA 2
            ]
          },
          {
            title: '📝 VISITE & INCARICHI', 
            rows: [
              { id: 'btn_registra_visita', title: 'Registra Visita 🖋️', description: 'Crea un nuovo foglio visita sul posto' },
              { id: 'btn_registra_incarico', title: 'Nuovo Incarico 📝', description: 'Apri modulo incarico con OTP Cloud' },
    { id: "btn_documentazione",   title: "📋 Foglio Documentazione", description: "Autorizzazione consegna documenti" }
            ]
          }
        ] // 🔥 TOTALE RIGHE: Esattamente 10! Limite massimo di Meta rispettato al millimetro e ZERO doppioni.
              }
    }
  };

  let opzioni = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(urlMeta, opzioni);
}



