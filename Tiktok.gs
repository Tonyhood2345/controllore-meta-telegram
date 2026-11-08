// ==========================================


// 🎯 FUNZIONE DI AGGANCIO AUDIO INTEGRATA ADESSO PER LA RIGA 35
function OttieniIdAudioProtetto() {
  try {
    var audioId = PropertiesService.getScriptProperties().getProperty('ID_AUDIO_REELS');
    // Se non hai ancora inserito la proprietà del file audio su Apps Script, 
    // puoi incollare l'ID del tuo file Drive direttamente tra le virgolette qui sotto:
    return audioId || "INSERISCI_QUI_ID_FILE_AUDIO_SE_VUOI_HARDCODE"; 
  } catch (e) {
    return "";
  }
}

