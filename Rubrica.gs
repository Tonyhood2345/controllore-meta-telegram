// ==========================================

function cercaContattoInRubricaGoogle(nomeDaCercare) {
  try {
    if (!nomeDaCercare || nomeDaCercare.trim() === "") {
      return { successo: false, errore: "Scrivi un nome prima di cercare!" };
    }

    let response = People.People.searchContacts({
      query: nomeDaCercare,
      readMask: 'names,phoneNumbers'
    });
    
    if (!response.results || response.results.length === 0) {
      return { successo: false, errore: "Nessun contatto trovato con questo nome." };
    }
    
    let lista = [];
    let limite = Math.min(response.results.length, 5);
    
    for (let i = 0; i < limite; i++) {
      let r = response.results[i];
      let person = r.person;
      if (person) {
        let nome = (person.names && person.names.length > 0) ? person.names[0].displayName : "SENZA NOME";
        if (person.phoneNumbers && person.phoneNumbers.length > 0) {
          person.phoneNumbers.forEach(function(p) {
            let num = p.value ? p.value.replace(/\D/g, '') : "";
            let tag = p.formattedType || "Tel";
            if (num) {
              lista.push({
                nome: String(nome).toUpperCase(),
                telefono: num,
                tipo: tag
              });
            }
          });
        }
      }
    }
    
    if (lista.length === 0) {
      return { successo: false, errore: "Contatto trovato ma senza numeri di telefono." };
    }
    
    return { successo: true, contatti: lista };
  } catch(e) {
    return { successo: false, errore: e.toString() };
  }
}


/**
 * Genera l'OTP e lo invia DIRETTAMENTE al cellulare del cliente tramite WhatsApp Cloud API
 */
function inviaOTPDiretto(nome, telefono) {
  try {
    let numPulito = String(telefono).replace(/\D/g, '');
    if (!numPulito.startsWith('39') && numPulito.length === 10) numPulito = '39' + numPulito;
    
    // Generazione codice a 4 cifre
    let otpGenerato = Math.floor(1000 + Math.random() * 9000).toString();
    let keyNum = numPulito.slice(-10); // Chiave univoca sulle ultime 10 cifre
    
    PropertiesService.getScriptProperties().setProperty('OTP_VISITA_' + keyNum, otpGenerato);
    
    let msgRispostaOtp = `🔐 *IMMOBILIARE GIANCANI*\n\n` +
                         `Gentile *${nome}*, ecco il tuo codice OTP di verifica per l'attestazione di sopralluogo: *${otpGenerato}*\n\n` +
                         `Dettalo ad Antonio o Andrea sul posto per sbloccare la firma grafica digitale.`;
                         
    // Utilizza il motore di invio nativo già presente nel tuo script
    _inviaMetaWhatsApp(numPulito, msgRispostaOtp);
    return { successo: true };
  } catch(e) {
    return { successo: false, messaggio: e.toString() };
  }
}




