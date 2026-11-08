// ==========================================

// ── LEGGE LA CRONOLOGIA DAL FOGLIO GOOGLE ──
function htmlOttieniCronologia(numero) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log');
    const data = sheet.getDataRange().getValues();
    let cronologia = [];
    let numPulito = String(numero).replace(/\D/g, '');

    // Legge solo gli ultimi 100 messaggi per non appesantire la pagina
    let start = Math.max(1, data.length - 100);

    for (let i = start; i < data.length; i++) {
      let rowNum = String(data[i][1]).replace(/\D/g, '');
      if (rowNum === numPulito || rowNum.includes(numPulito)) {
        let text = String(data[i][3]);
        let timestamp = Utilities.formatDate(new Date(data[i][0]), CONFIG.TIMEZONE, 'dd/MM HH:mm');
        
        if (text.startsWith('U:')) {
          cronologia.push({ tipo: 'user', testo: text.substring(2), tempo: timestamp });
        } else if (text.startsWith('B:')) {
          cronologia.push({ tipo: 'bot', testo: text.substring(2), tempo: timestamp });
        }
      }
    }
    return cronologia;
  } catch(e) {
    return [{tipo: 'bot', testo: '⚠️ Errore caricamento chat: ' + e.message, tempo: ''}];
  }
}

// ── INVIA MEDIA (FOTO/VIDEO/PDF) TRAMITE GOOGLE DRIVE E META API ──
function htmlInviaMedia(numero, base64Data, mimeType, filename, caption) {
  try {
    // 1. Crea il file temporaneo su Google Drive per ottenere un link
    let blob = Utilities.newBlob(Utilities.base64Decode(base64Data), mimeType, filename);
    let file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    let urlMedia = file.getDownloadUrl();

    // 2. Prepara l'invio a Meta
    let numPulito = String(numero).replace(/\D/g, '');
    if (numPulito.length > 15) numPulito = numPulito.substring(0, 15);
    
    let type = mimeType.startsWith('image/') ? 'image' : (mimeType.startsWith('video/') ? 'video' : 'document');

    let payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: numPulito,
      type: type
    };
    payload[type] = { link: urlMedia };
    if (caption) payload[type].caption = caption;

    // 3. Invia la chiamata API a Meta
    UrlFetchApp.fetch('https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages', {
      method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });

    // 4. Logga nel foglio
    let logTesto = caption ? '[Allegato Inviato] ' + caption : '[Allegato Inviato]';
    SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').appendRow([new Date(), numero, 'Antonio (Manuale)', 'B:' + logTesto]);

    return "Allegato inviato con successo!";
  } catch(e) {
    return "Errore invio file: " + e.message;
  }
}

