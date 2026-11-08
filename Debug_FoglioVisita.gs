// ==========================================



function testIdModelloDoc() {
  try {
    var file = DriveApp.getFileById("1XSdSwfv1JuS56j3_eDg4IIyP14S49GcaQ1yv3pzwMJg");
    Logger.log("✅ Modello trovato: " + file.getName());
  } catch(e) {
    Logger.log("❌ ID MODELLO ERRATO: " + e.toString());
  }
}

function testSheetPrincipale() {
  try {
    var ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
    var sheets = ss.getSheets().map(function(s){ return s.getName(); });
    Logger.log("Fogli disponibili: " + JSON.stringify(sheets));
    
    var regVisita = ss.getSheetByName("REGISTRO_VISITE");
    Logger.log("REGISTRO_VISITE: " + (regVisita ? "✅ TROVATO" : "❌ NON ESISTE"));
    
    var dbImm = ss.getSheetByName("DATABASE_IMMOBILI");
    Logger.log("DATABASE_IMMOBILI: " + (dbImm ? "✅ TROVATO" : "❌ NON ESISTE"));
  } catch(e) {
    Logger.log("❌ Errore apertura sheet: " + e.toString());
  }
}

function testGenerazionePdfCompleta() {
  var datiFirma = {
    agente: "Antonio Giancani",
    luogoFirma: "Favara (AG)",
    dataVisita: "2026-06-28",
    oraInizio: "10:00",
    oraFine: "11:00",
    tipoFirma: "digitale",
    gpsCoordinata: "",
    idBozza: null,
    clienti: [{
      nome: "MARIO ROSSI",
      dataNascita: "01/01/1980",
      luogoNascita: "Favara",
      sesso: "M",
      cf: "RSSMRA80A01A089X",
      residenza: "FAVARA VIA TEST 1",
      telefono: "3201234567",
      otpVerified: true,
      signature: ""
    }],
    immobili: [{
      tipo: "Appartamento",
      citta: "Favara",
      via: "Corso Vittorio Veneto 151",
      prezzo: "85.000",
      incarico: "12"
    }]
  };

  // ── FASE 1: Verifica accesso al Doc modello ──
  Logger.log("=== FASE 1: Doc Modello ===");
  try {
    var fileModello = DriveApp.getFileById("1XSdSwfv1JuS56j3_eDg4IIyP14S49GcaQ1yv3pzwMJg");
    Logger.log("✅ Modello trovato: " + fileModello.getName());
    Logger.log("   MimeType: " + fileModello.getMimeType());
    Logger.log("   Proprietario: " + fileModello.getOwner().getEmail());
  } catch(e) {
    Logger.log("❌ CRASH FASE 1 - Doc non accessibile: " + e.toString());
    return;
  }

  // ── FASE 2: Verifica CONFIG e Sheet ──
  Logger.log("=== FASE 2: CONFIG e Sheet ===");
  try {
    Logger.log("CONFIG.LOG_SHEET_ID: " + CONFIG.LOG_SHEET_ID);
    var ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
    Logger.log("✅ Sheet aperto: " + ss.getName());
    var sheets = ss.getSheets().map(function(s){ return s.getName(); });
    Logger.log("Fogli: " + JSON.stringify(sheets));
    
    var regVisita = ss.getSheetByName("REGISTRO_VISITE");
    Logger.log("REGISTRO_VISITE: " + (regVisita ? "✅ ESISTE" : "❌ NON ESISTE - verrà creato"));
  } catch(e) {
    Logger.log("❌ CRASH FASE 2 - Sheet: " + e.toString());
    return;
  }

  // ── FASE 3: Test copia e compilazione Doc ──
  Logger.log("=== FASE 3: Copia Doc e placeholder ===");
  try {
    var fileCopia = DriveApp.getFileById("1XSdSwfv1JuS56j3_eDg4IIyP14S49GcaQ1yv3pzwMJg").makeCopy("TEST_COPIA_DEBUG_" + new Date().getTime());
    Logger.log("✅ Copia creata: " + fileCopia.getId());

    var docCopia = DocumentApp.openById(fileCopia.getId());
    var body = docCopia.getBody();
    var testoCompleto = body.getText();
    Logger.log("Anteprima testo doc (primi 500 car): " + testoCompleto.substring(0, 500));

    // Verifica placeholder presenti
    var placeholders = [
      "{{AGENTE}}", "{{DATA_OGGI}}", "{{LUOGO_FIRMA}}",
      "{{ORA_INIZIO}}", "{{ORA_FINE}}", "{{OTP_DATA_ORA}}",
      "{{OTP_TELEFONO}}", "{{OTP_RIFERIMENTO}}",
      "{{TABELLA_CLIENTI}}", "{{TABELLA_IMMOBILI}}",
      "{{DOC_CLIENTE_1}}", "{{DOC_CLIENTE_2}}",
      "{{ALLEGATI_DOCUMENTI}}", "{{FIRMA_AGENTE}}"
    ];
    placeholders.forEach(function(p) {
      var trovato = testoCompleto.includes(p);
      Logger.log((trovato ? "✅" : "❌ MANCANTE") + " " + p);
    });

    // Pulizia copia di test
    fileCopia.setTrashed(true);
    Logger.log("✅ Copia test eliminata");
  } catch(e) {
    Logger.log("❌ CRASH FASE 3 - Copia/compilazione Doc: " + e.toString());
    return;
  }

  // ── FASE 4: Test generazione PDF completo ──
  Logger.log("=== FASE 4: Generazione PDF end-to-end ===");
  try {
    var res = salvaFoglioVisitaCompleto(datiFirma);
    Logger.log("RISULTATO FINALE: " + JSON.stringify(res));
    if (res && res.successo) {
      Logger.log("✅ PDF generato con successo!");
      Logger.log("   URL PDF: " + res.urlPdf);
      Logger.log("   File ID: " + res.urlPdfCliente);
    } else {
      Logger.log("❌ Funzione ritornata con errore: " + JSON.stringify(res));
    }
  } catch(e) {
    Logger.log("❌ CRASH FASE 4 - salvaFoglioVisitaCompleto: " + e.toString());
    Logger.log("   Stack: " + e.stack);
  }
}



