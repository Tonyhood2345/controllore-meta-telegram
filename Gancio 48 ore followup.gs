// ==========================================

function inviaGancioAnticipato() {
  try {
    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    // Cerca gli appuntamenti di DOPODOMANI (2 giorni = 172800000 ms)
    const eventi = cal.getEventsForDay(new Date(Date.now() + 172800000));
    
    if (eventi.length === 0) return;

    eventi.forEach(function(ev) {
      let titolo = ev.getTitle() ? ev.getTitle().trim() : "";
      if (!titolo.includes('【GANCIO_INVIATO】')) {
        let numeroSenzaPrefisso = estraiNumeroForte(titolo) || cercaInRubricaGoogle(titolo, "00:00") || cercaNumeroPerPromemoria(titolo);
        
        if (numeroSenzaPrefisso) {
          let numPulito = "39" + numeroSenzaPrefisso.replace(/\D/g, "").replace(/^39/, "");
          
          let msgGancio = `Ciao! ✨ Sono *DarIA*, l'assistente dell'Agenzia Giancani. Antonio mi ha confermato il nostro incontro per dopodomani! 🏡\n\nNell'attesa, vuoi che ti faccia vedere qualche anteprima delle nostre case più belle?\n\n👉 *Rispondi "SÌ" e ti manderò subito i link!* 🚀`;
          
          inviaWhatsAppTesto(numPulito, msgGancio);
          ev.setTitle('【GANCIO_INVIATO】 ' + titolo);
        }
      }
    });
  } catch (e) { console.log("Errore Gancio: " + e.message); }
}

// =========================================================
// STRUMENTO RICERCA NUMERI IN RUBRICA PER CALENDARIO (FILTRO ANTI-SOCIAL)
// =========================================================
function cercaNumeroPerPromemoria(nomeDaCercare) {
  if (!nomeDaCercare) return null;
  
  try {
    let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('SCHEDE_CLIENTI');
    if (!sheet) return null;
    
    let dati = sheet.getDataRange().getValues();
    
    // Scorre la lista dal basso verso l'alto
    for (let i = dati.length - 1; i > 0; i--) {
      let idRaw = String(dati[i][1]); 
      let nomeInRubrica = String(dati[i][2]).toLowerCase();
      
      // Se trova una corrispondenza col nome
      if (nomeInRubrica.includes(nomeDaCercare.toLowerCase())) {
        
        // 🛡️ FILTRO ANTI-SOCIAL: Ignora Messenger, FB, TG, IG
        let idLower = idRaw.toLowerCase();
        if (idLower.includes('messenger') || idLower.includes('fb_') || idLower.includes('tg_') || idLower.includes('ig_')) {
          continue; // Scarta questo e continua a cercare il VERO numero di telefono!
        }
        
        let numeroTrovato = idRaw.replace(/\D/g, ''); 
        
        // Un vero numero cellulare ha tra 9 e 15 cifre massime (standard internazionale)
        if (numeroTrovato.length >= 9 && numeroTrovato.length <= 15) {
          return numeroTrovato; 
        }
      }
    }
  } catch(err) {}
  
  return null; 
}




