// ==========================================

// ============================================================
// FUNZIONI INCARICHI DI VENDITA — Immobiliare Giancani
// Versione: 4.0 | Autore: DarIA / SuperAgenda73
// Novità v4.0:
// - 4 firme (Incarico+Prezzo / Riepilogo Economico / Privacy / AML)
// - PDF PERSONALE per ciascun venditore: Doc1 (Incarico, tutti i
//   proprietari) + Doc2 (Privacy+AML SOLO del singolo venditore)
//   uniti in un UNICO Google Doc generato al volo -> 1 PDF nativo
// - Link di accesso al documento con scadenza A 11 MESI
// - Provvigione automatica (2000€ fisso ≤65.000€, 3%+IVA sopra)
// - Nuovi campi immobile (tipo, affittato, urbanistica, condominio,
//   APE, data rogito, mutuo residuo)
// ============================================================

// ID del documento Privacy+AML (Doc 2), separato dall'Incarico
var ID_MODELLO_PRIVACY_AML = "1L2yMtTTjEH8h3tF5A5RdKT8xiDJY3HGFTfRZVzN6910";

// Durata di validità del link documento per il cliente (11 mesi in ms)
var DURATA_LINK_DOCUMENTO_MS = 11 * 30 * 24 * 60 * 60 * 1000; // ≈11 mesi

// ════════════════════════════════════════════════════════════
// 1. FOGLIO STORICO_INCARICHI — CREAZIONE / RESET
// ════════════════════════════════════════════════════════════
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
    "TIPO_FIRMA","LOG_OTP","URL_PDF_V1","URL_PDF_V2","URL_PDF_V3","URL_PDF_V4","STATO"
  ];
  sheet.appendRow(intestazioni);
  var header = sheet.getRange(1,1,1,intestazioni.length);
  header.setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc").setFontSize(9);
  sheet.autoResizeColumns(1,intestazioni.length);
  sheet.setFrozenRows(1);
  Logger.log("✅ STORICO_INCARICHI inizializzato.");
}

// ════════════════════════════════════════════════════════════
// 2. FOGLIO REPORT_VENDITORI — CREAZIONE / RESET
// ════════════════════════════════════════════════════════════
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

    var primoCognome = venditori[0].nome.replace(/\s+/g,"_").toUpperCase();
    var dataContratto = dati.dataIncarico
      ? dati.dataIncarico.split('-').reverse().join('/')
      : Utilities.formatDate(new Date(),"Europe/Rome","dd/MM/yyyy");
    var dataOraOtp = Utilities.formatDate(new Date(),"Europe/Rome","dd/MM/yyyy HH:mm:ss");
    var tokenRif   = Utilities.getUuid().substring(0,8).toUpperCase();

    var dataScadenza = new Date();
    if (dati.dataIncarico) dataScadenza = new Date(dati.dataIncarico);
    dataScadenza.setMonth(dataScadenza.getMonth() + parseInt(dati.durataMesi || 12));
    var scadenzaStr = Utilities.formatDate(dataScadenza,"Europe/Rome","dd/MM/yyyy");

    var prezzoVendita = parseFloat(String(dati.prezzoVendita||"0").replace(/\./g,'').replace(',','.')) || 0;
    var prezzoMinimo  = parseFloat(String(dati.prezzoMinimo ||"0").replace(/\./g,'').replace(',','.')) || 0;
    var calcProvv     = calcolaProvvigioneAutomatica(prezzoVendita);
    var provvPct      = calcProvv.pctEquivalente;
    var provvEuro     = calcProvv.imponibile;

    var urlPdfPerVenditore = []; // un url per ciascun venditore, in ordine

    // ── Genera un PDF personale per OGNI venditore ───────────
    for (var vi = 0; vi < venditori.length; vi++) {
      var venditoreCorrente = venditori[vi];
      var nomeFile = "Incarico_" + venditoreCorrente.nome.replace(/\s+/g,"_").toUpperCase() + "_" + new Date().getTime() + "_" + vi;

      var risultato = _generaDocumentoPersonale(dati, venditori, vi, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo, nomeFile);
      urlPdfPerVenditore.push(risultato.urlPdf);

      try { _archiviaPdfIncarico(risultato.fileIdPdf, venditoreCorrente.nome.replace(/\s+/g,"_").toUpperCase(), dati.dataIncarico, venditoreCorrente.cf); } catch(e) {}
    }

    // ── LOG SU FOGLI SHEET (usa il primo PDF come riferimento principale) ──
    try { _salvaStoricoIncarichi(dati, dataContratto, urlPdfPerVenditore, scadenzaStr, provvPct, provvEuro, calcProvv.tipo); } catch(e) { console.log("Errore storico: "+e); }
    try { _salvaReportVenditori(dati, dataContratto, urlPdfPerVenditore[0], scadenzaStr, provvPct, provvEuro); } catch(e) { console.log("Errore report: "+e); }

    // ── INVIO LINK PERSONALI AI VENDITORI ─────────────────────
    try { _inviaLinkVenditoriPersonali(venditori, urlPdfPerVenditore); } catch(e) {}
    // Hook → popola INCARICHI_IMMOBILI automaticamente
try {
  coAggiungiImmobileDopoIncarico(dati, urlPdfPerVenditore[0]);
} catch(eHook) {
  Logger.log('Hook INCARICHI_IMMOBILI: ' + eHook.message);
}

return { successo:true, urlPdf: urlPdfPerVenditore[0], urlPdfTutti: urlPdfPerVenditore };

    return { successo:true, urlPdf: urlPdfPerVenditore[0], urlPdfTutti: urlPdfPerVenditore };

  } catch(errore) {
    console.log("CRASH salvaDatiIncarico: "+errore.toString()+"\n"+errore.stack);
    return { successo:false, messaggio:errore.toString() };
  }
}

/**
 * Genera UN documento personale per il venditore in posizione `indiceVenditore`:
 * copia Doc1 (Incarico, con TUTTI i venditori in tabella) e in coda appende
 * il contenuto di Doc2 (Privacy+AML) compilato SOLO con i dati di quel venditore.
 * Esporta tutto come un unico PDF nativo e lo salva con link a scadenza 11 mesi.
 */
function _generaDocumentoPersonale(dati, venditori, indiceVenditore, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo, nomeFile) {
  var venditoreCorrente = venditori[indiceVenditore];

  var idModelloInc = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC)
    ? CONFIG.ID_MODELLO_INC
    : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : null);
  if (!idModelloInc) throw new Error("ID_MODELLO_INC non configurato!");

  var idModelloPrivacyAml = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_PRIVACY_AML)
    ? CONFIG.ID_MODELLO_PRIVACY_AML
    : ID_MODELLO_PRIVACY_AML;

  // ── 1) Copia Doc1 (Incarico) come base del documento finale ──
  var fileCopia = DriveApp.getFileById(idModelloInc).makeCopy(nomeFile);
  var docCopia  = DocumentApp.openById(fileCopia.getId());
  var body      = docCopia.getBody();

  _compilaPlaceholderComuni(body, dati, dataContratto, scadenzaStr, dataOraOtp, tokenRif, calcProvv, prezzoVendita, prezzoMinimo);
  _inserisciTabellaVenditoriCompleta(body, venditori, dataOraOtp, tokenRif, dati.tipoFirma);
  _inserisciTabellaCatasto(body, dati);
  _inserisciFirmaAgente(body, dati);
  _inserisciAllegatiDocumenti(body, dati);
  _inserisciQrCode(body, docCopia);

  // ── 2) Appende in coda SOLO la sezione Privacy del Doc2 (fino al marcatore) ──
  //    L'AML e la Scheda Rischio NON vengono mai incluse nel PDF del cliente.
  body.appendPageBreak();
  var docPrivacyAml = DocumentApp.openById(idModelloPrivacyAml);
  var bodyOrigine   = docPrivacyAml.getBody();
  var numElementi   = bodyOrigine.getNumChildren();
  var indiceTaglio  = numElementi; // default: se non trova il marcatore, copia tutto

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
      if (testoElemento.indexOf("---PAGE BREAK---") !== -1) continue; // salta eventuali marcatori residui
      body.appendParagraph(elemento);
    } else if (tipo === DocumentApp.ElementType.TABLE) {
      body.appendTable(elemento);
    } else if (tipo === DocumentApp.ElementType.LIST_ITEM) {
      body.appendListItem(elemento);
    }
  }

  // ── 3) Compila i placeholder della sezione Privacy SOLO per questo venditore ──
  _compilaPlaceholderPrivacyAmlSingolo(body, dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif);

  docCopia.saveAndClose();

  // ── 3-bis) Genera SEPARATAMENTE il documento AML+Scheda Rischio (uso interno, mai al cliente) ──
  try {
    _generaDocumentoAmlRiservato(dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif, idModelloPrivacyAml, indiceTaglio, numElementi, nomeFile);
  } catch(eAml) {
    console.log("Errore generazione AML riservato: " + eAml);
  }

  // ── 4) Esporta come UN PDF nativo unico ───────────────────
  var pdfBlob = fileCopia.getAs(MimeType.PDF);
  var filePdf = DriveApp.createFile(pdfBlob);
  filePdf.setName(nomeFile + ".pdf");
  filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var urlPdf = "https://drive.google.com/uc?export=download&id=" + filePdf.getId();
  fileCopia.setTrashed(true);

  // ── 5) Token documento protetto — scadenza A 11 MESI ──────
  var tokenLink = Utilities.getUuid().substring(0,12).toUpperCase();
  PropertiesService.getScriptProperties().setProperty(
    "DOC_" + tokenLink,
    JSON.stringify({ url: urlPdf, scadenza: new Date().getTime() + DURATA_LINK_DOCUMENTO_MS, usato: 0 })
  );

  return { urlPdf: urlPdf, fileIdPdf: filePdf.getId(), tokenLink: tokenLink };
}

/**
 * Genera UN documento AML+Scheda Rischio per il singolo venditore, SEPARATO dal
 * PDF che riceve il cliente. Viene archiviato in una cartella Drive riservata
 * (ARCHIVIO_AML_RISERVATO) e NON è mai inviato via WhatsApp né condiviso col cliente.
 */
function _generaDocumentoAmlRiservato(dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif, idModelloPrivacyAml, indiceTaglio, numElementiTotali, nomeFileBase) {
  var nomeFileAml = "AML_RISERVATO_" + nomeFileBase;

  var fileCopiaAml = DriveApp.getFileById(idModelloPrivacyAml).makeCopy(nomeFileAml);
  var docAml       = DocumentApp.openById(fileCopiaAml.getId());
  var bodyAml      = docAml.getBody();

  // Pulisce il body (la copia parte identica al Doc2 completo: Privacy+AML+Scheda)
  // e ricostruisce SOLO dalla sezione AML in avanti (dopo il marcatore di taglio)
  var bodyOrigine = DocumentApp.openById(idModelloPrivacyAml).getBody();

  // Rimuove tutti gli elementi della copia tranne il primo (Apps Script richiede
  // che il body abbia sempre almeno un paragrafo)
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
        // copia anche formattazione base se presente
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

  // Compila i placeholder AML/Scheda Rischio con i dati del venditore corrente
  _compilaPlaceholderPrivacyAmlSingolo(bodyAml, dati, venditoreCorrente, dataContratto, dataOraOtp, tokenRif);

  docAml.saveAndClose();

  // Esporta come PDF e archivia in cartella RISERVATA (non condivisa col cliente)
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
    // NIENTE setSharing: il file resta privato, accessibile solo dall'account agenzia
    return fileFinaleAml.getId();
  } catch(eArchivio) {
    console.log("Errore archiviazione AML riservato: " + eArchivio);
    return filePdfAml.getId();
  }
}

/** Placeholder comuni a tutti i venditori (dati incarico, prezzo, immobile) */
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

/** Inserisce la tabella COMPLETA di tutti i venditori (Doc1 - Incarico) */
function _inserisciTabellaVenditoriCompleta(body, venditori, dataOraOtp, tokenRif, tipoFirma) {
  var quotaAuto   = venditori.length > 0 ? (100/venditori.length).toFixed(2)+"%" : "100%";
  var tabellaVend = _pulisciEInserisciTabella(body,"{{TABELLA_VENDITORI}}");
  if (!tabellaVend || !venditori.length) return;

  var hdr = tabellaVend.appendTableRow();
  ["VENDITORE","DATI ANAGRAFICI","COD. FISCALE","QUOTA","F. INCARICO","F. ECONOMICA","F. PRIVACY","F. AML"].forEach(function(t) {
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

    var logOtp = "\n"+dataOraOtp+"\n+"+(v.telefono||"")+"\nIC-"+tokenRif+"_"+(i+1);

    _iniettaFirmaCella(riga, v.firmaIncarico  || v.firma || v.firmaRemota || "", logOtp, "INC",  tipoFirma);
    _iniettaFirmaCella(riga, v.firmaEconomica || "",                              logOtp, "ECO",  tipoFirma);
    _iniettaFirmaCella(riga, v.firmaPrivacy   || "",                              logOtp, "PRIV", tipoFirma);
    _iniettaFirmaCella(riga, v.firmaAml       || "",                              logOtp, "AML",  tipoFirma);
  });
}

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

/** Compila la sezione Privacy/AML SOLO con i dati del venditore specifico */
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

  // Dati anagrafici SOLO del venditore corrente (non tutta la tabella)
  var datiAnagrafici =
    (venditoreCorrente.nome||"").toUpperCase() +
    ", nato/a il " + (venditoreCorrente.dataNascita||"") + " a " + (venditoreCorrente.luogoNascita||"").toUpperCase() +
    ", C.F. " + (venditoreCorrente.cf||"").toUpperCase() +
    ", residente in " + (venditoreCorrente.residenza||"").toUpperCase() +
    ", tel. +" + (venditoreCorrente.telefono||"");

  body.replaceText("{{TABELLA_VENDITORI}}", datiAnagrafici);
  body.replaceText("{{TABELLA_CATASTO}}", (dati.catasto && dati.catasto[0]) ? (dati.catasto[0].descrizione||"") : "");

  // AML (dati compilati dall'agente, comuni all'incarico)
  body.replaceText("{{AML_NATURA_GIURIDICA}}", dati.aml_natura_giuridica || "Persona fisica (Basso)");
  body.replaceText("{{AML_AREA_GEO}}",         dati.aml_area_geo         || "Italia (Basso)");
  body.replaceText("{{AML_COMPORTAMENTO}}",    dati.aml_comportamento    || "Nella norma (Basso)");
  body.replaceText("{{AML_ORIGINE_FONDI}}",    dati.aml_origine_fondi    || "Patrimonio personale (Basso)");
  body.replaceText("{{AML_FREQUENZA}}",        dati.aml_frequenza        || "Occasionale (Basso)");
  body.replaceText("{{AML_CONGRUITA}}",        dati.aml_congruita        || "Congrua (Basso)");
  body.replaceText("{{AML_PROFILO_FINALE}}",   dati.aml_profilo_finale   || "BASSO");
  body.replaceText("{{AML_MOTIVAZIONE}}",      dati.aml_note_motivazione || "Valutazione eseguita in conformità al D.Lgs 231/2007.");

  // Nuovi campi AML: attività economica, PEP, scopo operazione
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

  // Firme Privacy e AML SOLO di questo venditore
  var logOtp = "\n"+dataOraOtp+"\n+"+(venditoreCorrente.telefono||"")+"\nIC-"+tokenRif;
  _iniettaFirmaInline(body, "{{FIRMA_PRIVACY_1}}", venditoreCorrente.firmaPrivacy || "", logOtp);
  _iniettaFirmaInline(body, "{{FIRMA_AML_1}}",     venditoreCorrente.firmaAml     || "", logOtp);

  // Firma agente nella sezione Privacy/AML (scheda rischio)
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
// 5. FIRMA REMOTA — GENERA LINK
// ════════════════════════════════════════════════════════════
function generaLinkFirmaRemotaIncarico(datiIncarico) {
  try {
    var uuid = Utilities.getUuid();
    PropertiesService.getScriptProperties().setProperty("INCARICO_FIRMA_"+uuid, JSON.stringify(datiIncarico));
    return { successo:true, token:uuid, urlBase:ScriptApp.getService().getUrl() };
  } catch(e) { return { successo:false, messaggio:e.toString() }; }
}

// ════════════════════════════════════════════════════════════
// 6. FIRMA REMOTA — FINALIZZA 4 FIRME
// ════════════════════════════════════════════════════════════
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

    if (tuttiHannoFirmatoTutto) {
      var res = salvaDatiIncarico(dati);
      if (res.successo) PropertiesService.getScriptProperties().deleteProperty(chiave);
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
// 7. OTP
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

// ════════════════════════════════════════════════════════════
// 8. OCR CARTA IDENTITÀ
// ════════════════════════════════════════════════════════════
function processaFotoCartaIdentitaIncarico(base64Data, indiceVenditore) {
  if (typeof processaFotoCartaIdentita === "function") {
    return processaFotoCartaIdentita(base64Data, indiceVenditore);
  }
  return { successo:false, ocrSuccesso:false, messaggio:"Funzione OCR non disponibile. Compila manualmente." };
}

// ════════════════════════════════════════════════════════════
// 9. PAGINA FIRMA REMOTA — SERVE HTML FirmaIncarico
// ════════════════════════════════════════════════════════════
function paginaFirmaRemotaIncarico(token, vendIndex) {
  var chiave   = "INCARICO_FIRMA_"+token;
  var datiJson = PropertiesService.getScriptProperties().getProperty(chiave);
  var nomeDef="Venditore", telDef="", cfDef="", residDef="", nascDef="", luogoDef="";
  var prezzoDef=0, provvDef=null, indirizzoDef="";

  if (datiJson) {
    var dati = JSON.parse(datiJson);
    var idx  = parseInt(vendIndex,10);
    if (dati.venditori && dati.venditori[idx]) {
      var v    = dati.venditori[idx];
      nomeDef  = v.nome         || "Venditore";
      telDef   = v.telefono     || "";
      cfDef    = v.cf           || "";
      residDef = v.residenza    || "";
      nascDef  = v.dataNascita  || "";
      luogoDef = v.luogoNascita || "";
    }
    prezzoDef     = parseFloat(String(dati.prezzoVendita||"0").replace(/\./g,'').replace(',','.')) || 0;
    provvDef      = calcolaProvvigioneAutomatica(prezzoDef);
    indirizzoDef  = (dati.catasto && dati.catasto[0]) ? (dati.catasto[0].descrizione || "") : "";
  }

  var tmpl = HtmlService.createTemplateFromFile('FirmaIncarico');
  tmpl.nomeCliente            = nomeDef;
  tmpl.telefonoCliente        = telDef;
  tmpl.cfCliente              = cfDef;
  tmpl.residenzaCliente       = residDef;
  tmpl.nascitaCliente         = nascDef;
  tmpl.luogoCliente           = luogoDef;
  tmpl.token                  = token;
  tmpl.cliIndex                = vendIndex;
  tmpl.prezzoVendita          = prezzoDef;
  tmpl.provvigioneImponibile  = provvDef ? provvDef.imponibile : 0;
  tmpl.provvigioneIva         = provvDef ? provvDef.iva : 0;
  tmpl.provvigioneTotale      = provvDef ? provvDef.totale : 0;
  tmpl.provvigioneTipo        = provvDef ? provvDef.tipo : "FISSO";
  tmpl.indirizzoImmobile      = indirizzoDef;
  tmpl.idModelloFacSimile     = (typeof CONFIG !== 'undefined' && CONFIG.ID_MODELLO_INC) ? CONFIG.ID_MODELLO_INC : (typeof ID_MODELLO_INC !== 'undefined' ? ID_MODELLO_INC : "");
  tmpl.idModelloFacSimile2    = ID_MODELLO_PRIVACY_AML;

  return tmpl.evaluate()
    .setTitle("Firma Incarico di Vendita — Immobiliare Giancani")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

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
// 10. SISTEMA BOZZE INCARICHI (auto-save + ripresa lavoro)
// ════════════════════════════════════════════════════════════

/** Crea/resetta il foglio BOZZE_INCARICHI */
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

/**
 * Salva o aggiorna una bozza incarico. Se idBozza è vuoto/null, ne crea una nuova
 * e restituisce il nuovo ID; altrimenti aggiorna la riga esistente.
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
    return lista.reverse(); // più recenti prima
  } catch(e) { return []; }
}

/** Recupera i dati completi (JSON) di una bozza specifica, per precompilare il form */
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

/** Segna una bozza come completata (es. dopo aver generato il PDF finale) */
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

// ════════════════════════════════════════════════════════════
// 11. LETTURA BOZZE (legacy, mantenuta per compatibilità)
// ════════════════════════════════════════════════════════════
function leggiBozzeIncarichi() {
  try {
    var ss    = SpreadsheetApp.openById(typeof ID_SHEET_INC !== 'undefined' ? ID_SHEET_INC : ID_SHEET);
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

// ════════════════════════════════════════════════════════════
// 12. HELPER PRIVATI
// ════════════════════════════════════════════════════════════

function _formatEuro(n) {
  if (!n || isNaN(n)) return "0,00 €";
  return n.toLocaleString("it-IT",{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
}

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

function _ottieniOCreaCrt(parent, nome) {
  var iter = parent ? parent.getFoldersByName(nome) : DriveApp.getFoldersByName(nome);
  if (iter.hasNext()) return iter.next();
  return parent ? parent.createFolder(nome) : DriveApp.createFolder(nome);
}

function _salvaStoricoIncarichi(dati, dataFormattata, urlPdfArray, scadenzaStr, provvPct, provvEuro, provvTipo) {
  var ss    = SpreadsheetApp.openById("19m1cStsqyCvzz3-AYFJKPnrLPNaDuCXEKM8Fka76-Hc");
  var sheet = ss.getSheetByName("STORICO_INCARICHI");
  if (!sheet) return;

  var riga = [dataFormattata, dati.agente||"", dati.luogoFirma||"Favara (AG)"];

  for (var i=0; i<4; i++) {
    var v = dati.venditori && dati.venditori[i] ? dati.venditori[i] : {nome:"",cf:"",telefono:""};
    var quota = v.quota || (dati.venditori ? (100/dati.venditori.length).toFixed(2)+"%" : "100%");
    riga.push(v.nome||"", v.cf||"", v.telefono||"", quota);
  }

  riga.push(dati.catasto_tipo||"FABBRICATI");
  for (var i=0; i<3; i++) {
    var c = dati.catasto && dati.catasto[i] ? dati.catasto[i] : {foglio:"",particella:"",sub:"",prezzo:""};
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
    "ATTIVO"
  );

  sheet.appendRow(riga);
}

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

/** Invia a OGNI venditore il SUO link/pdf personale (non quello degli altri) */
function _inviaLinkVenditoriPersonali(venditori, urlPdfArray) {
  if (!venditori || !venditori.length) return;
  venditori.forEach(function(v, i) {
    if (!v.telefono) return;
    var tel = v.telefono.replace(/\D/g,'');
    if (!tel.startsWith('39') && tel.length === 10) tel = '39' + tel;
    var urlPersonale = urlPdfArray[i] || urlPdfArray[0];
    var msg = "🏡 *IMMOBILIARE GIANCANI*\n\nGentile *"+(v.nome||"")+"*,\n\ngrazie per aver conferito l'incarico di vendita.\n\n📄 La tua copia personale del contratto (Incarico + Privacy + AML):\n"+urlPersonale+"\n\n_Il link rimarrà attivo per 11 mesi._\n\n_Agenzia Immobiliare Giancani — Favara (AG)_\n📞 wa.me/393201667156";
    try {
      if (typeof _inviaMetaWhatsApp === "function") _inviaMetaWhatsApp(tel, msg);
    } catch(e) { console.log("Errore WA: "+e); }
  });
}

// ════════════════════════════════════════════════════════════
// 13. PAGINA PANNELLO BOZZE INCARICHI (dedicato, separato da Visite)
// ════════════════════════════════════════════════════════════
function paginaBozzeIncarichi() {
  var tpl = HtmlService.createTemplateFromFile('BozzeIncarichi');
  tpl.WEBAPP_URL = ScriptApp.getService().getUrl();
  return tpl.evaluate()
    .setTitle("Bozze Incarichi — Immobiliare Giancani")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
}

