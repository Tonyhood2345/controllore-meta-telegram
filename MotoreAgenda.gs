// ==========================================

/**
 * ATTIVAZIONE TRIGGER AUTOMATICO AD OGNI ORA
 * Esegui questa funzione una volta sola manualmente dall'editor per attivare DarIA.
 */
function attivaScansioneOrariaCalendario() {
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
 * Funzione principale eseguita ogni ora dal trigger di Google
 */
function controllaAppuntamentiOra() {
  try {
    var adesso = new Date();
    // Monitora gli eventi che iniziano nei prossimi 20 minuti o iniziati da 5 minuti
    var inizioFinestra = new Date(adesso.getTime() - 5 * 60 * 1000);
    var fineFinestra = new Date(adesso.getTime() + 20 * 60 * 1000);
    
    // Prende il calendario principale dell'account
    var cal = CalendarApp.getDefaultCalendar();
    var eventi = cal.getEvents(inizioFinestra, fineFinestra);
    
    if (eventi.length === 0) return; // Nessun appuntamento in questa fascia oraria
    
    for (var i = 0; i < eventi.length; i++) {
      var titolo = eventi[i].getTitle();
      // Pulisce il titolo (es: "Visita Mario Rossi" -> "Mario Rossi")
      var nomeDaCercare = titolo.replace(/(visita|incontro|appuntamento|sopralluogo|casa)\s+/gi, "").trim();
      if (!nomeDaCercare) continue;
      
      var clienteScelto = { nome: nomeDaCercare.toUpperCase() };
      var messaggioNotifica = "";
      
      // ── FASE 1: RICERCA NEL REGISTRO STORICO DELLE VISITE VIA COGNOME/NOME ──
      var resStorico = cercaClienteNelRegistroVisites(nomeDaCercare);
      
      if (resStorico && resStorico.successo && resStorico.risultati && resStorico.risultati.length > 0) {
        // Trovato nel registro visite d'agenzia
        var s = resStorico.risultati[0];
        messaggioNotifica = "⏰ *DARIA AGENDA*:\n\nBoss, vedo in calendario un appuntamento. Sei in visita con il cliente storico?\n\n👤 *" + s.nome + "*\n📅 Nato il: " + (s.dataNascita || "N/D") + " a " + (s.luogoNascita || "N/D") + "\n📱 Tel: " + (s.telefono || "N/D") + "\n🪪 CF: " + (s.cf || "N/D");
        
        clienteScelto = {
          nome: s.nome, dataNascita: s.dataNascita || "", luogoNascita: s.luogoNascita || "",
          sesso: s.sesso || "M", cf: s.cf || "", residenza: s.residenza || "", telefono: s.telefono || ""
        };
      } 
      // ── FASE 2: SE NON TROVATO, CERCA NELLA RUBRICA GOOGLE ──
      else {
        var resRubrica = cercaContattoInRubricaGoogle(nomeDaCercare);
        if (resRubrica && resRubrica.successo && resRubrica.contatti && resRubrica.contatti.length > 0) {
          var r = resRubrica.contatti[0];
          messaggioNotifica = "⏰ *DARIA AGENDA*:\n\nSei in visita con il contatto trovato in Rubrica?\n\n👤 *" + r.nome + "*\n📱 Tel: " + (r.telefono || "N/D") + "\n\n_I dati anagrafici mancanti verranno calcolati sul posto._";
          
          clienteScelto = { nome: r.nome, telefono: r.telefono || "", cf: r.cf || "", dataNascita: r.dataNascita || "", luogoNascita: r.luogoNascita || "", residenza: r.residenza || "", sesso: r.sesso || "M" };
        } 
        // ── FASE 3: FALLBACK COMPLETO (NUOVA ANAGRAFICA DA CALENDARIO) ──
        else {
          messaggioNotifica = "⏰ *DARIA AGENDA*:\n\nConfermi che sei in visita con il nuovo cliente *" + nomeDaCercare.toUpperCase() + "*?";
          clienteScelto = { nome: nomeDaCercare.toUpperCase(), telefono: "" };
        }
      }
      
      // Crea la bozza nel foglio BOZZE_VISITE per bloccare i dati e l'ora corrente
      var oraInizio = Utilities.formatDate(adesso, "Europe/Rome", "HH:mm");
      var oraFine = Utilities.formatDate(new Date(adesso.getTime() + 45 * 60 * 1000), "Europe/Rome", "HH:mm");
      
      var bozzaDaria = {
        agente: "Antonio Giancani",
        luogoFirma: "Favara (AG)",
        dataVisita: Utilities.formatDate(adesso, "Europe/Rome", "yyyy-MM-dd"),
        oraInizio: oraInizio,
        oraFine: oraFine,
        clienti: [clienteScelto],
        immobili: []
      };
      
      var resBozza = salvaBozzaFoglioVisita(bozzaDaria);
      var idBozzaGenerata = resBozza.successo ? resBozza.idBozza : "BOZZA_TEMP";
      
      // Spedisce il messaggio interattivo con i bottoni nativi sul tuo WhatsApp Boss
      inviaWhatsAppPulsantiAgenda(CONFIG.ANTONIO_CHAT_ID, messaggioNotifica, idBozzaGenerata);
    }
  } catch(e) {
    console.log("Errore scansione agenda: " + e.toString());
  }
}

/**
 * Spedisce i pulsanti di scelta rapida a due opzioni via WhatsApp Cloud API
 */
function inviaWhatsAppPulsantiAgenda(targetBoss, testo, idBozza) {
  var urlMeta = 'https://graph.facebook.com/v21.0/' + CONFIG.META_PHONE_ID + '/messages';
  var payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: targetBoss,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: testo },
      action: {
        buttons: [
          { type: 'reply', reply: { id: 'agd_si_' + idBozza, title: 'Sì, Inizia Visita 🖋' } },
          { type: 'reply', reply: { id: 'agd_no', title: 'No, Annulla' } }
        ]
      }
    }
  };
  
  UrlFetchApp.fetch(urlMeta, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}


/**
 * Scansiona il foglio BOZZE_VISITE ed elimina i record più vecchi di 2 giorni
 */
function pulisciBozzeVecchieDaria() {
  try {
    var ss = SpreadsheetApp.openById(ID_STORICO_FOGLIO);
    var sheet = ss.getSheetByName("BOZZE_VISITE");
    if (!sheet) return;
    
    var dati = sheet.getDataRange().getValues();
    var oraAttuale = new Date().getTime();
    var dueGiorniInMs = 2 * 24 * 60 * 60 * 1000; // 2 giorni espressi in millisecondi
    
    // Si scorre la tabella al contrario (dall'ultima riga alla prima) 
    // per eliminare le righe senza sballare gli indici di posizione
    for (var i = dati.length - 1; i >= 1; i--) {
      var dataBozzaRaw = dati[i][1]; // Colonna B: DATA_ORA
      if (!dataBozzaRaw) continue;
      
      var timestampBozza = new Date(dataBozzaRaw).getTime();
      
      // Se il tempo trascorso è maggiore di 2 giorni, elimina la riga
      if (oraAttuale - timestampBozza > dueGiorniInMs) {
        sheet.deleteRow(i + 1);
        console.log("⚠ DarIA ha rimosso una bozza obsoleta alla riga: " + (i + 1));
      }
    }
  } catch(e) {
    console.log("Errore durante la pulizia automatica delle bozze: " + e.toString());
  }
}

