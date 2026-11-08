// ==========================================

/**
 * Esegui questa funzione UNA SOLA VOLTA manualmente dall'editor 
 * per attivare l'automazione ad ogni ora.
 */
function creaTriggerOrarioDarIA() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'controllaAppuntamentiOra') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  ScriptApp.newTrigger('controllaAppuntamentiOra')
           .timeBased()
           .everyHours(1)
           .create();
}

/**
 * Controlla l'agenda nell'ora corrente, analizza il cliente e prepara il Foglio Visita
 */
function controllaAppuntamentiOra() {
  try {
    var adesso = new Date();
    // Finestra di tolleranza: controlla eventi da 5 minuti fa a 15 minuti nel futuro
    var inizioFinestra = new Date(adesso.getTime() - 5 * 60 * 1000);
    var fineFinestra = new Date(adesso.getTime() + 15 * 60 * 1000);
    
    var cal = CalendarApp.getDefaultCalendar();
    var eventi = cal.getEvents(inizioFinestra, fineFinestra);
    
    if (eventi.length === 0) return; // Nessun appuntamento adesso
    
    for (var i = 0; i < eventi.length; i++) {
      var titoloEvento = eventi[i].getTitle();
      var nomeCliente = estraiNomePulito(titoloEvento);
      
      if (!nomeCliente) continue;
      
      var datiTrovati = null;
      var tipoSorgente = "";
      
      // FASE 1: Ricerca nel registro storico dell'agenzia
      var resStorico = cercaClienteNelRegistroVisites(nomeCliente);
      if (resStorico && resStorico.successo && resStorico.risultati && resStorico.risultati.length > 0) {
        datiTrovati = resStorico.risultati[0];
        tipoSorgente = "STORICO";
      } else {
        // FASE 2: Ricerca sussidiaria nella Rubrica contatti di Google
        var resRubrica = cercaContattoInRubricaGoogle(nomeCliente);
        if (resRubrica && resRubrica.successo && resRubrica.contatti && resRubrica.contatti.length > 0) {
          datiTrovati = resRubrica.contatti[0];
          tipoSorgente = "RUBRICA";
        }
      }
      
      // FASE 3: Composizione dinamica del messaggio di DarIA
      var testoNotifica = "";
      var pacchettoCliente = { nome: nomeCliente.toUpperCase() };
      
      var oraInizioStr = Utilities.formatDate(adesso, "Europe/Rome", "HH:mm");
      var dataOggiStr = Utilities.formatDate(adesso, "Europe/Rome", "yyyy-MM-dd");
      
      if (tipoSorgente === "STORICO") {
        testoNotifica = "⏰ *DARIA AGENDA: SOPRALLUOGO IN CORSO*\n\nSei in visita con il cliente presente in memoria?\n👤 *" + datiTrovati.nome + "*\n📅 Nato il: " + (datiTrovati.dataNascita || "N/D") + "\n📱 Tel: " + (datiTrovati.telefono || "N/D") + "\n\n_Dati estratti dal registro storico visite._";
        pacchettoCliente = {
          nome: datiTrovati.nome,
          dataNascita: datiTrovati.dataNascita || "",
          luogoNascita: datiTrovati.luogoNascita || "",
          sesso: datiTrovati.sesso || "M",
          cf: datiTrovati.cf || "",
          residenza: datiTrovati.residenza || "",
          telefono: datiTrovati.telefono || "",
          otpVerified: true
        };
      } else if (tipoSorgente === "RUBRICA") {
        testoNotifica = "⏰ *DARIA AGENDA: NUOVO VISITATORE*\n\nSei in visita con il contatto trovato in rubrica?\n👤 *" + datiTrovati.nome + "*\n📱 Tel: " + (datiTrovati.telefono || "N/D") + "\n\n_Richiedi i dati anagrafici mancanti sul posto._";
        pacchettoCliente = {
          nome: datiTrovati.nome,
          telefono: datiTrovati.telefono || ""
        };
      } else {
        testoNotifica = "⏰ *DARIA AGENDA*\n\nHai un appuntamento in questo momento. Confermi che sei in visita con *" + nomeCliente.toUpperCase() + "*?";
      }
      
      // FASE 4: Generazione della Bozza automatica nel Foglio "BOZZE_VISITE"
      var bozzaPrecompilata = {
        agente: "Antonio Giancani",
        luogoFirma: "Favara (AG)",
        dataVisita: dataOggiStr,
        oraInizio: oraInizioStr,
        oraFine: Utilities.formatDate(new Date(adesso.getTime() + 45 * 60 * 1000), "Europe/Rome", "HH:mm"), // Stima +45min
        clienti: [pacchettoCliente],
        immobili: []
      };
      
      var resBozza = salvaBozzaFoglioVisita(bozzaPrecompilata);
      var idBozza = resBozza.successo ? resBozza.idBozza : "";
      
      // Generazione del link di aggancio immediato per la Web App
      var linkIniziaOra = ScriptApp.getService().getUrl() + "?idBozza=" + idBozza;
      
      // FASE 5: Spedizione dei pulsanti interattivi
      spedisciNotificaDarIA(testoNotifica, linkIniziaOra);
    }
  } catch(e) {
    console.log("Errore monitoraggio orario: " + e.toString());
  }
}

// Pulisce i prefissi dai titoli degli eventi del calendario (es: "Visita Mario Rossi" -> "Mario Rossi")
function estraiNomePulito(titolo) {
  if (!titolo) return "";
  var pulito = titolo.replace(/(visita|incontro|appuntamento|sopralluogo|casa|immobile)\s+/gi, "");
  return pulito.trim();
}

/**
 * Distribuisce la notifica su Telegram e WhatsApp (Interactive Button)
 */
function spedisciNotificaDarIA(testo, urlBozza) {
  // Invio prioritario Telegram Boss
  if (typeof inviaTelegramBoss === "function") {
    inviaTelegramBoss(testo + "\n\n⚡ *TOCCA QUI PER APRIRE E COMPILARE:* \n" + urlBozza);
  }
  
  // Invio WhatsApp Interactive CTA (Sfrutta le tue API Meta gia configurate)
  try {
    var urlMeta = 'https://graph.facebook.com/v21.0/' + CONFIG.META_PHONE_ID + '/messages';
    var payloadWa = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: CONFIG.ANTONIO_CHAT_ID,
      type: 'interactive',
      interactive: {
        type: 'cta_url',
        body: { text: testo.replace(/\*/g, "") }, // Rimuove markdown grassetto incompatibile
        action: {
          name: 'cta_url',
          parameters: {
            display_text: '🖋️ Visita Iniziata',
            url: urlBozza
          }
        }
      }
    };
    UrlFetchApp.fetch(urlMeta, {
      method: 'post', contentType: 'application/json',
      headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
      payload: JSON.stringify(payloadWa), muteHttpExceptions: true
    });
  } catch(e) {
    console.log("Errore dispiaccio WhatsApp orario: " + e.toString());
  }
}

