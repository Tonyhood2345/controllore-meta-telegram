// ==========================================

// 🚀 INVIATORE OMNICHANNEL INTEGRATO: RILEVA IL CANALE E SPARA LA RISPOSTA CORRETTA
function inviaMessaggioOmnichannel(destinatario, testo) {
  var target = String(destinatario);
  // ⛔ META BLOCCATO: Qualsiasi messaggio omnichannel viene convogliato su Telegram
  var idTelegram = target.startsWith("TG_") ? target.replace("TG_", "") : CONFIG.TELEGRAM_CHAT_ID;
  var prefisso = target.startsWith("TG_") ? "" : "📢 *[MESSAGGIO OMNICHANNEL CONVOGLIATO SU TELEGRAM]*
👤 Destinatario: " + destinatario + "

";
  _inviaTelegramTesto(idTelegram, prefisso + testo);
  return;
  
  // CHIAMATA ORIGINALE ARCHIVIATA:
  // 🔵 CASO 1: TELEGRAM BOT
  if (target.startsWith("TG_")) {
    var idTelegram = target.replace("TG_", "");
    return;
  }
  
  // 🟣 CASO 2: FACEBOOK MESSENGER / INSTAGRAM DM
  if (target.startsWith("FB_")) {
    var idMetaPrivato = target.replace("FB_", "");
    // Endpoint universale di Meta per i messaggi privati di Page e Instagram
    let urlMetaMessages = 'https://graph.facebook.com/v21.0/me/messages';
    
    let payloadMeta = {
      recipient: { id: idMetaPrivato },
      message: { text: testo }
    };
    
    let opzioniMeta = {
      method: 'post',
      contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN }, // Usa il tuo token perpetuo di pagina
      payload: JSON.stringify(payloadMeta),
      muteHttpExceptions: true
    };
    
    UrlFetchApp.fetch(urlMetaMessages, opzioniMeta);
    return;
  }
  
  // 🟢 CASO 3: WHATSAPP BUSINESS NATIVO (Se sono solo numeri)
  let numPulito = target.replace(/\D/g, '');
  let urlMetaWA = 'https://graph.facebook.com/v21.0/' + CONFIG.META_PHONE_ID + '/messages';
  
  let payloadWA = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numPulito,
    type: 'text',
    text: { body: testo }
  };
  
  let opzioniWA = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payloadWA),
    muteHttpExceptions: true
  };
  
  UrlFetchApp.fetch(urlMetaWA, opzioniWA);
}

