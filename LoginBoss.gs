// ==========================================



/**
 * Genera il codice di accesso per l'Amministratore e lo spedisce sfruttando l'API Cloud Meta nativa dell'agenzia
 */
function dcInviaOtpBoss(numero) {
  try {
    var numPulito = numero.replace(new RegExp("\\D", "g"), "");
    
    // Controllo rigido sul tuo numero di telefono principale
    if (numPulito !== "3201667156" && numPulito !== "393201667156") {
      return { ok: false, m: "Accesso Negato: Questo numero non è censito come Amministratore." };
    }
    
    // Se il numero è privo di prefisso internazionale lo normalizziamo per Meta
    if (numPulito.length === 10) {
      numPulito = "39" + numPulito;
    }
    
    var otpBoss = Math.floor(100000 + Math.random() * 900000).toString();
    var props = PropertiesService.getScriptProperties();
    
    props.setProperty('BOSS_OTP_SECRET', otpBoss);
    props.setProperty('BOSS_OTP_TIMESTAMP', new Date().getTime().toString());
    
    var messaggioWa = "🔐 *[SuperAgenda73]* Il tuo codice OTP di accesso amministratore è: *" + otpBoss + "*\n\nIl codice scadrà tra 5 minuti.";
    var inviatoConSuccesso = false;
    
    // Sfrutta la funzione nativa del tuo ecosistema per spedire il messaggio via Meta
    if (typeof _inviaMetaWhatsApp === "function") {
      _inviaMetaWhatsApp(numPulito, messaggioWa);
      inviatoConSuccesso = true;
    }
    
    // Fallback via Mail nel caso in cui le API di Meta avessero un timeout momentaneo
    if (!inviatoConSuccesso) {
      var emailAmministratore = Session.getActiveUser().getEmail();
      GmailApp.sendEmail(
        emailAmministratore, 
        "🔐 NOTIFICA DI ACCESSO — Codice OTP SuperAgenda73", 
        "DarIA Gateway ha rilevato una richiesta di sblocco manuale.\n\nIl tuo codice OTP valido è: " + otpBoss
      );
    }
    
    return { ok: true };
  } catch(e) {
    return { ok: false, m: "Impossibile trasmettere il codice di sblocco: " + e.toString() };
  }
}


