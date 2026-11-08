// ==========================================

/**
 * Funzione principale. Genera un video reale della durata massima gestibile in un colpo solo.
 */
function eseguiCreaVideoStorico(tema) {
  if (!tema) {
    tema = "Tempio di Atene Nike e la storia vera delle sue ali tagliate, stile documentario epico";
  }
  
  Logger.log(`🎬 Avvio processo automazione video reale per il tema: "${tema}"`);
  
  try {
    // 1. Generazione Sceneggiatura e prompt coerenti tramite Groq
    const datiSceneggiatura = generaSceneggiaturaConGroq(tema);
    Logger.log("📝 Sceneggiatura e Prompt Video generati con successo da Groq.");
    
    // 2. Generazione del Video REALE tramite Vertex AI Veo (con attesa asincrona)
    const videoBlob = generaVideoCinematico(datiSceneggiatura.promptVideoGenerale);
    Logger.log("🎥 File video reale generato dall'AI recuperato correttamente.");
    
    // 3. Salvataggio su Google Drive nella cartella dedicata
    const fileDriveUrl = salvaVideoSuDrive(videoBlob, tema);
    Logger.log(`💾 Video salvato su Google Drive. Link: ${fileDriveUrl}`);
    
    // 4. Caricamento Automatico su YouTube tramite Servizio Avanzato v3
    const youtubeUrl = caricaVideoSuYouTube(videoBlob, tema, datiSceneggiatura.descrizioneOttimizzata);
    Logger.log(`🚀 Video pubblicato su YouTube! Link: ${youtubeUrl}`);
    
    // 5. Invio del Link a Daria su WhatsApp tramite Meta API
    const messaggioWhatsApp = `🎬 *Nuovo Video Storico REALE!*\n\n*Tema:* ${tema}\n\n📺 *Guarda su YouTube:* ${youtubeUrl}\n\n📂 *Backup su Drive:* ${fileDriveUrl}`;
    inviaWhatsAppMeta(NUMERO_DARIA, messaggioWhatsApp);
    Logger.log("📲 Notifica WhatsApp inviata correttamente a Daria.");
    
    return { success: true, youtubeUrl: youtubeUrl, driveUrl: fileDriveUrl };
    
  } catch (errore) {
    Logger.log(`❌ Errore critico nel flusso: ${errore.toString()}`);
    inviaWhatsAppMeta(CONFIG.ANTONIO_CHAT_ID, `⚠️ *Errore Automazione Video* sul tema "${tema}": ${errore.toString()}`);
    throw errore;
  }
}

/**
 * Genera lo script e i prompt video mantenendo la coerenza del personaggio
 */
function generaSceneggiaturaConGroq(tema) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  const sistemaPrompt = `Sei un autore televisivo e un esperto di prompt engineering per modelli video generativi (Google Veo, Omni).
  Dato un tema storico, devi restituire un oggetto JSON contenente:
  1. "descrizioneOttimizzata": Una descrizione accattivante in italiano ottimizzata per YouTube (con hashtag).
  2. "promptVideoGenerale": Un prompt cinematico iper-dettagliato in lingua inglese (max 150 parole) strutturato per generare un video di un minuto ad alto livello.
  REGOLA TASSATIVA DI COERENZA VISIVA: Il prompt deve definire lo stesso identico personaggio principale in modo fotorealistico: 'A 40-year-old Italian male historian, short dark hair, wearing a casual linen shirt, exploring the scene...'.
  Rispondi ESCLUSIVAMENTE con il codice JSON puro senza blocchi markdown o testo aggiuntivo.`;

  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: sistemaPrompt },
      { role: "user", content: `Genera i dati per il tema: ${tema}` }
    ],
    temperature: 0.6,
    response_format: { type: "json_object" }
  };

  const opzioni = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + CONFIG.KEYS.GROQ_2,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const risposta = UrlFetchApp.fetch(url, opzioni);
  if (risposta.getResponseCode() !== 200) {
    throw new Error(`Errore Groq API: ${risposta.getContentText()}`);
  }
  
  return JSON.parse(risposta.getContentText()).choices[0].message.content;
}

/**
 * Chiama Vertex AI Veo, recupera l'Operation ID e attende il completamento del video reale.
 */
/**
 * Chiama Vertex AI Veo usando l'ID progetto corretto recuperato dai log.
 */
function generaVideoCinematico(promptInglese) {
  const token = ScriptApp.getOAuthToken();
  
  // Inserito direttamente il numero del tuo progetto (316838101533) per evitare l'errore undefined
  const urlChiamata = `https://us-central1-aiplatform.googleapis.com/v1/projects/316838101533/locations/us-central1/publishers/google/models/veo-2.0-generate-video:predict`;
  
  const payload = {
    instances: [{ prompt: promptInglese }],
    parameters: { 
      durationSeconds: 60, 
      aspectRatio: "16:9", 
      sampleCount: 1 
    }
  };
  
  const opzioniIniziali = {
    method: "post",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const rispostaIniziale = UrlFetchApp.fetch(urlChiamata, opzioniIniziali);
  if (rispostaIniziale.getResponseCode() !== 200) {
    throw new Error(`Errore attivazione Veo: ${rispostaIniziale.getContentText()}`);
  }
  
  const jsonIniziale = JSON.parse(rispostaIniziale.getContentText());
  if (!jsonIniziale.name) {
    throw new Error("L'endpoint Veo non ha restituito un codice di operazione valido.");
  }
  
  const urlStatoOperazione = `https://us-central1-aiplatform.googleapis.com/v1/${jsonIniziale.name}`;
  Logger.log(`⏳ Video inviato in produzione su Vertex AI. ID Operazione: ${jsonIniziale.name}`);
  Logger.log("Avvio del ciclo di attesa (polling)...");

  const limiteTentativi = 12; 
  for (let i = 0; i < limiteTentativi; i++) {
    Utilities.sleep(20000); 
    Logger.log(`Controllo stato video (Tentativo ${i + 1}/${limiteTentativi})...`);
    
    const controllo = UrlFetchApp.fetch(urlStatoOperazione, {
      method: "get",
      headers: { "Authorization": "Bearer " + token },
      muteHttpExceptions: true
    });
    
    if (controllo.getResponseCode() === 200) {
      const operazione = JSON.parse(controllo.getContentText());
      
      if (operazione.done) {
        Logger.log("✅ L'AI ha terminato la generazione del video!");
        
        if (operazione.response && operazione.response.generatedVideos && operazione.response.generatedVideos[0].bytesBase64) {
          const videoDati = Utilities.base64Decode(operazione.response.generatedVideos[0].bytesBase64);
          return Utilities.newBlob(videoDati, "video/mp4", "video_storico.mp4");
        } else if (operazione.response && operazione.response.generatedVideos && operazione.response.generatedVideos[0].gcsUri) {
          const gcsUrl = operazione.response.generatedVideos[0].gcsUri.replace("gs://", "https://storage.googleapis.com/");
          return UrlFetchApp.fetch(gcsUrl, { headers: { "Authorization": "Bearer " + token } }).getBlob().setName("video_storico.mp4");
        }
        throw new Error("Video completato ma struttura dati non riconosciuta.");
      }
    }
  }
  
  throw new Error("Timeout: La generazione del video ha richiesto più di 4 minuti. Controlla la console di Vertex AI.");
}
/**
 * Salva il video generato nella cartella definita nel tuo CONFIG
 */
function salvaVideoSuDrive(videoBlob, tema) {
  const nomeCartella = CONFIG.DRIVE_ROOT_FOLDER_ID || "DariaCartelle";
  let cartella;
  
  const cerca = DriveApp.getFoldersByName(nomeCartella);
  if (cerca.hasNext()) {
    cartella = cerca.next();
  } else {
    cartella = DriveApp.createFolder(nomeCartella);
  }
  
  const pulisciNome = tema.replace(/[^a-zA-Z0-9]/g, "_");
  videoBlob.setName(`Video_${pulisciNome}.mp4`);
  
  const fileCreato = cartella.createFile(videoBlob);
  fileCreato.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return fileCreato.getUrl();
}

/**
 * Esegue l'upload su YouTube usando il servizio avanzato abilitato nel tuo manifest
 */
function caricaVideoSuYouTube(videoBlob, titolo, descrizione) {
  const risorsaVideo = {
    snippet: {
      title: titolo.substring(0, 100),
      description: descrizione,
      tags: ["Storia", "Archeologia", "Atene", "Automazione"],
      categoryId: "22"
    },
    status: { privacyStatus: "public" }
  };
  
  const videoPubblicato = YouTube.Videos.insert(risorsaVideo, "snippet,status", videoBlob);
  return `https://www.youtube.com/watch?v=${videoPubblicato.id}`;
}

/**
 * Invia la notifica via Cloud API WhatsApp di Meta
 */
function inviaWhatsAppMeta(numeroDestinatario, testoMessaggio) {
  const url = `https://graph.facebook.com/v17.0/${CONFIG.META_PHONE_ID}/messages`;
  
  let numeroPulito = numeroDestinatario.replace(/\D/g, "");
  if (!numeroPulito.startsWith("39") && numeroPulito.length < 11) {
    numeroPulito = "39" + numeroPulito;
  }

  const payload = {
    messaging_product: "whatsapp",
    to: numeroPulito,
    type: "text",
    text: { preview_url: true, body: testoMessaggio }
  };

  const opzioni = {
    method: "post",
    headers: {
      "Authorization": "Bearer " + CONFIG.WHATSAPP_TOKEN,
      "Content-Type": "application/json"
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const risposta = UrlFetchApp.fetch(url, opzioni);
  return risposta.getResponseCode() === 200;
}

