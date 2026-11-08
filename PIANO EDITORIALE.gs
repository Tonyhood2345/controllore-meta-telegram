// ==========================================


function DIAGNOSI_piano_editoriale() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1️⃣ Elenca tutti i nomi dei fogli presenti
  const fogli = ss.getSheets().map(s => s.getName());
  Logger.log("📂 Fogli nel file: " + fogli.join(" | "));

  // 2️⃣ Prova ad aprire il foglio Piano_Editoriale_2026
  const sheet = ss.getSheetByName('Piano_Editoriale_2026');
  if (!sheet) { Logger.log("❌ FOGLIO NON TROVATO - controlla il nome esatto!"); return; }
  
  const dati = sheet.getDataRange().getValues();
  Logger.log("📊 Righe totali (inclusa header): " + dati.length);

  // 3️⃣ Mostra le prime 3 righe con gli indici di colonna
  for (let i = 0; i < Math.min(3, dati.length); i++) {
    Logger.log("Riga " + i + " → ColA:" + dati[i][0] + 
               " | ColC:" + dati[i][2] + 
               " | ColF:" + dati[i][5]);
  }

  // 4️⃣ Conta le righe con SI in ColF
  const countSI = dati.slice(1).filter(r => String(r[5]).toUpperCase().trim() === 'SI').length;
  Logger.log("✅ Righe con Stato_Evergreen = SI: " + countSI);
}
function TEST_piano_editoriale() {
  let risultato = pescaContestoEditoriale("dove si trova questo immobile");
  Logger.log("📋 Contesto trovato:\n" + risultato);
}




// ══════════════════════════════════════════════════════════════
// ── RISPOSTE PUBBLICHE VARIATE "TI HO SCRITTO IN PRIVATO" ────
// ══════════════════════════════════════════════════════════════

/**
 * Genera una risposta pubblica al commento sempre diversa,
 * cordiale e più lunga. Usa Groq per variare ogni volta.
 */
function generaRispostaPubblica(mittente, piattaforma, testoCommento) {
  try {
    let prompt = `Sei Antonio Giancani, agente immobiliare a Favara. 
Hai appena inviato un messaggio privato a ${mittente} che ha commentato: "${testoCommento}" su ${piattaforma}.
Scrivi UNA risposta pubblica al commento (max 2 righe) che:
- Lo saluti per nome in modo caldo e personale
- Gli dica che gli hai appena scritto in privato con tutte le informazioni
- Usi un emoji pertinente
- Firmi come Antonio Giancani
- NON essere sempre uguale: varia il tono, le parole, gli emoji
- NON inventare dettagli sull'immobile`;

    let risposta = callGroq(prompt, "Genera risposta pubblica");
    
    // Fallback se Groq fallisce
    if (!risposta || risposta.length < 10) {
      let varianti = [
        `Grazie ${mittente} per l'interesse! 🏡 Ti ho appena scritto in privato con tutti i dettagli — non perderti le foto esclusive. A presto! — Antonio Giancani`,
        `Ciao ${mittente}! Ottima scelta fermarsi su questo immobile 😊 Ti ho già inviato un messaggio privato con planimetrie e scheda tecnica. Controllalo! — Antonio Giancani`,
        `${mittente} che bello sentirti! 🌟 Ho preso nota del tuo interesse e ti ho scritto in privato con tutte le informazioni riservate. A disposizione! — Antonio Giancani`,
        `Grazie per il commento ${mittente}! 📩 Ti ho già contattato in privato — trovi lì la scheda completa e i recapiti diretti. Ci sentiamo presto! — Antonio Giancani`
      ];
      risposta = varianti[Math.floor(Math.random() * varianti.length)];
    }
    
    return risposta;
    
  } catch(err) {
    return `Grazie ${mittente}! 📩 Ti ho scritto in privato con tutti i dettagli. — Antonio Giancani`;
  }
}


function processaCodaCommenti() {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet()
                              .getSheetByName('CODA_COMMENTI');
    if (!sheet) return;

    let dati   = sheet.getDataRange().getValues();
    let adesso = new Date().getTime();

    for (let i = 1; i < dati.length; i++) {
      let stato = dati[i][4];

      if (stato === "DA_FARE" || stato === "SCELTA_FORZATA") {
        let dataArrivo      = new Date(dati[i][0]).getTime();
        let commentIdPieno  = dati[i][1];
        let mittente        = dati[i][2];
        let testoCommento   = dati[i][3];   // testo originale del commento
        let minutiDelay     = parseInt(dati[i][5]);
        let linkPost        = dati[i][10] || "Link non disponibile";

        let isYouTube   = String(commentIdPieno).startsWith("yt_");
        let isInstagram = String(commentIdPieno).startsWith("ig_");
        let piattaforma = dati[i][11] || (isYouTube ? "YouTube" : (isInstagram ? "Instagram" : "Facebook"));

        let minutiPassati = (adesso - dataArrivo) / (1000 * 60);

        if (minutiPassati >= minutiDelay || stato === "SCELTA_FORZATA") {
          let realId          = String(commentIdPieno).replace("fb_","").replace("yt_","").replace("ig_","");
          let testoDaInviare  = dati[i][9];           // testo scelto dal Boss
          if (!testoDaInviare || testoDaInviare.trim() === "") {
            testoDaInviare = dati[i][6];              // fallback: opzione 1
          }

          let successo = false;

          // ▶️ YOUTUBE: risposta pubblica diretta (DM non supportato)
          if (isYouTube) {
            successo = _inviaRispostaCommentoYT(realId, testoDaInviare);

            if (successo) {
              sheet.getRange(i + 1, 5).setValue("FATTO");
              inviaTelegramBoss(
                `✅ *RISPOSTA SU YOUTUBE INVIATA*\n` +
                `👤 A: ${mittente}\n` +
                `💬 DarIA: "${testoDaInviare}"\n` +
                `🔗 ${linkPost}`
              );
            } else {
              sheet.getRange(i + 1, 5).setValue("ERRORE_API");
            }

          // 📸 INSTAGRAM & 📘 FACEBOOK: DM privato + risposta pubblica variata
          } else {
            // 1️⃣ Genera risposta pubblica sempre diversa con Groq
            let rispostaPubblica = generaRispostaPubblica(mittente, piattaforma, testoCommento);

            // 2️⃣ Invia DM privato con le info complete
            let dmInviato = false;
            if (isInstagram) {
              dmInviato = _inviaDmInstagram(realId, testoDaInviare);
              successo  = _inviaRispostaCommentoIG(realId, rispostaPubblica);
            } else {
              dmInviato = _inviaDmFacebook(realId, testoDaInviare);
              successo  = _inviaRispostaCommentoFB(realId, rispostaPubblica);
            }

            if (successo) {
              sheet.getRange(i + 1, 5).setValue("FATTO");

              // Log Telegram con dettaglio DM + risposta pubblica
              let emojiPiatt = isInstagram ? "📸" : "📘";
              let dmStatus   = dmInviato ? "✅ DM inviato" : "⚠️ DM non inviato";
              inviaTelegramBoss(
                `${emojiPiatt} *RISPOSTA SU ${piattaforma.toUpperCase()} INVIATA*\n` +
                `👤 A: ${mittente}\n` +
                `📩 ${dmStatus}\n` +
                `💬 Privato: "${testoDaInviare.substring(0, 80)}..."\n` +
                `🌐 Pubblica: "${rispostaPubblica}"\n` +
                `🔗 ${linkPost}`
              );
            } else {
              sheet.getRange(i + 1, 5).setValue("ERRORE_API");
            }
          }
        }
      }
    }
  } catch(err) {
    try { inviaTelegramBoss("⚠️ Errore processaCodaCommenti: " + err.toString()); } catch(e) {}
  }
}





// ══════════════════════════════════════════════════════════════
// ── IMPORTATORE PIANO EDITORIALE 2026 (FB + IG + YT) ─────────
// ── Esegui: importaTuttiIPost()                           ─────
// ══════════════════════════════════════════════════════════════

/**
 * MASTER: importa da Facebook, Instagram e YouTube in un colpo solo
 */
function importaTuttiIPost() {
  // ⛔ KILL SWITCH META: Blocco preventivo trigger a tempo
  Logger.log("⛔ [KILL SWITCH META] importaTuttiIPost bloccata preventivamente.");
  return;
  Logger.log("🚀 Avvio importazione post...");
  importaPostFacebook();
  importaPostInstagram();
  importaVideoYouTube();
  Logger.log("✅ Importazione completata! Apri Piano_Editoriale_2026 per verificare.");
}

// ──────────────────────────────────────────────────────────────
// HELPER: ottieni o inizializza il foglio Piano_Editoriale_2026
// ──────────────────────────────────────────────────────────────
function _getPianoSheet() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let   sheet = ss.getSheetByName('Piano_Editoriale_2026');
  
  if (!sheet) {
    sheet = ss.insertSheet('Piano_Editoriale_2026');
  }
  
  // Scrivi intestazioni se il foglio è vuoto
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'ID_Post', 'Data_Pubblicazione', 'Testo_Originale_FB',
      'Tipo_Media', 'Link_Media_Sorgente', 'Stato_Evergreen', 'Conteggio_Interazioni'
    ]);
    sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#5c061a').setFontColor('#ffffff');
  }
  
  return sheet;
}

// ──────────────────────────────────────────────────────────────
// HELPER: controlla se un ID è già presente nel foglio (no duplicati)
// ──────────────────────────────────────────────────────────────
function _idGiaPresente(sheet, id) {
  const dati = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
  return dati.some(function(row) { return String(row[0]) === String(id); });
}

// ──────────────────────────────────────────────────────────────
// HELPER: calcola Stato_Evergreen (SI se testo > 80 char e interazioni > 0)
// ──────────────────────────────────────────────────────────────
function _calcolaEvergreen(testo, interazioni) {
  return (String(testo).length > 80 && interazioni >= 0) ? 'SI' : 'NO';
}

// ══════════════════════════════════════════════════════════════
// 1. FACEBOOK PAGE POSTS
// ══════════════════════════════════════════════════════════════
function importaPostFacebook() {
  // ⛔ KILL SWITCH META: Blocco preventivo trigger a tempo
  Logger.log("⛔ [KILL SWITCH META] importaPostFacebook bloccata preventivamente.");
  return;
  try {
    const sheet = _getPianoSheet();
    
    // Recupera l'ID della pagina Facebook
    const meUrl   = "https://graph.facebook.com/v21.0/me?fields=id,name&access_token=" + getTokenMetaAttivo();
    const meRes   = UrlFetchApp.fetch(meUrl, { muteHttpExceptions: true });
    const meJson  = JSON.parse(meRes.getContentText());
    const pageId  = meJson.id;
    
    if (!pageId) { Logger.log("❌ FB: impossibile ottenere Page ID"); return; }
    Logger.log("📘 Facebook Page ID: " + pageId);

    // Scarica gli ultimi 50 post
    const fbUrl = "https://graph.facebook.com/v21.0/" + pageId + 
                  "/posts?fields=id,message,story,created_time,full_picture,likes.summary(true),comments.summary(true),shares&limit=50&access_token=" + getTokenMetaAttivo();
    const res   = UrlFetchApp.fetch(fbUrl, { muteHttpExceptions: true });
    const json  = JSON.parse(res.getContentText());
    
    const posts = json.data || [];
    let   nuovi = 0;
    
    posts.forEach(function(post) {
      const testo = post.message || post.story || "";
      if (!testo || testo.length < 10) return;
      if (_idGiaPresente(sheet, "fb_" + post.id)) return;
      
      const likes     = (post.likes    && post.likes.summary)    ? post.likes.summary.total_count    : 0;
      const commenti  = (post.comments && post.comments.summary) ? post.comments.summary.total_count : 0;
      const condiv    = (post.shares)                            ? post.shares.count                 : 0;
      const interaz   = likes + commenti + condiv;
      const linkPost  = "https://facebook.com/" + post.id.replace('_', '/posts/');
      const evergreen = _calcolaEvergreen(testo, interaz);
      
      sheet.appendRow([
        "fb_" + post.id,
        new Date(post.created_time),
        testo,
        post.full_picture ? "Immagine" : "Testo",
        post.full_picture || linkPost,
        evergreen,
        interaz
      ]);
      nuovi++;
    });
    
    Logger.log("📘 Facebook: " + nuovi + " post importati (su " + posts.length + " trovati)");
    
  } catch(err) {
    Logger.log("❌ Errore Facebook: " + err.toString());
  }
}

// ══════════════════════════════════════════════════════════════
// 2. INSTAGRAM BUSINESS POSTS
// ══════════════════════════════════════════════════════════════
function importaPostInstagram() {
  try {
    const sheet = _getPianoSheet();
    const igId  = CONFIG.IG_USER_ID;
    
    if (!igId) { Logger.log("⚠️ CONFIG.IG_USER_ID non impostato"); return; }
    Logger.log("📸 Instagram Business ID: " + igId);
    
    const igUrl = "https://graph.facebook.com/v21.0/" + igId + 
                  "/media?fields=id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count&limit=50&access_token=" + getTokenMetaAttivo();
    const res   = UrlFetchApp.fetch(igUrl, { muteHttpExceptions: true });
    const json  = JSON.parse(res.getContentText());
    
    if (json.error) { Logger.log("❌ IG API Error: " + JSON.stringify(json.error)); return; }
    
    const posts = json.data || [];
    let   nuovi = 0;
    
    posts.forEach(function(post) {
      const testo = post.caption || "";
      if (!testo || testo.length < 10) return;
      if (_idGiaPresente(sheet, "ig_" + post.id)) return;
      
      const interaz   = (post.like_count || 0) + (post.comments_count || 0);
      const tipoMedia = post.media_type === 'VIDEO' ? 'Reels/Video' 
                      : post.media_type === 'CAROUSEL_ALBUM' ? 'Carosello' 
                      : 'Immagine';
      const evergreen = _calcolaEvergreen(testo, interaz);
      
      sheet.appendRow([
        "ig_" + post.id,
        new Date(post.timestamp),
        testo,
        tipoMedia,
        post.media_url || post.permalink || "",
        evergreen,
        interaz
      ]);
      nuovi++;
    });
    
    Logger.log("📸 Instagram: " + nuovi + " post importati (su " + posts.length + " trovati)");
    
  } catch(err) {
    Logger.log("❌ Errore Instagram: " + err.toString());
  }
}

// ══════════════════════════════════════════════════════════════
// 3. YOUTUBE CHANNEL VIDEOS
// ══════════════════════════════════════════════════════════════
function importaVideoYouTube() {
  try {
    if (!CONFIG.YOUTUBE_CHANNEL_ID || CONFIG.YOUTUBE_CHANNEL_ID === "INSERISCI_QUI_IL_TUO_ID_CANALE") {
      Logger.log("⚠️ YouTube: YOUTUBE_CHANNEL_ID non configurato in CONFIG.");
      return;
    }
    
    const sheet = _getPianoSheet();
    
    // Scarica gli ultimi 50 video del canale
    const response = YouTube.Search.list('snippet', {
      channelId: CONFIG.YOUTUBE_CHANNEL_ID,
      maxResults: 50,
      order: 'date',
      type: 'video'
    });
    
    const items = response.items || [];
    let   nuovi = 0;
    
    items.forEach(function(item) {
      const videoId  = item.id.videoId;
      const snippet  = item.snippet;
      const titolo   = snippet.title   || "";
      const descr    = snippet.description || "";
      const testo    = titolo + (descr ? "\n\n" + descr.substring(0, 300) : "");
      
      if (!testo || titolo.length < 3) return;
      if (_idGiaPresente(sheet, "yt_" + videoId)) return;
      
      // Recupera statistiche video (views, likes)
      let interaz = 0;
      try {
        const statsRes = YouTube.Videos.list('statistics', { id: videoId });
        const stats    = statsRes.items && statsRes.items[0] ? statsRes.items[0].statistics : {};
        interaz = parseInt(stats.viewCount || 0) + parseInt(stats.likeCount || 0);
      } catch(e) {}
      
      const linkVideo = "https://www.youtube.com/watch?v=" + videoId;
      const thumbUrl  = snippet.thumbnails && snippet.thumbnails.high ? snippet.thumbnails.high.url : "";
      const evergreen = _calcolaEvergreen(testo, interaz);
      
      sheet.appendRow([
        "yt_" + videoId,
        new Date(snippet.publishedAt),
        testo,
        "Video YouTube",
        thumbUrl || linkVideo,
        evergreen,
        interaz
      ]);
      nuovi++;
    });
    
    Logger.log("▶️ YouTube: " + nuovi + " video importati (su " + items.length + " trovati)");
    
  } catch(err) {
    Logger.log("❌ Errore YouTube: " + err.toString());
  }
}


// ══════════════════════════════════════════════════════════════
// ── SISTEMA NOTIFICHE COMMENTI + DM PRIVATO ───────────────────
// ══════════════════════════════════════════════════════════════

function inviaNotificaWABoss(commentIdPieno, mittente, testoComm, piattaforma, linkPost, opz1, opz2, opz3) {
  try {
    let ticket = String(Date.now()).slice(-6);
    PropertiesService.getScriptProperties().setProperty(
      'CMT_' + ticket,
      JSON.stringify({ id: commentIdPieno, opz1: opz1, opz2: opz2, opz3: opz3, mittente: mittente, piattaforma: piattaforma })
    );
    let corpo = `🚨 NUOVO COMMENTO SU ${piattaforma.toUpperCase()}\n` +
                `👤 Da: ${mittente}\n` +
                `💬 "${testoComm.substring(0, 100)}${testoComm.length > 100 ? '...' : ''}"\n` +
                `🔗 ${linkPost}\n\n` +
                `1️⃣ ${opz1.substring(0, 80)}...\n\n` +
                `2️⃣ ${opz2.substring(0, 80)}...\n\n` +
                `3️⃣ ${opz3.substring(0, 80)}...`;
    UrlFetchApp.fetch('https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages', {
      method: 'post', contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
      payload: JSON.stringify({
        messaging_product: 'whatsapp', recipient_type: 'individual',
        to: CONFIG.ID_BOSS[0], type: 'interactive',
        interactive: {
          type: 'button', body: { text: corpo },
          action: { buttons: [
            { type: 'reply', reply: { id: 'cmt_1_' + ticket, title: '✅ Opzione 1' }},
            { type: 'reply', reply: { id: 'cmt_2_' + ticket, title: '✅ Opzione 2' }},
            { type: 'reply', reply: { id: 'cmt_3_' + ticket, title: '🛑 Blocca' }}
          ]}
        }
      }),
      muteHttpExceptions: true
    });
  } catch(err) { Logger.log("❌ inviaNotificaWABoss: " + err.toString()); }
}




function _inviaDmFacebook(commentId, testo) {
  try {
    let meRes  = UrlFetchApp.fetch("https://graph.facebook.com/v21.0/me?fields=id&access_token=" + getTokenMetaAttivo(), { muteHttpExceptions: true });
    let pageId = JSON.parse(meRes.getContentText()).id;
    let res = UrlFetchApp.fetch("https://graph.facebook.com/v21.0/" + pageId + "/conversations", {
      method: "post", contentType: "application/json",
      payload: JSON.stringify({ messaging_type: "RESPONSE", recipient: { comment_id: commentId }, message: { text: testo } }),
      headers: { "Authorization": "Bearer " + getTokenMetaAttivo() },
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch(err) { return false; }
}

function _inviaDmInstagram(commentId, testo) {
  try {
    if (!CONFIG.IG_USER_ID) return false;
    let res = UrlFetchApp.fetch("https://graph.facebook.com/v21.0/" + CONFIG.IG_USER_ID + "/messages", {
      method: "post", contentType: "application/json",
      payload: JSON.stringify({ recipient: { comment_id: commentId }, message: { text: testo } }),
      headers: { "Authorization": "Bearer " + getTokenMetaAttivo() },
      muteHttpExceptions: true
    });
    return res.getResponseCode() === 200;
  } catch(err) { return false; }
}



function TROVA_INSTAGRAM_ID_v2() {
  // Il token è un Page Token → /me È già la pagina
  let url1 = "https://graph.facebook.com/v21.0/me?fields=id,name,instagram_business_account&access_token=" + getTokenMetaAttivo();
  let res1  = UrlFetchApp.fetch(url1, { muteHttpExceptions: true });
  let json1 = JSON.parse(res1.getContentText());
  
  Logger.log("📘 /me risponde: " + JSON.stringify(json1));
  
  if (json1.instagram_business_account) {
    let igId = json1.instagram_business_account.id;
    Logger.log("✅ INSTAGRAM ID: " + igId);
    
    // Recupera username
    let url2 = "https://graph.facebook.com/v21.0/" + igId + "?fields=username,name&access_token=" + getTokenMetaAttivo();
    let res2  = UrlFetchApp.fetch(url2, { muteHttpExceptions: true });
    let json2 = JSON.parse(res2.getContentText());
    Logger.log("📸 Username IG: @" + (json2.username || json2.name || "N/D"));
    Logger.log("👉 Aggiungi in CONFIG → IG_USER_ID: '" + igId + "'");
    
  } else if (json1.error) {
    Logger.log("❌ Errore API: " + JSON.stringify(json1.error));
  } else {
    Logger.log("⚠️ Nessun Instagram Business collegato a questa Page.");
    Logger.log("→ Vai su facebook.com → Impostazioni Pagina → Instagram → Collega account");
  }
}


