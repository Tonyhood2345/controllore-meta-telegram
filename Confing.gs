// ==========================================

const CONFIG = {
  // ⛔ BLOCCO META ATTIVO: Tutte le comunicazioni verso Meta sono bloccate e convogliate su Telegram
  META_BLOCKED: true,

  IG_USER_ID: '17841400301393511',

  META_APP_ID:     '1767940327228817',      // ← aggiunto qui
  META_APP_SECRET: '9ea1a5cd71aa2ca293d1a119e359055f',  // ← aggiunto qui

  FB_TOKEN: 'EAAZAH7q8wRZAEBR5o12BCIsIhaKwmhgr8viVYbbAducL8qYVmREm4YdImBaH06GTdql3QZApJJ8d3twlKLBQK7FRjlNq8SZCKymz7TfFeHYPEH5e7hDYtqjDDHpR7wEtUBU671SbVoTdDNEY6KKpGMz81dJhCHBNozOPEkrdJWWGeOGIrPO4EZASARrinrepJFeEaAN0OMZADalQXv',
  YOUTUBE_CHANNEL_ID: 'UC7jCI1x_cwh_sOrNPJpaKyQ',

MASTER_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbzq3gfy5JCZJT1tyF4oECkBFVrckxVzqDuAJgUSvPhU4rv2Bztj7EUT3m4b5ILm4Vdc/exec",
VISITA_WEBAPP_URL: "https://script.google.com/macros/s/AKfycbzq3gfy5JCZJT1tyF4oECkBFVrckxVzqDuAJgUSvPhU4rv2Bztj7EUT3m4b5ILm4Vdc/exec",

  // 🤖 BOT TELEGRAM UFFICIALI IMMOBILIARE GIANCANI
  TELEGRAM_TOKEN:   '9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0', // @AMMINISTRAZIONISOCIAL_BOT (Primario Social & Dashboard)
  TELEGRAM_BOT_USERNAME: 'AMMINISTRAZIONISOCIAL_BOT',
  TELEGRAM_TOKEN_GIANCANI_BOT: '8643190035:AAHaUOT12j8l9f6GU9WW4W9HFOLfV-5r5-U', // Bot Giancani
  TELEGRAM_TOKEN_SECONDARIO:   '8671578336:AAEHI-s-2g3dY9qnIIVc_hWzDdOuHm-MS6M', // Bot Mindset & Rilancio
  TELEGRAM_CHAT_ID: '1723292483', // Antonio Giancani

  DRIVE_ROOT_FOLDER_ID: 'DariaCartelle',
  COL_CARTELLA_DRIVE: 20,

  GITHUB_TOKEN: PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN') || 'ghp_CONFIG_TOKEN_DA_PROPERTIES',
  GITHUB_USER:  'Tonyhood2345',

  META_PHONE_ID:     '1052221094649213',
  WHATSAPP_TOKEN:    PropertiesService.getScriptProperties().getProperty('WHATSAPP_TOKEN') || 'EAA_CONFIG_TOKEN_DA_PROPERTIES',
  META_VERIFY_TOKEN: 'GiancaniTop2026',

  ANTONIO_CHAT_ID: '393201667156',
  ID_BOSS: ['3201667156', '393201667156', '230970523394182', '1723292483'],

  LOG_SHEET_ID: '1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g',
  CALENDAR_ID:  'giancaniimmobiliare@gmail.com',
  TIMEZONE:     'Europe/Rome',

  KEYS: {
    GROQ_1: PropertiesService.getScriptProperties().getProperty('GROQ_1') || 'gsk_CONFIG_KEY_1_DA_PROPERTIES',
    GROQ_2: PropertiesService.getScriptProperties().getProperty('GROQ_2') || 'gsk_CONFIG_KEY_2_DA_PROPERTIES'
  },

  FIRME_AGENTI: {
    "Antonio Giancani": "10se1bI3xIy9HCGdmjrPAzumIftSI-twR",
    "Andrea Giancani":  "INCOLLA_QUI_ID_FILE_PNG_ANDREA",
    "Collaboratore":    "INCOLLA_QUI_ID_FILE_PNG_TERZO"
  },

  LINK_VIDEO_TOP: 'https://www.youtube.com/watch?v=INSERISCI_IL_TUO_LINK_QUI',

  COL_DESCRIZIONE: 5,
  COL_TIPOLOGIA:   12,
  COL_FACEBOOK:    16,
  COL_INSTAGRAM:   17,
  COL_YOUTUBE:     18,
  COL_CITTA:       24,

  MAX_DAILY_LINKS: 12,
  MAX_PROPOSTE:    3,
  TROLL_NAMES: ['batman', 'spiderman', 'cazzo', 'merda', 'stronzo', 'scemo', 'test', 'fake']

}; // ← unica chiusura

// Cambia const con var per evitare il blocco del sistema
var ID_MODELLO_PRIVACY_AML = (() => {
  try { return CONFIG.ID_MODELLO_PRIVACY_AML || "1L2yMtTTjEH8h3tF5A5RdKT8xiDJY3HGFTfRZVzN6910"; } 
  catch(e) { return "1L2yMtTTjEH8h3tF5A5RdKT8xiDJY3HGFTfRZVzN6910"; }
})();

// ============================================================
// ⚙️ CONFIGURAZIONE GLOBALE - AGENDA 73 (COMPLETO)
// ============================================================
const ID_SHEET = "19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc";
const ID_MODELLO_DOC = "1_ADjqX_FgeYgaToGytnhXwT1wvDx4exP54RhhI5JY6M";
const NUMERO_DARIA = "3505902923";
const WEB_APP_URL_BROADCAST = "https://script.google.com/macros/s/AKfycbyJDj-tqxehAAz_exYdAs-Vu15vjz5KN7Y4NkDLgYMSK-aLVAA3jB7eCK-HDZ3m4Jyl/exec?venditori=true";
// ── FALLBACK SICURO CORRETTO (Previene il crash del Temporal Dead Zone) ───
const ID_SHEET_INC = (() => {
  try { return CONFIG.LOG_SHEET_ID || "1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g"; } 
  catch(e) { return "1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g"; }
})();

const ID_MODELLO_INC = (() => {
  try { return CONFIG.ID_MODELLO_INC || "1UL0d6eoM0iAgxrknOhogKNQn4rjh9Dc_aQLNQexvc3k"; } 
  catch(e) { return "1UL0d6eoM0iAgxrknOhogKNQn4rjh9Dc_aQLNQexvc3k"; }
})();

const ID_DOC_MODELLO_DOCUMENTAZIONE = "13nzbu_v6lLn8wAJLEOzEnicH5BMbSMFXp9MdEelbL58";
const DARIA_NUMBER_INC = (() => {
  try { return CONFIG.DARIA_NUMBER || "3505902923"; } 
  catch(e) { return "3505902923"; }
})();

function backupInteroProgetto() {
  const nomeCartella = "Agenda 73";
  let cartella;
  
  // 1. Gestione o creazione della cartella "Agenda 73" su Drive
  const cercaCartella = DriveApp.getFoldersByName(nomeCartella);
  if (cercaCartella.hasNext()) {
    cartella = cercaCartella.next();
  } else {
    cartella = DriveApp.createFolder(nomeCartella);
  }
  
  const dataOraAttuale = new Date();
  let testoCompleto = `=== BACKUP PROGETTO ===\n`;
  testoCompleto += `Data e Ora: ${dataOraAttuale.toLocaleString('it-IT')}\n\n`;
  
  // 2. Recupera l'ID del progetto
  const scriptId = ScriptApp.getScriptId();
  
  try {
    // Chiamata all'API di Drive v3 con l'aggiunta cruciale di &alt=media e la codifica del '+' (%2B)
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${scriptId}/export?mimeType=application/vnd.google-apps.script%2Bjson&alt=media`;
    const token = ScriptApp.getOAuthToken();
    
    const response = UrlFetchApp.fetch(exportUrl, {
      headers: { 'Authorization': 'Bearer ' + token },
      muteHttpExceptions: true
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      if (data.files) {
        data.files.forEach(file => {
          testoCompleto += `\n\n// ==========================================\n`;
          testoCompleto += `// FILE: ${file.name}.${file.type === 'html' ? 'html' : 'gs'}\n`;
          testoCompleto += `// ==========================================\n\n`;
          testoCompleto += file.source;
        });
        Logger.log("✅ Codice sorgente estratto con successo!");
      } else {
        testoCompleto += `⚠️ Nessun file trovato all'interno del progetto.\n`;
      }
    } else {
      // Se risponde con un errore, lo salviamo per vederlo nel file
      Logger.log(`❌ Errore durante l'esportazione. Codice: ${response.getResponseCode()}`);
      Logger.log(`Dettagli: ${response.getContentText()}`);
      testoCompleto += `⚠️ ERRORE RICEVUTO DA GOOGLE (Codice ${response.getResponseCode()}):\n`;
      testoCompleto += response.getContentText();
    }
    
  } catch(e) {
    Logger.log(`❌ Errore imprevisto: ${e.toString()}`);
    testoCompleto += `Errore durante il recupero automatico: ${e.toString()}`;
  }
  
  // 3. Formatta data e ora per il nome del file
  const anno = dataOraAttuale.getFullYear();
  const mese = String(dataOraAttuale.getMonth() + 1).padStart(2, '0');
  const giorno = String(dataOraAttuale.getDate()).padStart(2, '0');
  const ore = String(dataOraAttuale.getHours()).padStart(2, '0');
  const minutes = String(dataOraAttuale.getMinutes()).padStart(2, '0');
  
  const nomeFileBackup = `Backup_Script_${anno}-${mese}-${giorno}_${ore}-${minutes}.txt`;
  
  // 4. Crea il file dentro "Agenda 73"
  const fileCreato = cartella.createFile(nomeFileBackup, testoCompleto, MimeType.PLAIN_TEXT);
  
  Logger.log(" ");
  Logger.log(`✅ Operazione completata! Check nella cartella "${nomeCartella}" su Drive.`);
  Logger.log(`👉 Link: ${fileCreato.getUrl()}`);
}


const MENU_CITTA_EMOJI = '\n🏙️ Favara\n🏙️ Agrigento\n🏙️ Altra zona';
const MENU_IMMOBILI_EMOJI = '\n🏠 Appartamento\n🏡 Villa\n🏢 Locale commerciale';




