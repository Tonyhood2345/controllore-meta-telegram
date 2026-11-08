// ==========================================

// ============================================================
// FUNZIONI INCARICHI DI VENDITA — Immobiliare Giancani
// Versione: 4.1 | Autore: DarIA — Antonio Giancani
// ============================================================
//
// INDICE SEZIONI:
//  1.  Costanti e Configurazione
//  2.  Creazione Fogli (Storico, Report, Bozze)
//  3.  Calcolo Provvigione Automatica
//  4.  Salvataggio Dati + Generazione PDF Personali
//  5.  Generazione Documento Personale (1 PDF per venditore)
//  6.  Generazione Documento AML Riservato (uso interno)
//  7.  Compilazione Placeholder Comuni
//  8.  Tabelle Venditori e Catasto
//  9.  Firma Agente, Allegati, QR Code
// 10.  Compilazione Privacy/AML per Singolo Venditore
// 11.  Firma Remota — Genera Link + Finalizza 4 Firme
// 12.  OTP e OCR Carta Identità
// 13.  Pagina Firma Remota — Serve HTML FirmaIncarico
// 14.  Link Fac-Simile e Token Documento
// 15.  Sistema Bozze Incarichi
// 16.  Helper Privati (format, Drive, Sheet, WhatsApp)
// ============================================================


// ════════════════════════════════════════════════════════════
// 1. COSTANTI E CONFIGURAZIONE
// ════════════════════════════════════════════════════════════

// ID del documento Privacy + AML (Doc2), separato dall'Incarico
var ID_MODELLO_PRIVACY_AML = "1L2yMtTTjEH8h3tF5A5RdKT8xiDJY3HGFTfRZVzN6910";

// Durata di validità del link documento per il cliente (≈11 mesi in ms)
var DURATA_LINK_DOCUMENTO_MS = 11 * 30 * 24 * 60 * 60 * 1000;


// ════════════════════════════════════════════════════════════
// 2. CREAZIONE / RESET FOGLI SHEET
// ════════════════════════════════════════════════════════════

/** Crea o resetta il foglio STORICO_INCARICHI */
function creaFoglioStoricoIncarichi() {
  var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var vecchio = ss.getSheetByName("STORICO_INCARICHI");
  if (vecchio) ss.deleteSheet(vecchio);
  var sheet = ss.insertSheet("STORICO_INCARICHI");
  var intestazioni = [
    "DATA_INCARICO","AGENTE","LUOGO_FIRMA",
    "VENDITORE_1_NOME","VENDITORE_1_CF","VENDITORE_1_TEL","VENDITORE_1_QUOTA",
    "VENDITORE_2_NOME","VENDITORE_2_CF","VENDITORE_2_TEL","VENDITORE_2_QUOTA",
    "VENDITORE_3_NOME","VENDITORE_3_CF","VENDITORE_3_TEL","VENDITORE_3_QUOTA",
    "VENDITORE_4_NOME","VENDITORE_4_CF","VENDITORE_4_TEL","VENDITORE_4_QUOTA",
    "VENDITORE_5_NOME","VENDITORE_5_CF","VENDITORE_5_TEL","VENDITORE_5_QUOTA",
    "VENDITORE_6_NOME","VENDITORE_6_CF","VENDITORE_6_TEL","VENDITORE_6_QUOTA",
    "VENDITORE_7_NOME","VENDITORE_7_CF","VENDITORE_7_TEL","VENDITORE_7_QUOTA",
    "VENDITORE_8_NOME","VENDITORE_8_CF","VENDITORE_8_TEL","VENDITORE_8_QUOTA",
    "CATASTO_TIPO",
    "CATASTO_FOGLIO_1","CATASTO_PARTICELLA_1","CATASTO_SUB_1","CATASTO_PREZZO_1",
    "CATASTO_FOGLIO_2","CATASTO_PARTICELLA_2","CATASTO_SUB_2","CATASTO_PREZZO_2",
    "CATASTO_FOGLIO_3","CATASTO_PARTICELLA_3","CATASTO_SUB_3","CATASTO_PREZZO_3",
    "PREZZO_VENDITA_TOTALE","PREZZO_MINIMO","PROVVIGIONE_PCT","PROVVIGIONE_EURO","PROVVIGIONE_TIPO",
    "DURATA_INCARICO_MESI","DATA_SCADENZA","TIPO_INCARICO","NOTE_LIBERE",
    "TIPO_IMMOBILE","AFFITTATO","URBANISTICA_CATASTALE","CONDIZIONI_CONDOMINIALI",
    "CLASSE_ENERGETICA_APE","DATA_ROGITO_PREVISTA","MUTUO_RESIDUO",
    "AML_PROFILO","AML_NATURA","AML_AREA_GEO","AML_COMPORTAMENTO",
    "AML_ORIGINE_FONDI","AML_FREQUENZA","AML_CONGRUITA","AML_MOTIVAZIONE",
    "TIPO_FIRMA","LOG_OTP",
    "URL_PDF_V1","URL_PDF_V2","URL_PDF_V3","URL_PDF_V4","URL_PDF_V5","URL_PDF_V6","URL_PDF_V7","URL_PDF_V8",
    "STATO"
  ];
  sheet.appendRow(intestazioni);
  var header = sheet.getRange(1,1,1,intestazioni.length);
  header.setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc").setFontSize(9);
  sheet.autoResizeColumns(1,intestazioni.length);
  sheet.setFrozenRows(1);
  Logger.log("✅ STORICO_INCARICHI inizializzato con supporto a 8 proprietari.");
}

/** Crea o resetta il foglio REPORT_VENDITORI */
function creaFoglioReportVenditori() {
  var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var vecchio = ss.getSheetByName("REPORT_VENDITORI");
  if (vecchio) ss.deleteSheet(vecchio);
  var sheet = ss.insertSheet("REPORT_VENDITORI");
  var intestazioni = [
    "DATA","AGENTE","VENDITORE_PRINCIPALE","TELEFONO","INDIRIZZO_IMMOBILE",
    "TIPO_IMMOBILE","PREZZO_RICHIESTO","PREZZO_MINIMO","PROVVIGIONE_%","PROVVIGIONE_€",
    "TIPO_INCARICO","SCADENZA","DATA_ROGITO_PREVISTA","AML_PROFILO","STATO","URL_PDF","NOTE"
  ];
  sheet.appendRow(intestazioni);
  var header = sheet.getRange(1,1,1,intestazioni.length);
  header.setFontWeight("bold").setBackground("#5c061a").setFontColor("#f8fafc").setFontSize(9);
  sheet.autoResizeColumns(1,intestazioni.length);
  sheet.setFrozenRows(1);
  Logger.log("✅ REPORT_VENDITORI inizializzato.");
}

/** Crea o resetta il foglio BOZZE_INCARICHI */
function creaFoglioBozzeIncarichi() {
  var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var vecchio = ss.getSheetByName("BOZZE_INCARICHI");
  if (vecchio) ss.deleteSheet(vecchio);
  var sheet = ss.insertSheet("BOZZE_INCARICHI");
  var intestazioni = ["ID_BOZZA", "DATA_ORA", "AGENTE", "VENDITORI", "INDIRIZZO", "STATO", "JSON_DATI"];
  sheet.appendRow(intestazioni);
  var header = sheet.getRange(1,1,1,intestazioni.length);
  header.setFontWeight("bold").setBackground("#4338ca").setFontColor("#f8fafc").setFontSize(9);
  sheet.autoResizeColumns(1, intestazioni.length);
  sheet.setFrozenRows(1);
  Logger.log("✅ BOZZE_INCARICHI inizializzato.");
}


// ════════════════════════════════════════════════════════════
// 3. CALCOLO PROVVIGIONE AUTOMATICA
//    ≤ 65.000€ → 2.000€ fisso + IVA
//    > 65.000€ → 3% + IVA
// ════════════════════════════════════════════════════════════

function calcolaProvvigioneAutomatica(prezzoVendita) {
  var IVA = 0.22;
  if (prezzoVendita > 0 && prezzoVendita <= 65000) {
    var imponibile = 2000;
    return {
      tipo: "FISSO",
      imponibile: imponibile,
      iva: Math.round(imponibile * IVA * 100) / 100,
      totale: Math.round(imponibile * (1 + IVA) * 100) / 100,
      pctEquivalente: Math.round((imponibile / prezzoVendita * 100) * 100) / 100
    };
  } else {
    var imponibile2 = Math.round(prezzoVendita * 0.03 * 100) / 100;
    return {
      tipo: "PERCENTUALE",
      imponibile: imponibile2,
      iva: Math.round(imponibile2 * IVA * 100) / 100,
      totale: Math.round(imponibile2 * (1 + IVA) * 100) / 100,
      pctEquivalente: 3
    };
  }
}

/** Endpoint per calcolo live nel form lato client */
function calcolaProvvigioneLive(prezzoVenditaStr) {
  try {
    var prezzo = parseFloat(String(prezzoVenditaStr||"0").replace(/\./g,'').replace(',','.')) || 0;
    return { successo:true, calcolo: calcolaProvvigioneAutomatica(prezzo) };
  } catch(e) { return { successo:false, messaggio:e.toString() }; }
}


// ════════════════════════════════════════════════════════════
// 4. SALVATAGGIO DATI INCARICO + GENERAZIONE PDF PERSONALI
//    (1 PDF per ciascun venditore: Incarico + sua Privacy/AML)
// ════════════════════════════════════════════════════════════

function salvaDatiIncarico(dati) {
  console.log("INCARICO RICEVUTO: " + JSON.stringify(dati));
  try {
    var venditori = dati.venditori || [];
    if (!venditori.length) throw new Error("Nessun venditore presente nei dati.");

    var dataContratto = dati.dataIncarico
      ? dati.dataIncarico.split('-').reverse().join('/')
      : Utilities.formatDate(new Date(),"Europe/Rome","dd/MM/yyyy");
    var dataOraOtp = Utilities.formatDate(new Date(),"Europe/Rome","dd/MM/yyyy HH:mm:ss");
    var tokenRif   = Utilities.getUuid().substring(0,8).toUpperCase();

    var dataScadenza = new Date();
    if (dati.dataIncarico) dataScadenza = new Date(dati.dataIncarico);
    // Imposta di default a 24 mesi (2 anni) avanti
    dataScadenza.setMonth(dataScadenza.getMonth() + parseInt(dati.durataMesi || 24));
    var scadenzaStr = Utilities.formatDate(dataScadenza,"Europe/Rome","dd/MM/yyyy");

    var prezzoVendita = parseFloat(String(dati.prezzoVendita||"0").replace(/\./g,'').replace(',','.')) || 0;
    var prezzoMinimo  = parseFloat(String(dati.prezzoMinimo ||"0").replace(/\./g,'').replace(',','.')) || 0;
    var calcProvv     = calcolaProvvigioneAutomatica(prezzoVendita);
    var provvPct      = calcProvv.pctEquivalente;
    var provvEuro     = calcProvv.imponibile;

    var urlPdfPerVenditore = [];

    // ── Genera un PDF personale per OGNI venditore ───────────
    for (var vi = 0; vi < venditori.length; vi++) {
      var venditoreCorrente = venditori[vi];
      var nomeFile = "Incarico_" + venditoreCorrente.nome.replace(/\s+/g,"_").toUpperCase() + "_" + new Date().getTime() + "_" + vi;

      var risultato = _generaDocumentoPersonale(dati, venditori, vi, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo, nomeFile);
      urlPdfPerVenditore.push(risultato.urlPdf);

      try { _archiviaPdfIncarico(risultato.fileIdPdf, venditoreCorrente.nome.replace(/\s+/g,"_").toUpperCase(), dati.dataIncarico, venditoreCorrente.cf); } catch(e) {}
    }

    // ── LOG SU FOGLI SHEET ──
    try { _salvaStoricoIncarichi(dati, dataContratto, urlPdfPerVenditore, scadenzaStr, provvPct, provvEuro, calcProvv.tipo); } catch(e) { console.log("Errore storico: "+e); }
    try { _salvaReportVenditori(dati, dataContratto, urlPdfPerVenditore[0], scadenzaStr, provvPct, provvEuro); } catch(e) { console.log("Errore report: "+e); }

    // ── INVIO LINK PERSONALI AI VENDITORI ─────────────────────
    try { _inviaLinkVenditoriPersonali(venditori, urlPdfPerVenditore); } catch(e) {}

    // ── Hook → popola INCARICHI_IMMOBILI automaticamente ──
    try {
      if (typeof coAggiungiImmobileDopoIncarico === "function") {
        coAggiungiImmobileDopoIncarico(dati, urlPdfPerVenditore[0]);
      }
    } catch(eHook) {
      Logger.log('Hook INCARICHI_IMMOBILI: ' + eHook.message);
    }

    return { successo:true, urlPdf: urlPdfPerVenditore[0], urlPdfTutti: urlPdfPerVenditore };

  } catch(errore) {
    console.log("CRASH salvaDatiIncarico: "+errore.toString()+"\n"+errore.stack);
    return { successo:false, messaggio:errore.toString() };
  }
}


// ════════════════════════════════════════════════════════════
// 5. GENERAZIONE DOCUMENTO PERSONALE
//    Copia Doc1 (Incarico, tutti venditori) + sezione Privacy
//    dal Doc2 (solo fino al marcatore ---PAGE BREAK---).
//    L'AML non viene inclusa nel PDF del cliente.
//    Esporta come un unico PDF nativo.
// ════════════════════════════════════════════════════════════

function _generaDocumentoPersonale(dati, venditori, indiceVenditore, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo, nomeFile) {
  var venditoreCorrente = venditori[indiceVenditore];

  var idModelloInc = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC)
    ? CONFIG.ID_MODELLO_INC
    : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : null);
  if (!idModelloInc) throw new Error("ID_MODELLO_INC non configurato!");

  var idModelloPrivacyAml = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_PRIVACY_AML)
    ? CONFIG.ID_MODELLO_PRIVACY_AML
    : ID_MODELLO_PRIVACY_AML;

  // ── 1) Copia Doc1 (Incarico) come base ──
  var fileCopia = DriveApp.getFileById(idModelloInc).makeCopy(nomeFile);
  var docCopia  = DocumentApp.openById(fileCopia.getId());
  var body      = docCopia.getBody();

  _compilaPlaceholderComuni(body, dati, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo);
  _inserisciTabellaVenditoriCompleta(body, venditori, dataOraOtp, tokenRif, dati.tipoFirma);
  _inserisciTabellaCatasto(body, dati);
  _inserisciFirmaAgente(body, dati);
  _inserisciAllegatiDocumenti(body, dati);
  _inserisciQrCode(body, docCopia);

  // Iniezione inline delle firme dell'Incarico ed Economica per ciascun venditore
  // Ciascun PDF conterrà SOLO la firma del venditore destinatario (indiceVenditore)
  for (var i = 0; i < 8; i++) {
    var segnapostoIncLong  = "{{FIRMA_INCARICO_" + (i + 1) + "}}";
    var segnapostoIncShort = "{{FIRMA_INC_" + (i + 1) + "}}";
    var segnapostoEcoLong  = "{{FIRMA_ECONOMICA_" + (i + 1) + "}}";
    var segnapostoEcoShort = "{{FIRMA_ECO_" + (i + 1) + "}}";

    if (i === indiceVenditore && venditori[i]) {
      var v = venditori[i];
      var logOtp = "\n" + dataOraOtp + "\n+" + (v.telefono || "") + "\nIC-" + tokenRif + "_" + (i + 1);
      
      _iniettaFirmaInline(body, segnapostoIncLong,  v.firmaIncarico || v.firma || v.firmaRemota || "", logOtp);
      _iniettaFirmaInline(body, segnapostoIncShort, v.firmaIncarico || v.firma || v.firmaRemota || "", logOtp);
      _iniettaFirmaInline(body, segnapostoEcoLong,  v.firmaEconomica || "", logOtp);
      _iniettaFirmaInline(body, segnapostoEcoShort, v.firmaEconomica || "", logOtp);
    } else {
      // Pulisce i segnaposto per gli altri proprietari in questo PDF personale
      body.replaceText(segnapostoIncLong, "");
      body.replaceText(segnapostoIncShort, "");
      body.replaceText(segnapostoEcoLong, "");
      body.replaceText(segnapostoEcoShort, "");
    }
  }

  // ── 2) Appende in coda SOLO la sezione Privacy dal Doc2 ──
  body.appendPageBreak();
  var docPrivacyAml = DocumentApp.openById(idModelloPrivacyAml);
  var bodyOrigine   = docPrivacyAml.getBody();
  var numElementi   = bodyOrigine.getNumChildren();
  var indiceTaglio  = numElementi;

  for (var iTaglio = 0; iTaglio < numElementi; iTaglio++) {
    var elTaglio = bodyOrigine.getChild(iTaglio);
    if (elTaglio.getType() === DocumentApp.ElementType.PARAGRAPH &&
        elTaglio.asParagraph().getText().indexOf("---PAGE BREAK---") !== -1) {
      indiceTaglio = iTaglio;
      break;
    }
  }

  for (var i = 0; i < indiceTaglio; i++) {
    var elemento = bodyOrigine.getChild(i).copy();
    var tipo = elemento.getType();
    if (tipo === DocumentApp.ElementType.PARAGRAPH) {
      var testoElemento = elemento.asParagraph().getText();
      if (testoElemento.indexOf("---PAGE BREAK---") !== -1) continue;
      body.appendParagraph(elemento);
    } else if (tipo === DocumentApp.ElementType.TABLE) {
      body.appendTable(elemento);
    } else if (tipo === DocumentApp.ElementType.LIST_ITEM) {
      body.appendListItem(elemento);
    }
  }

  // ── 3) Compila placeholder Privacy SOLO per questo venditore ──
  _compilaPlaceholderPrivacyAmlSingolo(body, dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif);

  docCopia.saveAndClose();

  // ── 3-bis) Genera SEPARATAMENTE documento AML riservato (mai al cliente) ──
  try {
    _generaDocumentoAmlRiservato(dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif, idModelloPrivacyAml, indiceTaglio, numElementi, nomeFile);
  } catch(eAml) {
    console.log("Errore generazione AML riservato: " + eAml);
  }

  // ── 4) Esporta come UN PDF nativo ──
  var pdfBlob = fileCopia.getAs(MimeType.PDF);
  var filePdf = DriveApp.createFile(pdfBlob);
  filePdf.setName(nomeFile + ".pdf");
  filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var urlPdf = "https://drive.google.com/uc?export=download&id=" + filePdf.getId();
  fileCopia.setTrashed(true);

  // ── 5) Token documento protetto — scadenza 11 MESI ──
  var tokenLink = Utilities.getUuid().substring(0,12).toUpperCase();
  PropertiesService.getScriptProperties().setProperty(
    "DOC_" + tokenLink,
    JSON.stringify({ url: urlPdf, scadenza: new Date().getTime() + DURATA_LINK_DOCUMENTO_MS, usato: 0 })
  );

  return { urlPdf: urlPdf, fileIdPdf: filePdf.getId(), tokenLink: tokenLink };
}


// ════════════════════════════════════════════════════════════
// 6. GENERAZIONE DOCUMENTO AML RISERVATO (uso interno agenzia)
//    NON viene mai inviato al cliente. Archiviato in
//    🔒 ARCHIVIO_AML_RISERVATO / Anno / Mese
// ════════════════════════════════════════════════════════════

function _generaDocumentoAmlRiservato(dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif, idModelloPrivacyAml, indiceTaglio, numElementiTotali, nomeFileBase) {
  var nomeFileAml = "AML_RISERVATO_" + nomeFileBase;

  var fileCopiaAml = DriveApp.getFileById(idModelloPrivacyAml).makeCopy(nomeFileAml);
  var docAml       = DocumentApp.openById(fileCopiaAml.getId());
  var bodyAml      = docAml.getBody();

  var bodyOrigine = DocumentApp.openById(idModelloPrivacyAml).getBody();

  // Pulisce il body e ricostruisce solo dalla sezione AML in avanti
  while (bodyAml.getNumChildren() > 1) {
    bodyAml.removeChild(bodyAml.getChild(1));
  }
  bodyAml.getChild(0).asParagraph().setText("");

  var primoElementoScritto = false;
  for (var i = indiceTaglio; i < numElementiTotali; i++) {
    var elemento = bodyOrigine.getChild(i).copy();
    var tipo = elemento.getType();

    if (tipo === DocumentApp.ElementType.PARAGRAPH) {
      var testoEl = elemento.asParagraph().getText();
      if (testoEl.indexOf("---PAGE BREAK---") !== -1) continue;
      if (!primoElementoScritto) {
        bodyAml.getChild(0).asParagraph().setText(testoEl);
        primoElementoScritto = true;
      } else {
        bodyAml.appendParagraph(elemento);
      }
    } else if (tipo === DocumentApp.ElementType.TABLE) {
      bodyAml.appendTable(elemento);
      primoElementoScritto = true;
    } else if (tipo === DocumentApp.ElementType.LIST_ITEM) {
      bodyAml.appendListItem(elemento);
      primoElementoScritto = true;
    }
  }

  // Compila placeholder AML/Scheda Rischio
  _compilaPlaceholderPrivacyAmlSingolo(bodyAml, dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif);

  docAml.saveAndClose();

  // Esporta come PDF e archivia nella cartella RISERVATA
  var pdfBlobAml = fileCopiaAml.getAs(MimeType.PDF);
  var filePdfAml = DriveApp.createFile(pdfBlobAml);
  filePdfAml.setName(nomeFileAml + ".pdf");
  fileCopiaAml.setTrashed(true);

  try {
    var anno = dati.dataIncarico ? dati.dataIncarico.substring(0,4) : new Date().getFullYear().toString();
    var mese = dati.dataIncarico ? dati.dataIncarico.substring(5,7) : String(new Date().getMonth()+1).padStart(2,'0');
    var nomiMesi = {
      "01":"01-Gennaio","02":"02-Febbraio","03":"03-Marzo","04":"04-Aprile",
      "05":"05-Maggio","06":"06-Giugno","07":"07-Luglio","08":"08-Agosto",
      "09":"09-Settembre","10":"10-Ottobre","11":"11-Novembre","12":"12-Dicembre"
    };
    var rootAml = _ottieniOCreaCrt(null, "🔒 ARCHIVIO_AML_RISERVATO");
    var annoDirAml = _ottieniOCreaCrt(rootAml, "Anno " + anno);
    var meseDirAml = _ottieniOCreaCrt(annoDirAml, nomiMesi[mese] || mese);

    var cfPulitoAml = venditoreCorrente.cf ? "_" + venditoreCorrente.cf.toUpperCase().trim() : "";
    var nomePdfArchivio = "AML_" + venditoreCorrente.nome.replace(/\s+/g,"_").toUpperCase() + cfPulitoAml + ".pdf";

    var fileFinaleAml = filePdfAml.makeCopy(nomePdfArchivio, meseDirAml);
    filePdfAml.setTrashed(true);
    return fileFinaleAml.getId();
  } catch(eArchivio) {
    console.log("Errore archiviazione AML riservato: " + eArchivio);
    return filePdfAml.getId();
  }
}


// ════════════════════════════════════════════════════════════
// 7. COMPILAZIONE PLACEHOLDER COMUNI
//    (dati incarico, prezzo, immobile — uguali per tutti)
// ════════════════════════════════════════════════════════════

function _compilaPlaceholderComuni(body, dati, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo) {
  body.replaceText("{{AGENTE}}",        dati.agente       || "Antonio Giancani");
  body.replaceText("{{DATA_OGGI}}",     dataContratto);
  body.replaceText("{{LUOGO_FIRMA}}",   dati.luogoFirma   || "Favara (AG)");
  body.replaceText("{{TIPO_INCARICO}}",dati.tipoIncarico  || "ESCLUSIVA");
  body.replaceText("{{DURATA_MESI}}",   String(dati.durataMesi || "12"));
  body.replaceText("{{DATA_SCADENZA}}", scadenzaStr);

  body.replaceText("{{PREZZO_VENDITA}}",   _formatEuro(prezzoVendita));
  body.replaceText("{{PREZZO_MINIMO}}",    _formatEuro(prezzoMinimo));
  body.replaceText("{{PROVVIGIONE_TIPO}}", calcProvv.tipo === "FISSO" ? "Compenso Fisso" : "Percentuale 3%");
  body.replaceText("{{PROVVIGIONE_PCT}}",  calcProvv.pctEquivalente.toFixed(2)+"%");
  body.replaceText("{{PROVVIGIONE_EURO}}", _formatEuro(calcProvv.imponibile));
  body.replaceText("{{PROVVIGIONE_IVA}}",  _formatEuro(calcProvv.iva));
  body.replaceText("{{PROVVIGIONE_TOTALE}}",_formatEuro(calcProvv.totale));
  body.replaceText("{{OTP_DATA_ORA}}",     dataOraOtp);
  body.replaceText("{{OTP_RIFERIMENTO}}",  tokenRif);
  body.replaceText("{{NOTE_LIBERE}}",      dati.noteLibere || "");

  body.replaceText("{{TIPO_IMMOBILE}}",          dati.tipoImmobile || "Appartamento");
  body.replaceText("{{AFFITTATO}}",              dati.affittato === "si" ? "SÌ" : "NO");
  body.replaceText("{{URBANISTICA_CATASTALE}}",  dati.urbanisticaCatastale || "Conforme a quanto dichiarato dal proprietario");
  body.replaceText("{{CONDIZIONI_CONDOMINIALI}}",dati.condizioniCondominiali || "Nulla da segnalare");
  body.replaceText("{{CLASSE_ENERGETICA_APE}}",  dati.classeEnergeticaApe || "N/D");
  body.replaceText("{{DATA_ROGITO_PREVISTA}}",   dati.dataRogitoPrevista
    ? dati.dataRogitoPrevista.split('-').reverse().join('/') : "Da concordare");
  body.replaceText("{{MUTUO_RESIDUO}}",          dati.mutuoResiduo ? _formatEuro(parseFloat(String(dati.mutuoResiduo).replace(/\./g,'').replace(',','.'))) : "Nessuno");
}


// ════════════════════════════════════════════════════════════
// 8. TABELLE VENDITORI E CATASTO
// ════════════════════════════════════════════════════════════

/** Inserisce la tabella COMPLETA di tutti i venditori (Doc1 - Incarico) */
function _inserisciTabellaVenditoriCompleta(body, venditori, dataOraOtp, tokenRif, tipoFirma) {
  var quotaAuto   = venditori.length > 0 ? (100/venditori.length).toFixed(2)+"%" : "100%";
  var tabellaVend = _pulisciEInserisciTabella(body,"{{TABELLA_VENDITORI}}");
  if (!tabellaVend || !venditori.length) return;

  var hdr = tabellaVend.appendTableRow();
  ["VENDITORE","DATI ANAGRAFICI","COD. FISCALE","QUOTA"].forEach(function(t) {
    var c = hdr.appendTableCell(t);
    c.setBackgroundColor("#5c061a");
    var p = c.getChild(0).asParagraph();
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p.editAsText().setBold(true).setFontSize(6).setForegroundColor("#ffffff");
  });

  venditori.forEach(function(v,i) {
    var quotaDisplay = v.quota || quotaAuto;
    var riga = tabellaVend.appendTableRow();

    var c1 = riga.appendTableCell((v.nome||"").toUpperCase()+"\nTel: +"+(v.telefono||""));
    c1.getChild(0).asParagraph().editAsText().setFontSize(7).setForegroundColor("#000000");

    var c2 = riga.appendTableCell(
      "Nato: "+(v.dataNascita||"")+" a "+(v.luogoNascita||"").toUpperCase()+
      "\nResid.: "+(v.residenza||"").toUpperCase()
    );
    c2.getChild(0).asParagraph().editAsText().setFontSize(7).setForegroundColor("#000000");

    var c3 = riga.appendTableCell(v.cf ? v.cf.toUpperCase() : "");
    var p3 = c3.getChild(0).asParagraph();
    p3.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p3.editAsText().setFontSize(7).setForegroundColor("#000000");

    var c4 = riga.appendTableCell(quotaDisplay);
    var p4 = c4.getChild(0).asParagraph();
    p4.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p4.editAsText().setBold(true).setFontSize(8).setForegroundColor("#5c061a");
  });
}

/** Inserisce tabella dati catastali */
function _inserisciTabellaCatasto(body, dati) {
  var catasto    = dati.catasto || [];
  var tabellaCAT = _pulisciEInserisciTabella(body,"{{TABELLA_CATASTO}}");
  body.replaceText("{{CATASTO_TIPO}}",(dati.catasto_tipo||"FABBRICATI").toUpperCase());
  if (!tabellaCAT || !catasto.length) return;

  var hdrC = tabellaCAT.appendTableRow();
  ["FOGLIO","PARTICELLA","SUB.","CATEGORIA","CONSISTENZA","DESCRIZIONE / INDIRIZZO","PREZZO PARZIALE"].forEach(function(t) {
    var c = hdrC.appendTableCell(t);
    c.setBackgroundColor("#1e293b");
    var p = c.getChild(0).asParagraph();
    p.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    p.editAsText().setBold(true).setFontSize(8).setForegroundColor("#f8fafc");
  });
  catasto.forEach(function(riga) {
    var r = tabellaCAT.appendTableRow();
    var vals = [
      riga.foglio||"", riga.particella||"", riga.sub||"",
      riga.categoria||"", riga.consistenza||"", riga.descrizione||"",
      riga.prezzo ? _formatEuro(parseFloat(String(riga.prezzo).replace(/\./g,'').replace(',','.'))) : ""
    ];
    vals.forEach(function(v) {
      var c = r.appendTableCell(String(v));
      var p = c.getChild(0).asParagraph();
      p.setSpacingBefore(0).setSpacingAfter(0);
      p.editAsText().setFontSize(8).setForegroundColor("#000000");
    });
  });
}


// ════════════════════════════════════════════════════════════
// 9. FIRMA AGENTE, ALLEGATI, QR CODE
// ════════════════════════════════════════════════════════════

function _inserisciFirmaAgente(body, dati) {
  var nomeAgente   = dati.agente || "Antonio Giancani";
  var idFirmaAgent = (typeof CONFIG !== 'undefined' && CONFIG.FIRME_AGENTI)
    ? CONFIG.FIRME_AGENTI[nomeAgente] : null;
  if (idFirmaAgent) {
    try {
      var blobFirma = DriveApp.getFileById(idFirmaAgent).getBlob();
      var paragrafi = body.getParagraphs();
      for (var i=0; i<paragrafi.length; i++) {
        if (paragrafi[i].getText().includes("{{FIRMA_AGENTE}}")) {
          paragrafi[i].replaceText("{{FIRMA_AGENTE}}"," ");
          var img = paragrafi[i].appendInlineImage(blobFirma);
          img.setWidth(125); img.setHeight(35);
          break;
        }
      }
    } catch(e) { body.replaceText("{{FIRMA_AGENTE}}",""); }
  } else {
    body.replaceText("{{FIRMA_AGENTE}}","");
  }
}

function _inserisciAllegatiDocumenti(body, dati) {
  var elementoDoc = body.findText("{{ALLEGATI_DOCUMENTI}}");
  if (!elementoDoc) return;
  var paragAncora = elementoDoc.getElement().getParent().asParagraph();
  var idxDoc      = body.getChildIndex(paragAncora);
  if (dati.documenti && dati.documenti.length > 0) {
    dati.documenti.forEach(function(docId,dIdx) {
      if (!docId) return;
      try {
        var blob = DriveApp.getFileById(docId).getBlob();
        var p    = body.insertParagraph(idxDoc+1+dIdx,"Doc. Venditore "+(dIdx+1)+":\n");
        p.setFontSize(9).setBold(true).setForegroundColor("#000000");
        var img = p.appendInlineImage(blob);
        img.setWidth(240); img.setHeight(150);
      } catch(e) { console.log("Errore allegato: "+e); }
    });
  }
  body.replaceText("{{ALLEGATI_DOCUMENTI}}","");
}

function _inserisciQrCode(body, docCopia) {
  var urlWebApp    = ScriptApp.getService().getUrl();
  var urlQr        = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data="+encodeURIComponent(urlWebApp);
  try {
    var qrBlob = UrlFetchApp.fetch(urlQr).getBlob();
    var pagrQr = body.getParagraphs();
    for (var i=0; i<pagrQr.length; i++) {
      if (pagrQr[i].getText().includes("{{QR_DOCUMENTO}}")) {
        pagrQr[i].replaceText("{{QR_DOCUMENTO}}"," ");
        var img = pagrQr[i].appendInlineImage(qrBlob);
        img.setWidth(90); img.setHeight(90);
        break;
      }
    }
  } catch(eQr) { body.replaceText("{{QR_DOCUMENTO}}",""); }
}


// ════════════════════════════════════════════════════════════
// 10. COMPILAZIONE PRIVACY/AML PER SINGOLO VENDITORE
// ════════════════════════════════════════════════════════════

function _compilaPlaceholderPrivacyAmlSingolo(body, dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif) {
  body.replaceText("{{AGENTE}}",      dati.agente     || "Antonio Giancani");
  body.replaceText("{{DATA_OGGI}}",   dataContratto);
  body.replaceText("{{LUOGO_FIRMA}}", dati.luogoFirma || "Favara (AG)");
  body.replaceText("{{NOTE_LIBERE}}", dati.noteLibere || "");

  body.replaceText("{{TIPO_IMMOBILE}}",        dati.tipoImmobile || "Appartamento");
  body.replaceText("{{AFFITTATO}}",            dati.affittato === "si" ? "SÌ" : "NO");
  body.replaceText("{{DATA_ROGITO_PREVISTA}}", dati.dataRogitoPrevista
    ? dati.dataRogitoPrevista.split('-').reverse().join('/') : "Da concordare");
  body.replaceText("{{MUTUO_RESIDUO}}",        dati.mutuoResiduo ? _formatEuro(parseFloat(String(dati.mutuoResiduo).replace(/\./g,'').replace(',','.'))) : "Nessuno");

  // Dati anagrafici SOLO del venditore corrente
  var datiAnagrafici =
    (venditoreCorrente.nome||"").toUpperCase() +
    ", nato/a il " + (venditoreCorrente.dataNascita||"") + " a " + (venditoreCorrente.luogoNascita||"").toUpperCase() +
    ", C.F. " + (venditoreCorrente.cf||"").toUpperCase() +
    ", residente in " + (venditoreCorrente.residenza||"").toUpperCase() +
    ", tel. +" + (venditoreCorrente.telefono||"");

  body.replaceText("{{TABELLA_VENDITORI}}", datiAnagrafici);
  body.replaceText("{{TABELLA_CATASTO}}", (dati.catasto && dati.catasto[0]) ? (dati.catasto[0].descrizione||"") : "");

  // AML
  body.replaceText("{{AML_NATURA_GIURIDICA}}", dati.aml_natura_giuridica || "Persona fisica (Basso)");
  body.replaceText("{{AML_AREA_GEO}}",         dati.aml_area_geo         || "Italia (Basso)");
  body.replaceText("{{AML_COMPORTAMENTO}}",    dati.aml_comportamento    || "Nella norma (Basso)");
  body.replaceText("{{AML_ORIGINE_FONDI}}",    dati.aml_origine_fondi    || "Patrimonio personale (Basso)");
  body.replaceText("{{AML_FREQUENZA}}",        dati.aml_frequenza        || "Occasionale (Basso)");
  body.replaceText("{{AML_CONGRUITA}}",        dati.aml_congruita        || "Congrua (Basso)");
  body.replaceText("{{AML_PROFILO_FINALE}}",   dati.aml_profilo_finale   || "BASSO");
  body.replaceText("{{AML_MOTIVAZIONE}}",      dati.aml_note_motivazione || "Valutazione eseguita in conformità al D.Lgs 231/2007.");

  // Campi AML aggiuntivi
  body.replaceText("{{AML_SETTORE_ATTIVITA}}", dati.aml_settore_attivita || "Non specificato");

  var pepTesto = dati.aml_pep === "si"
    ? "[X] essere [ ] non essere persona politicamente esposta"
    : "[ ] essere [X] non essere persona politicamente esposta";
  body.replaceText("{{AML_PEP_STATO}}", pepTesto);

  var scopoMap = {
    "abitazione_principale": "[X] uso abitazione principale   [ ] uso abitazione secondaria   [ ] investimento\n[ ] altro (specificare): _______________________",
    "abitazione_secondaria": "[ ] uso abitazione principale   [X] uso abitazione secondaria   [ ] investimento\n[ ] altro (specificare): _______________________",
    "investimento":          "[ ] uso abitazione principale   [ ] uso abitazione secondaria   [X] investimento\n[ ] altro (specificare): _______________________",
    "altro":                 "[ ] uso abitazione principale   [ ] uso abitazione secondaria   [ ] investimento\n[X] altro (specificare): " + (dati.aml_scopo_altro || "_______________________")
  };
  body.replaceText("{{AML_SCOPO_OPERAZIONE}}", scopoMap[dati.aml_scopo_operazione] || scopoMap["abitazione_principale"]);

  // Firme Privacy e AML di questo venditore
  var logOtp = "\n"+dataOraOtp+"\n+"+(venditoreCorrente.telefono||"")+"\nIC-"+tokenRif;
  _iniettaFirmaInline(body, "{{FIRMA_PRIVACY_1}}", venditoreCorrente.firmaPrivacy || "", logOtp);
  _iniettaFirmaInline(body, "{{FIRMA_PRIV_1}}",    venditoreCorrente.firmaPrivacy || "", logOtp);
  _iniettaFirmaInline(body, "{{FIRMA_AML_1}}",     venditoreCorrente.firmaAml     || "", logOtp);

  // Firma agente nella sezione Privacy/AML
  var nomeAgente   = dati.agente || "Antonio Giancani";
  var idFirmaAgent = (typeof CONFIG !== 'undefined' && CONFIG.FIRME_AGENTI) ? CONFIG.FIRME_AGENTI[nomeAgente] : null;
  if (idFirmaAgent) {
    try {
      var blobFirma = DriveApp.getFileById(idFirmaAgent).getBlob();
      var paragrafi = body.getParagraphs();
      for (var i=0; i<paragrafi.length; i++) {
        if (paragrafi[i].getText().includes("{{FIRMA_AGENTE}}")) {
          paragrafi[i].replaceText("{{FIRMA_AGENTE}}"," ");
          var img = paragrafi[i].appendInlineImage(blobFirma);
          img.setWidth(110); img.setHeight(30);
          break;
        }
      }
    } catch(e) { body.replaceText("{{FIRMA_AGENTE}}",""); }
  } else {
    body.replaceText("{{FIRMA_AGENTE}}","");
  }

  body.replaceText("{{ALLEGATI_DOCUMENTI}}","");
  body.replaceText("{{QR_DOCUMENTO}}","");
}

/** Inserisce firma inline cercando il placeholder ovunque nel body */
function _iniettaFirmaInline(body, tagPlaceholder, stringaBase64, logOtp) {
  var elemento = body.findText(tagPlaceholder);
  if (!elemento || !stringaBase64 || !stringaBase64.includes(",")) {
    body.replaceText(tagPlaceholder, "_______________");
    return;
  }
  try {
    var paragrafo = elemento.getElement().getParent().asParagraph();
    paragrafo.replaceText(tagPlaceholder, " ");
    var blob = Utilities.newBlob(Utilities.base64Decode(stringaBase64.split(',')[1]), "image/png", "firma.png");
    var img = paragrafo.appendInlineImage(blob);
    img.setWidth(100); img.setHeight(30);
    var pLog = paragrafo.getParent().asBody().insertParagraph(body.getChildIndex(paragrafo)+1, logOtp);
    pLog.editAsText().setFontSize(6).setItalic(true).setForegroundColor("#64748b");
  } catch(e) {
    body.replaceText(tagPlaceholder, "✓ FIRMATO");
  }
}


// ════════════════════════════════════════════════════════════
// 11. FIRMA REMOTA — GENERA LINK + FINALIZZA 4 FIRME
// ════════════════════════════════════════════════════════════

/** Genera un token univoco per la firma remota e salva i dati dell'incarico */
function generaLinkFirmaRemotaIncarico(datiIncarico) {
  try {
    var uuid = Utilities.getUuid();
    PropertiesService.getScriptProperties().setProperty("INCARICO_FIRMA_"+uuid, JSON.stringify(datiIncarico));
    return { successo:true, token:uuid, urlBase:ScriptApp.getService().getUrl() };
  } catch(e) { return { successo:false, messaggio:e.toString() }; }
}

/** Finalizza le 4 firme per un venditore specifico (chiamata dalla pagina remota) */
function finalizzaFirmaRemotaIncaricoCompleta(token, vendIndex, pacchettoFirme, videoAccettato) {
  try {
    var chiave   = "INCARICO_FIRMA_"+token;
    var datiJson = PropertiesService.getScriptProperties().getProperty(chiave);
    if (!datiJson) return { successo:false, messaggio:"Sessione scaduta o non valida!" };

    var dati = JSON.parse(datiJson);
    var idx  = parseInt(vendIndex, 10);

    if (dati.venditori[idx]) {
      dati.venditori[idx].firmaIncarico  = pacchettoFirme.firmaIncarico;
      dati.venditori[idx].firmaEconomica = pacchettoFirme.firmaEconomica;
      dati.venditori[idx].firmaPrivacy   = pacchettoFirme.firmaPrivacy;
      dati.venditori[idx].firmaAml       = pacchettoFirme.firmaAml;
      dati.venditori[idx].videoCheck     = videoAccettato ? "ACCETTATO — Video ID Richiesto" : "NON ACCETTATO";
    }

    var tuttiHannoFirmatoTutto = dati.venditori.every(function(v) {
      return !!v.firmaIncarico && !!v.firmaEconomica && !!v.firmaPrivacy && !!v.firmaAml;
    });

    // Notifica di firma parziale per questo venditore
    var venditoreAttuale = dati.venditori[idx] || {};
    var msgParziale = "📝 *FIRMA INCARICO ACQUISITA*\n"
      + "Il proprietario *" + (venditoreAttuale.nome || "").toUpperCase() + "* ha completato le sue 4 firme digitali per l'Incarico di Vendita.\n\n"
      + "— _Antonio Giancani_";
    
    try {
      if (typeof inviaTelegramBoss === "function") inviaTelegramBoss(msgParziale);
      if (typeof _inviaMetaWhatsApp === "function" && typeof CONFIG !== 'undefined' && CONFIG.WA_AGENTE) {
        _inviaMetaWhatsApp(CONFIG.WA_AGENTE, msgParziale);
      }
    } catch(eNotif) {
      console.log("Errore notifica parziale: " + eNotif);
    }

    if (tuttiHannoFirmatoTutto) {
      var res = salvaDatiIncarico(dati);
      if (res.successo) {
        PropertiesService.getScriptProperties().deleteProperty(chiave);
        
        // Notifica completamento totale
        var msgTotale = "✅ *INCARICO DI VENDITA COMPLETATO*\n"
          + "Tutti i comproprietari (" + dati.venditori.length + ") hanno completato le firme digitali!\n"
          + "Il PDF finale è stato archiviato correttamente su Drive.\n\n"
          + "📄 *Link PDF Principale:*\n" + res.urlPdf + "\n\n"
          + "— _Antonio Giancani_";
          
        try {
          if (typeof inviaTelegramBoss === "function") inviaTelegramBoss(msgTotale);
          if (typeof _inviaMetaWhatsApp === "function" && typeof CONFIG !== 'undefined' && CONFIG.WA_AGENTE) {
            _inviaMetaWhatsApp(CONFIG.WA_AGENTE, msgTotale);
          }
        } catch(eNotifTot) {
          console.log("Errore notifica totale: " + eNotifTot);
        }
      }
      return { successo:true, completato:true, urlPdf:res.urlPdf };
    } else {
      PropertiesService.getScriptProperties().setProperty(chiave, JSON.stringify(dati));
      return { successo:true, completato:false, messaggio:"Firme acquisite! In attesa degli altri proprietari." };
    }
  } catch(e) {
    return { successo:false, messaggio:e.toString() };
  }
}


// ════════════════════════════════════════════════════════════
// 12. OTP E OCR CARTA IDENTITÀ
// ════════════════════════════════════════════════════════════

function verificaOTPIncarico(telefono, otpInserito) {
  try {
    var numPulito = telefono.replace(/\D/g,'').slice(-10);
    var otpSalvato = PropertiesService.getScriptProperties().getProperty('OTP_INCARICO_'+numPulito)
      || PropertiesService.getScriptProperties().getProperty('OTP_VISITA_'+numPulito);
    if (otpSalvato && otpSalvato === otpInserito.trim()) return { successo:true };
    return { successo:false, messaggio:"Codice OTP errato o scaduto." };
  } catch(e) { return { successo:false, messaggio:e.toString() }; }
}

function processaFotoCartaIdentitaIncarico(base64Data, indiceVenditore) {
  if (typeof processaFotoCartaIdentita === "function") {
    return processaFotoCartaIdentita(base64Data, indiceVenditore);
  }
  return { successo:false, ocrSuccesso:false, messaggio:"Funzione OCR non disponibile. Compila manualmente." };
}


// ════════════════════════════════════════════════════════════
// 13. PAGINA FIRMA REMOTA — SERVE HTML FirmaIncarico
// ════════════════════════════════════════════════════════════

/**
 * Prepara e serve la pagina FirmaIncarico.html con tutti i dati
 * precompilati per il venditore specificato. Chiamata dal doGet
 * quando l'URL contiene p=firma_incarico&t=<token>&cli=<indice>
 */
function paginaFirmaRemotaIncarico(token, vendIndex) {
  var chiave   = "INCARICO_FIRMA_"+token;
  var datiJson = PropertiesService.getScriptProperties().getProperty(chiave);

  // Valori di default: garantiscono che OGNI variabile richiesta dall'HTML sia sempre definita,
  // anche se la sessione è scaduta o il JSON è malformato.
  var v = {
    nomeCliente: "Venditore", telefonoCliente: "", cfCliente: "", residenzaCliente: "",
    nascitaCliente: "", luogoCliente: "",
    prezzoVendita: 0, prezzoMinimo: 0,
    indirizzoImmobile: "",
    tipoImmobile: "Appartamento", affittato: "no",
    urbanisticaCatastale: "", condizioniCondominiali: "",
    classeEnergeticaApe: "N/D", mutuoResiduoFormattato: "Nessuno", dataRogitoPrevista: ""
  };

  var provvDef = calcolaProvvigioneAutomatica(0);

  if (datiJson) {
    var dati = JSON.parse(datiJson);
    var idx  = parseInt(vendIndex, 10);

    if (dati.venditori && dati.venditori[idx]) {
      var vend = dati.venditori[idx];
      v.nomeCliente      = vend.nome         || "Venditore";
      v.telefonoCliente  = vend.telefono     || "";
      v.cfCliente        = vend.cf           || "";
      v.residenzaCliente = vend.residenza    || "";
      v.nascitaCliente   = vend.dataNascita  || "";
      v.luogoCliente     = vend.luogoNascita || "";
    }

    v.prezzoVendita = parseFloat(String(dati.prezzoVendita||"0").replace(/\./g,'').replace(',','.')) || 0;
    v.prezzoMinimo  = parseFloat(String(dati.prezzoMinimo ||"0").replace(/\./g,'').replace(',','.')) || 0;
    provvDef        = calcolaProvvigioneAutomatica(v.prezzoVendita);

    v.indirizzoImmobile = (dati.catasto && dati.catasto[0]) ? (dati.catasto[0].descrizione || "") : "";

    v.tipoImmobile           = dati.tipoImmobile || "Appartamento";
    v.affittato              = dati.affittato || "no";
    v.urbanisticaCatastale   = dati.urbanisticaCatastale || "";
    v.condizioniCondominiali = dati.condizioniCondominiali || "";
    v.classeEnergeticaApe    = dati.classeEnergeticaApe || "N/D";
    v.dataRogitoPrevista     = dati.dataRogitoPrevista || "";
    v.mutuoResiduoFormattato = dati.mutuoResiduo
      ? _formatEuro(parseFloat(String(dati.mutuoResiduo).replace(/\./g,'').replace(',','.')))
      : "Nessuno";
  }

  var tmpl = HtmlService.createTemplateFromFile('FirmaIncarico');

  tmpl.nomeCliente            = v.nomeCliente;
  tmpl.telefonoCliente        = v.telefonoCliente;
  tmpl.cfCliente              = v.cfCliente;
  tmpl.residenzaCliente       = v.residenzaCliente;
  tmpl.nascitaCliente         = v.nascitaCliente;
  tmpl.luogoCliente           = v.luogoCliente;
  tmpl.token                  = token;
  tmpl.cliIndex               = vendIndex;
  tmpl.prezzoVendita          = v.prezzoVendita;
  tmpl.prezzoMinimo           = v.prezzoMinimo;   // ← mancava, aggiunta
  tmpl.provvigioneImponibile  = provvDef.imponibile;
  tmpl.provvigioneIva         = provvDef.iva;
  tmpl.provvigioneTotale      = provvDef.totale;
  tmpl.provvigioneTipo        = provvDef.tipo;
  tmpl.indirizzoImmobile      = v.indirizzoImmobile;
  tmpl.idModelloFacSimile     = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC) ? CONFIG.ID_MODELLO_INC : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : "");
  tmpl.idModelloFacSimile2    = ID_MODELLO_PRIVACY_AML;

  tmpl.tipoImmobile           = v.tipoImmobile;
  tmpl.affittato              = v.affittato;
  tmpl.urbanisticaCatastale   = v.urbanisticaCatastale;
  tmpl.condizioniCondominiali = v.condizioniCondominiali;
  tmpl.classeEnergeticaApe    = v.classeEnergeticaApe;
  tmpl.mutuoResiduo           = v.mutuoResiduoFormattato; // già formattato in €, niente da fare nell'HTML
  tmpl.dataRogitoPrevista     = v.dataRogitoPrevista;

  return tmpl.evaluate()
    .setTitle("Firma Incarico di Vendita — Immobiliare Giancani")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Consente al cliente di caricare foto dei documenti (CI fronte, CI retro, CF)
 * durante il processo di firma remota. Salva il file in Drive e aggiorna la sessione.
 */
function caricaDocumentoFirmaRemota(token, vendIndex, tipoDoc, base64Data, filename) {
  try {
    var chiave   = "INCARICO_FIRMA_" + token;
    var datiJson = PropertiesService.getScriptProperties().getProperty(chiave);
    if (!datiJson) return { successo: false, messaggio: "Sessione scaduta o non valida." };

    var dati = JSON.parse(datiJson);
    var idx  = parseInt(vendIndex, 10);
    var venditore = dati.venditori[idx];
    if (!venditore) return { successo: false, messaggio: "Venditore non trovato." };

    // Decodifica base64 e crea il Blob
    var byteData = Utilities.base64Decode(base64Data.split(',')[1]);
    var mimeType = base64Data.split(',')[0].split(':')[1].split(';')[0];
    var blob     = Utilities.newBlob(byteData, mimeType, filename);

    // Salva il file nella cartella ALLEGATI_VENDITORI
    var rootFolder = _ottieniOCreaCrt(null, "📁 ALLEGATI_VENDITORI");
    var folderMese = _ottieniOCreaCrt(rootFolder, Utilities.formatDate(new Date(), "Europe/Rome", "yyyy-MM"));
    var file = folderMese.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var fileId = file.getId();

    // Aggiorna l'elenco dei documenti del venditore nella sessione
    if (!venditore.documentiCaricati) {
      venditore.documentiCaricati = {};
    }
    venditore.documentiCaricati[tipoDoc] = fileId;

    // Se non esiste l'array globale dei documenti, lo creiamo
    if (!dati.documenti) dati.documenti = [];
    dati.documenti.push(fileId);

    PropertiesService.getScriptProperties().setProperty(chiave, JSON.stringify(dati));

    return { successo: true, fileId: fileId, url: file.getUrl() };
  } catch (e) {
    return { successo: false, messaggio: e.toString() };
  }
}


// ════════════════════════════════════════════════════════════
// 14. LINK FAC-SIMILE E TOKEN DOCUMENTO
// ════════════════════════════════════════════════════════════

/** Restituisce il link Drive view-only del template Incarico (fac-simile) */
function getLinkFacSimile() {
  var id = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC) ? CONFIG.ID_MODELLO_INC : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : "");
  if (!id) return "";
  return "https://docs.google.com/document/d/" + id + "/view";
}

/** Restituisce il link Drive view-only del template Privacy+AML (fac-simile) */
function getLinkFacSimilePrivacyAml() {
  return "https://docs.google.com/document/d/" + ID_MODELLO_PRIVACY_AML + "/view";
}

/** Recupera l'URL del PDF da un token documento, verificando la scadenza (11 mesi) */
function recuperaDocumentoDaToken(tokenLink) {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty("DOC_" + tokenLink);
    if (!raw) return { successo:false, messaggio:"Link non valido o non trovato." };
    var dati = JSON.parse(raw);
    if (new Date().getTime() > dati.scadenza) {
      return { successo:false, messaggio:"Questo link è scaduto (validità 11 mesi)." };
    }
    return { successo:true, url:dati.url };
  } catch(e) { return { successo:false, messaggio:e.toString() }; }
}


// ════════════════════════════════════════════════════════════
// 15. SISTEMA BOZZE INCARICHI (auto-save + ripresa lavoro)
// ════════════════════════════════════════════════════════════

/**
 * Salva o aggiorna una bozza incarico. Se idBozzaEsistente è vuoto/null,
 * ne crea una nuova e restituisce il nuovo ID; altrimenti aggiorna la riga.
 */
function salvaBozzaIncarico(idBozzaEsistente, datiForm) {
  try {
    var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) { creaFoglioBozzeIncarichi(); sheet = ss.getSheetByName("BOZZE_INCARICHI"); }

    var nomiVenditori = (datiForm.venditori || []).map(function(v){ return v.nome || ""; }).filter(Boolean).join(", ") || "—";
    var indirizzo = (datiForm.catasto && datiForm.catasto[0]) ? (datiForm.catasto[0].descrizione || "—") : "—";
    var dataOra = Utilities.formatDate(new Date(), "Europe/Rome", "dd/MM/yyyy HH:mm");
    var jsonDati = JSON.stringify(datiForm);

    if (idBozzaEsistente) {
      var righe = sheet.getDataRange().getValues();
      for (var i = 1; i < righe.length; i++) {
        if (String(righe[i][0]) === String(idBozzaEsistente)) {
          sheet.getRange(i+1, 2, 1, 5).setValues([[dataOra, datiForm.agente||"", nomiVenditori, indirizzo, "BOZZA"]]);
          sheet.getRange(i+1, 7).setValue(jsonDati);
          return { successo:true, idBozza: idBozzaEsistente };
        }
      }
    }

    // Nessun ID esistente o non trovato: crea nuova bozza
    var nuovoId = "BZI_" + Utilities.getUuid().substring(0,8).toUpperCase();
    sheet.appendRow([nuovoId, dataOra, datiForm.agente||"", nomiVenditori, indirizzo, "BOZZA", jsonDati]);
    return { successo:true, idBozza: nuovoId };

  } catch(e) {
    return { successo:false, messaggio: e.toString() };
  }
}

/** Legge tutte le bozze incarichi per il pannello dedicato */
function leggiBozzeIncarichiComplete() {
  try {
    var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) return [];
    var data = sheet.getDataRange().getValues();
    var lista = [];
    for (var i = 1; i < data.length; i++) {
      lista.push({
        idBozza: String(data[i][0]),
        dataOra: String(data[i][1]),
        agente: String(data[i][2]),
        venditori: String(data[i][3]),
        indirizzo: String(data[i][4]),
        stato: String(data[i][5])
      });
    }
    return lista.reverse();
  } catch(e) { return []; }
}

/** Recupera i dati completi (JSON) di una bozza specifica */
function recuperaBozzaIncarico(idBozza) {
  try {
    var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) return { successo:false, messaggio:"Foglio bozze non trovato." };
    var righe = sheet.getDataRange().getValues();
    for (var i = 1; i < righe.length; i++) {
      if (String(righe[i][0]) === String(idBozza)) {
        return { successo:true, dati: JSON.parse(righe[i][6]) };
      }
    }
    return { successo:false, messaggio:"Bozza non trovata." };
  } catch(e) { return { successo:false, messaggio: e.toString() }; }
}

/** Elimina definitivamente una bozza */
function eliminaBozzaIncarico(idBozza) {
  try {
    var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) return { successo:false };
    var righe = sheet.getDataRange().getValues();
    for (var i = 1; i < righe.length; i++) {
      if (String(righe[i][0]) === String(idBozza)) {
        sheet.deleteRow(i+1);
        return { successo:true };
      }
    }
    return { successo:false, messaggio:"Bozza non trovata." };
  } catch(e) { return { successo:false, messaggio: e.toString() }; }
}

/** Segna una bozza come completata (dopo aver generato il PDF finale) */
function completaBozzaIncarico(idBozza) {
  try {
    var ss = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) return { successo:false };
    var righe = sheet.getDataRange().getValues();
    for (var i = 1; i < righe.length; i++) {
      if (String(righe[i][0]) === String(idBozza)) {
        sheet.getRange(i+1, 6).setValue("COMPLETATO");
        return { successo:true };
      }
    }
    return { successo:false };
  } catch(e) { return { successo:false, messaggio: e.toString() }; }
}

/** Legacy: lettura bozze per compatibilità con versioni precedenti */
function leggiBozzeIncarichi() {
  try {
    var ss    = SpreadsheetApp.openById(typeof ID_SHEET_INC !== 'undefined' ? ID_SHEET_INC : (typeof ID_SHEET !== 'undefined' ? ID_SHEET : "19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc"));
    var sheet = ss.getSheetByName("BOZZE_INCARICHI");
    if (!sheet) return [];
    var data  = sheet.getDataRange().getValues();
    var lista = [];
    for (var i=1; i<data.length; i++) {
      lista.push({
        idBozza:   String(data[i][0]),
        dataOra:   String(data[i][1]),
        agente:    String(data[i][2]),
        venditori: String(data[i][3]),
        indirizzo: String(data[i][4]),
        stato:     String(data[i][5]),
        urlPdf:    String(data[i][6])
      });
    }
    return lista;
  } catch(e) { return []; }
}

/** Serve la pagina HTML del pannello Bozze Incarichi */
function paginaBozzeIncarichi() {
  var tpl = HtmlService.createTemplateFromFile('BozzeIncarichi');
  tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
  return tpl.evaluate()
    .setTitle("Bozze Incarichi — Immobiliare Giancani")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}


// ════════════════════════════════════════════════════════════
// 16. HELPER PRIVATI
//     Formattazione, Drive, Sheet, WhatsApp
// ════════════════════════════════════════════════════════════

/** Formatta un numero come stringa Euro italiana (es. "1.250,00 €") */
function _formatEuro(n) {
  if (!n || isNaN(n)) return "0,00 €";
  return n.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
}

/** Rimuove il placeholder e inserisce una tabella al suo posto */
function _pulisciEInserisciTabella(body, tag) {
  var elemento = body.findText(tag);
  if (!elemento) return null;
  try {
    elemento.getElement().asText().setText("");
  } catch(e) {
    elemento.getElement().removeFromParent();
    return null;
  }
  return body.insertTable(body.getChildIndex(elemento.getElement().getParent())+1);
}

/** Inietta firma (immagine base64) in una cella di tabella */
function _iniettaFirmaCella(riga, stringaBase64, logOtp, tipoSigla, tipoFirma) {
  var cella  = riga.appendTableCell("");
  var pFirma = cella.getChild(0).asParagraph();

  if (stringaBase64 && stringaBase64.includes(",")) {
    try {
      var blob = Utilities.newBlob(
        Utilities.base64Decode(stringaBase64.split(',')[1]),
        "image/png", "firma_"+tipoSigla+".png"
      );
      var img = pFirma.appendInlineImage(blob);
      img.setWidth(85); img.setHeight(26);
      var pLog = cella.appendParagraph(logOtp);
      pLog.editAsText().setFontSize(5).setItalic(true).setForegroundColor("#475569");
    } catch(eImg) {
      pFirma.setText("✓ OK"+logOtp);
      pFirma.editAsText().setFontSize(5).setForegroundColor("#000000");
    }
  } else if (tipoFirma === "remota") {
    pFirma.setText("✅ OTP"+logOtp);
    pFirma.editAsText().setFontSize(5).setForegroundColor("#16a34a");
  } else {
    pFirma.setText("________");
    pFirma.editAsText().setFontSize(5).setForegroundColor("#94a3b8");
  }
}

/** Archivia il PDF in struttura Drive: 📁 ARCHIVIO_INCARICHI_GIANCANI / Anno XXXX / Mese */
function _archiviaPdfIncarico(fileIdPdf, nomeVenditore, dataIncarico, cfVenditore) {
  try {
    var anno = dataIncarico ? dataIncarico.substring(0,4) : new Date().getFullYear().toString();
    var mese = dataIncarico ? dataIncarico.substring(5,7) : String(new Date().getMonth()+1).padStart(2,'0');
    var nomiMesi = {
      "01":"01-Gennaio","02":"02-Febbraio","03":"03-Marzo","04":"04-Aprile",
      "05":"05-Maggio","06":"06-Giugno","07":"07-Luglio","08":"08-Agosto",
      "09":"09-Settembre","10":"10-Ottobre","11":"11-Novembre","12":"12-Dicembre"
    };
    var root    = _ottieniOCreaCrt(null,"📁 ARCHIVIO_INCARICHI_GIANCANI");
    var annoDir = _ottieniOCreaCrt(root,"Anno "+anno);
    var meseDir = _ottieniOCreaCrt(annoDir,nomiMesi[mese]||mese);
    var cfPulito= cfVenditore ? "_"+cfVenditore.toUpperCase().trim() : "";
    var dataPul = (dataIncarico||"").replace(/-/g,"");
    var nomePdf = "Incarico_"+nomeVenditore+"_"+dataPul+cfPulito+".pdf";
    var copia   = DriveApp.getFileById(fileIdPdf).makeCopy(nomePdf,meseDir);
    copia.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    return copia.getId();
  } catch(e) { console.log("Errore archivio: "+e); return null; }
}

/** Ottiene o crea una cartella su Drive (helper ricorsivo) */
function _ottieniOCreaCrt(parent, nome) {
  var iter = parent ? parent.getFoldersByName(nome) : DriveApp.getFoldersByName(nome);
  if (iter.hasNext()) return iter.next();
  return parent ? parent.createFolder(nome) : DriveApp.createFolder(nome);
}

/** Salva una riga nel foglio STORICO_INCARICHI */
function _salvaStoricoIncarichi(dati, dataFormattata, urlPdfArray, scadenzaStr, provvPct, provvEuro, provvTipo) {
  var ss    = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var sheet = ss.getSheetByName("STORICO_INCARICHI");
  if (!sheet) return;

  var riga = [dataFormattata, dati.agente||"", dati.luogoFirma||"Favara (AG)"];

  // Logga fino a 8 venditori (8 * 4 colonne = 32 elementi riga)
  for (var i=0; i<8; i++) {
    var v = dati.venditori && dati.venditori[i] ? dati.venditori[i] : {nome:"",cf:"",telefono:""};
    var quota = "";
    if (dati.venditori && dati.venditori[i]) {
      quota = v.quota || (100/dati.venditori.length).toFixed(2)+"%";
    }
    riga.push(v.nome||"", v.cf||"", v.telefono||"", quota);
  }

  riga.push(dati.catasto_tipo||"FABBRICATI");
  for (var j=0; j<3; j++) {
    var c = dati.catasto && dati.catasto[j] ? dati.catasto[j] : {foglio:"",particella:"",sub:"",prezzo:""};
    riga.push(c.foglio||"", c.particella||"", c.sub||"", c.prezzo||"");
  }

  riga.push(
    dati.prezzoVendita||"", dati.prezzoMinimo||"",
    provvPct+"%", _formatEuro(provvEuro), provvTipo||"",
    dati.durataMesi||"12", scadenzaStr,
    dati.tipoIncarico||"ESCLUSIVA", dati.noteLibere||"",
    dati.tipoImmobile||"Appartamento",
    dati.affittato==="si" ? "SÌ" : "NO",
    dati.urbanisticaCatastale||"",
    dati.condizioniCondominiali||"Nulla da segnalare",
    dati.classeEnergeticaApe||"N/D",
    dati.dataRogitoPrevista||"",
    dati.mutuoResiduo||"",
    dati.aml_profilo_finale||"BASSO",
    dati.aml_natura_giuridica||"",
    dati.aml_area_geo||"",
    dati.aml_comportamento||"",
    dati.aml_origine_fondi||"",
    dati.aml_frequenza||"",
    dati.aml_congruita||"",
    dati.aml_note_motivazione||"",
    dati.tipoFirma||"digitale", "OTP VALIDATO",
    urlPdfArray[0]||"", urlPdfArray[1]||"", urlPdfArray[2]||"", urlPdfArray[3]||"",
    urlPdfArray[4]||"", urlPdfArray[5]||"", urlPdfArray[6]||"", urlPdfArray[7]||"",
    "ATTIVO"
  );

  sheet.appendRow(riga);
}

/** Salva una riga nel foglio REPORT_VENDITORI */
function _salvaReportVenditori(dati, dataFormattata, urlPdf, scadenzaStr, provvPct, provvEuro) {
  var ss    = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var sheet = ss.getSheetByName("REPORT_VENDITORI");
  if (!sheet) return;

  var v0        = dati.venditori && dati.venditori[0] ? dati.venditori[0] : {};
  var indirizzi = (dati.catasto||[]).map(function(c){ return c.descrizione||""; }).filter(Boolean).join(" | ");

  sheet.appendRow([
    dataFormattata, dati.agente||"Antonio Giancani",
    v0.nome||"", v0.telefono||"", indirizzi,
    dati.tipoImmobile||"Appartamento",
    dati.prezzoVendita||"", dati.prezzoMinimo||"",
    provvPct+"%", _formatEuro(provvEuro),
    dati.tipoIncarico||"ESCLUSIVA", scadenzaStr,
    dati.dataRogitoPrevista||"",
    dati.aml_profilo_finale||"BASSO",
    "ATTIVO", urlPdf, dati.noteLibere||""
  ]);
}

/** Invia a OGNI venditore il SUO link/PDF personale via WhatsApp */
function _inviaLinkVenditoriPersonali(venditori, urlPdfArray) {
  if (!venditori || !venditori.length) return;
  venditori.forEach(function(v, i) {
    if (!v.telefono) return;
    var tel = v.telefono.replace(/\D/g,'');
    if (!tel.startsWith('39') && tel.length === 10) tel = '39' + tel;
    var urlPersonale = urlPdfArray[i] || urlPdfArray[0];
    var msg = "🏡 *IMMOBILIARE GIANCANI*\n\nGentile *"+(v.nome||"")+"*,\n\ngrazie per aver conferito l'incarico di vendita.\n\n📄 La tua copia personale del contratto (Incarico + Privacy + AML):\n"+urlPersonale+"\n\n_Il link rimarrà attivo per 11 mesi._\n\n_Antonio Giancani — Favara (AG)_\n📞 wa.me/393201667156";
    try {
      if (typeof _inviaMetaWhatsApp === "function") _inviaMetaWhatsApp(tel, msg);
    } catch(e) { console.log("Errore WA: "+e); }
  });
}


