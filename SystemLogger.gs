// Logging centralizzato su foglio LOG
// ==========================================================

const SystemLogger = {

  log: function(modulo, livello, messaggio, dati) {
    try {
      const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('LOG');
      if (!sheet) return;
      const timestamp = Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
      const datiStr = dati ? JSON.stringify(dati) : '';
      sheet.appendRow([timestamp, modulo, livello, messaggio, datiStr]);
    } catch (e) {
      // Silenzioso: il logger non deve mai bloccare il flusso principale
    }
  },

  info: function(modulo, messaggio, dati) {
    SystemLogger.log(modulo, 'INFO', messaggio, dati);
  },

  error: function(modulo, messaggio, dati) {
    SystemLogger.log(modulo, 'ERROR', messaggio, dati);
    // Gli errori vanno anche su Telegram Boss per visibilità immediata
    try {
      inviaTelegramBoss('⚠️ [ERRORE ' + modulo + ']\n' + messaggio);
    } catch(e) {}
  },

  warn: function(modulo, messaggio, dati) {
    SystemLogger.log(modulo, 'WARN', messaggio, dati);
  }

};


