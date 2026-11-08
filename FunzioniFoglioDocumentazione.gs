// ==========================================

// ══════════════════════════════════════════════════════════════════════════════
// FOGLIO DOCUMENTAZIONE — Sistema Autorizzazione Consegna Documenti Immobile
// File: FunzioniFoglioDocumentazione.gs
// Sviluppato per: Antonio Giancani — Agenzia Immobiliare Giancani, Favara (AG)
//
// ⚠️ SETUP OBBLIGATORIO PRIMA DI USARE:
//    1. Crea un Google Doc copiando il testo del modulo (vedi istruzioni sotto)
//    2. Incolla l'ID del Doc nella costante ID_DOC_MODELLO_DOCUMENTAZIONE
//    3. Esegui la funzione  inizializzaRegistroDocumentazione()  una volta sola
//
// PLACEHOLDER NECESSARI NEL GOOGLE DOC TEMPLATE:
//   {{AGENTE}} {{DATA_OGGI}} {{LUOGO_FIRMA}}
//   {{ACQUIRENTE_NOME}} {{DATA_NASCITA}} {{LUOGO_NASCITA}} {{CF}} {{RESIDENZA}}
//   {{CITTA_IMMOBILE}} {{VIA_IMMOBILE}} {{TIPO_IMMOBILE}} {{DESCRIZIONE}}
//   {{PREZZO}} {{INCARICO}}
//   {{EMAIL_RICEZIONE}} {{TELEFONO_RICEZIONE}} {{CONDIVISIONE_RICEZIONE}} {{CARTACEA_RICEZIONE}}
//   {{STATO_GDPR}} {{OTP_DATA_ORA}} {{OTP_TELEFONO}} {{OTP_RIFERIMENTO}}
//   {{DOC_ACQUIRENTE}} {{FIRMA_AGENTE}} {{ALLEGATI_DOCUMENTI}}
// ══════════════════════════════════════════════════════════════════════════════


const SHEET_REG_DOC                 = "REGISTRO_DOCUMENTAZIONE";
const SHEET_BOZZE_DOC               = "BOZZE_DOCUMENTAZIONE";
const FOLDER_DOC_GIANCANI           = "📁 ARCHIVIO_DOCUMENTAZIONE_GIANCANI";

/* ════════════════════════════════════════════════════════════════════════════
   INIT — Crea i fogli Google Sheet la prima volta
   ════════════════════════════════════════════════════════════════════════════ */
function inizializzaRegistroDocumentazione() {
  try {
    var sheetId = (typeof CONFIG !== 'undefined' && CONFIG.LOG_SHEET_ID)
      ? CONFIG.LOG_SHEET_ID : ID_STORICO_FOGLIO;
    var ss = SpreadsheetApp.openById(sheetId);

    // ── REGISTRO DOCUMENTAZIONE ──
    var sheetReg = ss.getSheetByName(SHEET_REG_DOC);
    if (!sheetReg) {
      sheetReg = ss.insertSheet(SHEET_REG_DOC);
      sheetReg.appendRow([
        "DATA_ORA","AGENTE","LUOGO","DATA_DOC",
        "ACQ_NOME","ACQ_NASCITA","ACQ_LUOGO","ACQ_SESSO","ACQ_CF","ACQ_RESIDENZA",
        "ACQ_TELEFONO","ACQ_EMAIL","OTP_STATUS",
        "IMM_TIPO","IMM_CITTA","IMM_VIA","IMM_PREZZO","IMM_INCARICO","IMM_DESCRIZIONE",
        "MOD_EMAIL","MOD_TEL","MOD_CONDIVISIONE","MOD_CARTACEA",
        "GDPR_CONSENSO","TIPO_FIRMA","STATO",
        "URL_PDF","FIRMA_BASE64","FOTO_DOC_IDS"
      ]);
    }

    // ── BOZZE DOCUMENTAZIONE ──
    var sheetBozze = ss.getSheetByName(SHEET_BOZZE_DOC);
    if (!sheetBozze) {
      sheetBozze = ss.insertSheet(SHEET_BOZZE_DOC);
      sheetBozze.appendRow(["ID_BOZZA","DATA_ORA","AGENTE","DATI_JSON","STATO"]);
    }

    return "✅ Registro Documentazione inizializzato con successo. Antonio Giancani.";
  } catch(e) {
    return "❌ Errore init: " + e.toString() + ". Antonio Giancani.";
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   ottieniDatiInizialiDocumentazione
   Restituisce la lista immobili dal DB per il form
   ════════════════════════════════════════════════════════════════════════════ */
function ottieniDatiInizialiDocumentazione() {
  return leggiImmobiliDatabase(); // Riusa funzione esistente del Foglio Visita
}

/* ════════════════════════════════════════════════════════════════════════════
   uploadFotoDocIdentitaDoc
   Salva su Drive una singola foto del documento identità del cliente
   Input : base64 (stringa con o senza header data:), nomeFile, nomeCliente
   Output: { successo, fileId, urlPreview, messaggio }
   ════════════════════════════════════════════════════════════════════════════ */
function uploadFotoDocIdentitaDoc(base64, nomeFile, nomeCliente) {
  try {
    var base64Puro = base64.includes(',') ? base64.split(',')[1] : base64;
    var mimeType   = base64.includes('data:')
      ? base64.split(';')[0].replace('data:','') : 'image/jpeg';

    var rootDir   = _ottieniOCreaCrtDoc(null, FOLDER_DOC_GIANCANI);
    var fotoDir   = _ottieniOCreaCrtDoc(rootDir, "🪪 FOTO_DOCUMENTI_IDENTITA");
    var nomeSafe  = (nomeCliente || "CLIENTE").replace(/[^a-zA-Z0-9 ]/g, '').toUpperCase().trim();
    var cliDir    = _ottieniOCreaCrtDoc(fotoDir, nomeSafe || "CLIENTE");

    var ts        = Utilities.formatDate(new Date(), "Europe/Rome", "yyyyMMdd_HHmmss");
    var nomeFisico = "DOC_" + ts + "_" + (nomeFile || "foto").toUpperCase().replace(/\s+/g,"_");
    var blob       = Utilities.newBlob(Utilities.base64Decode(base64Puro), mimeType, nomeFisico);
    var file       = cliDir.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return {
      successo:   true,
      fileId:     file.getId(),
      urlPreview: "https://drive.google.com/uc?export=view&id=" + file.getId(),
      messaggio:  "Foto archiviata su Drive. Antonio Giancani."
    };
  } catch(e) {
    return { successo: false, messaggio: "Errore upload foto: " + e.toString() + ". Antonio Giancani." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   inviaOtpDocumentazione / verificaOtpDocumentazione
   Wrapper che riusa il sistema OTP esistente del Foglio Visita
   ════════════════════════════════════════════════════════════════════════════ */
function inviaOtpDocumentazione(telefono, nome) {
  return inviaOtpVisitaReale(telefono, nome);
}
function verificaOtpDocumentazione(telefono, otp) {
  return verificaOTPFoglioVisita(telefono, otp);
}

/* ════════════════════════════════════════════════════════════════════════════
   generaLinkFirmaRemotaDoc
   Crea token + link per la firma remota del Foglio Documentazione
   Input : pacchetto { agente, luogoFirma, dataDoc, acquirente, immobile,
                       modalitaRicezione, gdprConsensus, fotoDocIds }
   Output: { successo, urlBase, token, messaggio }
   ════════════════════════════════════════════════════════════════════════════ */
function generaLinkFirmaRemotaDoc(pacchetto) {
  try {
    var token    = Utilities.getUuid();
    var scadenza = new Date().getTime() + 48 * 60 * 60 * 1000; // 48 ore

    var payload = {
      agente:             pacchetto.agente             || "Antonio Giancani",
      luogoFirma:         pacchetto.luogoFirma         || "Favara (AG)",
      dataDoc:            pacchetto.dataDoc            || "",
      acquirente:         pacchetto.acquirente         || {},
      immobile:           pacchetto.immobile           || {},
      modalitaRicezione:  pacchetto.modalitaRicezione  || {},
      gdprConsensus:      pacchetto.gdprConsensus      || "presta",
      tipoFirma:          "remota",
      fotoDocIds:         pacchetto.fotoDocIds         || [],
      timestampCreazione: new Date().getTime(),
      scadenza:           scadenza
    };

    PropertiesService.getScriptProperties()
      .setProperty('FIRMA_DOC_' + token, JSON.stringify(payload));

    return {
      successo:  true,
      urlBase:   getWebAppUrl(),
      token:     token,
      messaggio: "Link firma documentazione generato. Antonio Giancani."
    };
  } catch(e) {
    return { successo: false, messaggio: e.toString() + ". Antonio Giancani." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   ottieniTimestampCreazioneFirmaDoc
   Usato dalla pagina firma remota per il timer legale (come nel Foglio Visita)
   ════════════════════════════════════════════════════════════════════════════ */
function ottieniTimestampCreazioneFirmaDoc(token) {
  try {
    var raw = PropertiesService.getScriptProperties().getProperty("FIRMA_DOC_" + token);
    if (!raw) return { successo: false, errore: "Token non trovato. Antonio Giancani." };
    var dati = JSON.parse(raw);
    return { successo: true, timestampCreazione: dati.timestampCreazione || 0, dati: dati };
  } catch(e) {
    return { successo: false, errore: e.toString() + ". Antonio Giancani." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   finalizzaFirmaRemotaDoc
   Riceve la firma del cliente dalla pagina remota e salva tutto
   ════════════════════════════════════════════════════════════════════════════ */
function finalizzaFirmaRemotaDoc(token, firmaBase64) {
  try {
    var chiave   = "FIRMA_DOC_" + token;
    var datiJson = PropertiesService.getScriptProperties().getProperty(chiave);
    if (!datiJson) {
      return { successo: false, messaggio: "Sessione scaduta o non valida. Antonio Giancani." };
    }

    var dati = JSON.parse(datiJson);
    dati.acquirente.signature   = firmaBase64;
    dati.acquirente.otpVerified = true;

    var res = salvaFoglioDocumentazioneCompleto(dati);
    if (res.successo) {
      PropertiesService.getScriptProperties().deleteProperty(chiave);
      return {
        successo:       true,
        completato:     true,
        urlPdf:         res.urlPdf,
        urlPdfCliente:  res.urlPdfCliente
      };
    } else {
      return { successo: false, messaggio: "Errore salvataggio: " + res.errore + ". Antonio Giancani." };
    }
  } catch(e) {
    return { successo: false, messaggio: "Crash firma remota: " + e.toString() + ". Antonio Giancani." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   salvaDatiFoglioDocumentazione
   Wrapper pubblico per la firma in presenza (digitale o cartacea)
   ════════════════════════════════════════════════════════════════════════════ */
function salvaDatiFoglioDocumentazione(pacchetto) {
  return salvaFoglioDocumentazioneCompleto(pacchetto);
}

/* ════════════════════════════════════════════════════════════════════════════
   salvaFoglioDocumentazioneCompleto
   Core: registra sul Google Sheet e genera il PDF reale
   ════════════════════════════════════════════════════════════════════════════ */
function salvaFoglioDocumentazioneCompleto(dati) {
  try {
    var sheetId = (typeof CONFIG !== 'undefined' && CONFIG.LOG_SHEET_ID)
      ? CONFIG.LOG_SHEET_ID : ID_STORICO_FOGLIO;
    var ss    = SpreadsheetApp.openById(sheetId);
    var sheet = ss.getSheetByName(SHEET_REG_DOC);
    if (!sheet) { inizializzaRegistroDocumentazione(); sheet = ss.getSheetByName(SHEET_REG_DOC); }

    // Genera PDF
    var resPdf = _generaPdfDocumentazione(dati);
    var urlPdf  = resPdf.urlPdf;
    var fileId  = resPdf.fileId;

    // URL cliente con scadenza 6 mesi (usa la stessa rotta vedi_pdf esistente)
    var urlClient = getWebAppUrl() + "?page=vedi_pdf&file=" + fileId + "&t=" + new Date().getTime();

    var acq = dati.acquirente        || {};
    var imm = dati.immobile          || {};
    var mod = dati.modalitaRicezione || {};

    sheet.appendRow([
      new Date(),
      dati.agente         || "",
      dati.luogoFirma     || "",
      dati.dataDoc        || "",
      acq.nome            || "",
      acq.dataNascita     || "",
      acq.luogoNascita    || "",
      acq.sesso           || "M",
      acq.cf              || "",
      acq.residenza       || "",
      acq.telefono        || "",
      acq.email           || "",
      acq.otpVerified ? "VERIFICATO" : "DA_VERIFICARE",
      imm.tipo            || "",
      imm.citta           || "",
      imm.via             || "",
      imm.prezzo          || "",
      imm.incarico        || "",
      imm.descrizione     || "",
      mod.email           || "",
      mod.telefono        || "",
      mod.condivisione    || "",
      mod.cartacea ? "SÌ" : "NO",
      dati.gdprConsensus  || "presta",
      dati.tipoFirma      || "digitale",
      "FIRMATO_VALIDATO",
      urlPdf              || "",
      acq.signature       || "",
      JSON.stringify(dati.fotoDocIds || [])
    ]);

    // Notifica Telegram a Antonio
    if (typeof inviaTelegramBoss === "function") {
      inviaTelegramBoss(
        "📋 *DOCUMENTAZIONE FIRMATA*\n" +
        "👤 Acquirente: " + (acq.nome || "N/D") + "\n" +
        "🏠 Immobile: " + (imm.tipo || "") + " in " + (imm.via || "") + ", " + (imm.citta || "") + "\n" +
        "💶 Prezzo: € " + (imm.prezzo || "N/D") + "\n" +
        "✍️ Firma: " + (dati.tipoFirma || "N/D") + "\n" +
        "📄 PDF: " + urlPdf + "\n\nAntonio Giancani"
      );
    }

    // Notifica WhatsApp a Antonio con CTA link PDF
    if (typeof CONFIG !== 'undefined' && CONFIG.META_PHONE_ID && urlPdf) {
      try {
        var payloadWa = {
          messaging_product: 'whatsapp', recipient_type: 'individual',
          to: CONFIG.ANTONIO_CHAT_ID, type: 'interactive',
          interactive: {
            type: 'cta_url',
            body: { text: "📋 *FOGLIO DOCUMENTAZIONE FIRMATO*\n👤 " + (acq.nome || "N/D") + "\n🏠 " + (imm.via || "") + ", " + (imm.citta || "") },
            action: { name: 'cta_url', parameters: { display_text: "📄 Apri PDF Documentazione", url: urlPdf } }
          }
        };
        UrlFetchApp.fetch('https://graph.facebook.com/v21.0/' + CONFIG.META_PHONE_ID + '/messages', {
          method: 'post', contentType: 'application/json',
          headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
          payload: JSON.stringify(payloadWa), muteHttpExceptions: true
        });
      } catch(eWa) { console.log("Errore notifica WA: " + eWa); }
    }

    return {
      successo:         true,
      urlPdf:           urlPdf,
      urlPdfCliente:    urlClient,
      telefonoCliente:  acq.telefono || "",
      messaggio:        "Documentazione registrata correttamente. Antonio Giancani."
    };
  } catch(err) {
    return { successo: false, errore: err.toString() + ". Antonio Giancani." };
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   _generaPdfDocumentazione — Compila Google Doc + esporta PDF
   ════════════════════════════════════════════════════════════════════════════ */
function _generaPdfDocumentazione(dati) {
  var acq = dati.acquirente        || {};
  var imm = dati.immobile          || {};
  var mod = dati.modalitaRicezione || {};

  var nomeAcq  = acq.nome || "Acquirente";
  var nomeFile = "FoglioDoc_" + nomeAcq.replace(/\s+/g,"_").toUpperCase() + "_" + new Date().getTime();

  var fileCopia = DriveApp.getFileById(ID_DOC_MODELLO_DOCUMENTAZIONE).makeCopy(nomeFile);
  var docCopia  = DocumentApp.openById(fileCopia.getId());
  var body      = docCopia.getBody();

  // Formattazione date
  var dataFormattata = dati.dataDoc
    ? dati.dataDoc.split('-').reverse().join('/')
    : Utilities.formatDate(new Date(), "Europe/Rome", "dd/MM/yyyy");
  var dataOraOtp = Utilities.formatDate(new Date(), "Europe/Rome", "dd/MM/yyyy HH:mm:ss");
  var tokenRif   = "FD-" + Utilities.getUuid().substring(0, 8).toUpperCase();

  // ── Placeholder principali ──
  body.replaceText("{{AGENTE}}",           dati.agente       || "Antonio Giancani");
  body.replaceText("{{DATA_OGGI}}",        dataFormattata);
  body.replaceText("{{LUOGO_FIRMA}}",      dati.luogoFirma   || "Favara (AG)");
  body.replaceText("{{ACQUIRENTE_NOME}}",  (acq.nome || "").toUpperCase());
  body.replaceText("{{DATA_NASCITA}}",     acq.dataNascita   || "");
  body.replaceText("{{LUOGO_NASCITA}}",    (acq.luogoNascita || "").toUpperCase());
  body.replaceText("{{CF}}",              (acq.cf            || "").toUpperCase());
  body.replaceText("{{RESIDENZA}}",       (acq.residenza     || "").toUpperCase());
  body.replaceText("{{CITTA_IMMOBILE}}",  (imm.citta         || "").toUpperCase());
  body.replaceText("{{VIA_IMMOBILE}}",    (imm.via           || "").toUpperCase());
  body.replaceText("{{TIPO_IMMOBILE}}",    imm.tipo          || "");
  body.replaceText("{{DESCRIZIONE}}",      imm.descrizione   || "");
  body.replaceText("{{PREZZO}}",           imm.prezzo        || "");
  body.replaceText("{{INCARICO}}",         imm.incarico      || "");

  // ── Modalità ricezione ──
  body.replaceText("{{EMAIL_RICEZIONE}}",        mod.email        ? "✓ " + mod.email        : "—");
  body.replaceText("{{TELEFONO_RICEZIONE}}",     mod.telefono     ? "✓ +" + mod.telefono    : "—");
  body.replaceText("{{CONDIVISIONE_RICEZIONE}}", mod.condivisione ? "✓ " + mod.condivisione : "—");
  body.replaceText("{{CARTACEA_RICEZIONE}}",     mod.cartacea     ? "✓ Forma Cartacea"      : "");

  // ── GDPR ──
  body.replaceText("{{STATO_GDPR}}",
    dati.gdprConsensus === "presta" ? "✓ PRESTA IL CONSENSO" : "✗ NON PRESTA IL CONSENSO"
  );

  // ── OTP & riferimento ──
  body.replaceText("{{OTP_DATA_ORA}}",     dataOraOtp);
  body.replaceText("{{OTP_TELEFONO}}",     acq.telefono || "");
  body.replaceText("{{OTP_RIFERIMENTO}}", tokenRif);

  // ── Firma acquirente ──
  _iniettaFirmaDocAcquirente(
    body, "{{DOC_ACQUIRENTE}}", acq,
    dataOraOtp + "\n+" + (acq.telefono || "") + "\n" + tokenRif,
    dati.tipoFirma
  );

  // ── Firma agente (riusa funzione esistente del Foglio Visita) ──
  _inserisciFirmaAgenteVisita(body, dati.agente || "Antonio Giancani");

  // ── Allegati foto documento identità ──
  var elemAll = body.findText("{{ALLEGATI_DOCUMENTI}}");
  if (elemAll) {
    var paraAll = elemAll.getElement().getParent().asParagraph();
    paraAll.replaceText("{{ALLEGATI_DOCUMENTI}}", "DOCUMENTI DI IDENTITÀ ALLEGATI DIGITALMENTE:");

    var fotoIds    = dati.fotoDocIds || [];
    var fotoOk     = false;
    fotoIds.forEach(function(fid, idx) {
      if (!fid) return;
      try {
        var blobFoto = DriveApp.getFileById(fid).getBlob();
        var posBase  = body.getChildIndex(paraAll);

        var pTitolo = body.insertParagraph(posBase + 1 + (idx * 2), "■ Documento Identità — Pagina " + (idx + 1) + " di " + fotoIds.length);
        pTitolo.editAsText().setBold(true).setFontSize(9).setForegroundColor("#5c061a");

        var pImg = body.insertParagraph(body.getChildIndex(pTitolo) + 1, "");
        var imgEl = pImg.appendInlineImage(blobFoto);
        imgEl.setWidth(380); imgEl.setHeight(250);
        fotoOk = true;
      } catch(ef) { console.log("Errore foto " + idx + ": " + ef); }
    });
    if (!fotoOk) paraAll.appendText("\n(Nessun documento fotografico allegato digitalmente in questa copia.)");
  }

  docCopia.saveAndClose();

  // Export PDF
  var pdfBlob = fileCopia.getAs(MimeType.PDF);
  var filePdf = DriveApp.createFile(pdfBlob);
  filePdf.setName(nomeFile + ".pdf");
  filePdf.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  var urlPdf = "https://drive.google.com/uc?export=download&id=" + filePdf.getId();
  fileCopia.setTrashed(true);

  // Archiviazione strutturata in cartella Anno/Mese
  var idArchiviato = null;
  try {
    var anno   = (dati.dataDoc || "").substring(0, 4) || String(new Date().getFullYear());
    var mese   = (dati.dataDoc || "").substring(5, 7) || String(new Date().getMonth() + 1).padStart(2,'0');
    var mesiNm = {"01":"01-Gennaio","02":"02-Febbraio","03":"03-Marzo","04":"04-Aprile",
                  "05":"05-Maggio","06":"06-Giugno","07":"07-Luglio","08":"08-Agosto",
                  "09":"09-Settembre","10":"10-Ottobre","11":"11-Novembre","12":"12-Dicembre"};
    var rootD  = _ottieniOCreaCrtDoc(null, FOLDER_DOC_GIANCANI);
    var annoD  = _ottieniOCreaCrtDoc(rootD, "Anno " + anno);
    var meseD  = _ottieniOCreaCrtDoc(annoD, mesiNm[mese] || mese);
    var cfP    = acq.cf ? "_" + acq.cf.toUpperCase().trim() : "";
    var datP   = (dati.dataDoc || "").replace(/-/g,"");
    var nomP   = "Doc_" + nomeAcq.replace(/\s+/g,"_").toUpperCase() + "_" + datP + cfP + ".pdf";
    var copiaA = filePdf.makeCopy(nomP, meseD);
    copiaA.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    idArchiviato = copiaA.getId();
  } catch(eA) { console.log("Errore archiviazione: " + eA); }

  return { urlPdf: urlPdf, fileId: idArchiviato || filePdf.getId(), tokenRif: tokenRif };
}

/* ════════════════════════════════════════════════════════════════════════════
   _iniettaFirmaDocAcquirente — inserisce firma immagine o testo OTP nel Doc
   ════════════════════════════════════════════════════════════════════════════ */
function _iniettaFirmaDocAcquirente(body, tag, client, logOtp, tipoFirma) {
  var elem = body.findText(tag);
  if (!elem) return;
  var para = elem.getElement().getParent().asParagraph();

  if (client && client.nome) {
    para.replaceText(tag, " ");
    if (client.signature && client.signature.includes(",")) {
      try {
        var blob = Utilities.newBlob(
          Utilities.base64Decode(client.signature.split(',')[1]),
          "image/png", "firma_doc_" + client.nome.replace(/\s+/g,"_") + ".png"
        );
        var img = para.appendInlineImage(blob);
        img.setWidth(120); img.setHeight(36);
        var log = (tipoFirma === 'remota' ? "\n✓ FIRMATO DA REMOTO CON OTP" : "\n✓ FIRMATO SU SCHERMO") + "\n" + logOtp;
        para.appendText(log).setFontSize(6).setItalic(true).setForegroundColor("#475569");
      } catch(e) {
        para.setText("✓ FIRMATO\n" + logOtp);
        para.editAsText().setFontSize(7).setForegroundColor("#16a34a");
      }
    } else if (tipoFirma === 'remota') {
      para.setText("✓ CONVALIDATO VIA OTP\n" + logOtp);
      para.editAsText().setFontSize(7).setBold(true).setForegroundColor("#16a34a");
    } else if (tipoFirma === 'cartacea') {
      para.setText("✍️ FIRMA AUTOGRAFA RACCOLTA SU MODULO CARTACEO\n" + logOtp);
      para.editAsText().setFontSize(7).setItalic(true).setForegroundColor("#475569");
    } else {
      para.setText("_________________________");
      para.editAsText().setFontSize(8).setForegroundColor("#94a3b8");
    }
  } else {
    body.replaceText(tag, "_________________________");
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   _ottieniOCreaCrtDoc — helper cartelle Drive (locale, non conflitto)
   ════════════════════════════════════════════════════════════════════════════ */
function _ottieniOCreaCrtDoc(parent, nome) {
  var iter = parent ? parent.getFoldersByName(nome) : DriveApp.getFoldersByName(nome);
  if (iter.hasNext()) return iter.next();
  return parent ? parent.createFolder(nome) : DriveApp.createFolder(nome);
}

/* ════════════════════════════════════════════════════════════════════════════
   TEST — esegui dall'editor GAS per verificare il sistema
   ════════════════════════════════════════════════════════════════════════════ */
function testFoglioDocumentazione() {
  var datiTest = {
    agente: "Antonio Giancani",
    luogoFirma: "Favara (AG)",
    dataDoc: "2026-07-02",
    tipoFirma: "digitale",
    gdprConsensus: "presta",
    fotoDocIds: [], // In produzione: array di file ID da Drive
    acquirente: {
      nome: "MARIO ROSSI",
      dataNascita: "01/01/1985",
      luogoNascita: "Favara",
      sesso: "M",
      cf: "RSSMRA85A01A089X",
      residenza: "FAVARA VIA ROMA 1",
      telefono: "3201234567",
      email: "mario@email.com",
      otpVerified: true,
      signature: ""
    },
    immobile: {
      tipo: "Appartamento",
      citta: "Favara",
      via: "Corso Vittorio Veneto 151",
      prezzo: "85.000",
      incarico: "12",
      descrizione: "Appartamento di 80 mq composto da 3 vani + servizi"
    },
    modalitaRicezione: {
      email: "mario@email.com",
      telefono: "3201234567",
      condivisione: "",
      cartacea: false
    }
  };

  Logger.log("=== TEST FOGLIO DOCUMENTAZIONE ===");
  try {
    var res = salvaFoglioDocumentazioneCompleto(datiTest);
    Logger.log("RISULTATO: " + JSON.stringify(res));
    if (res.successo) Logger.log("✅ PDF: " + res.urlPdf);
    else Logger.log("❌ ERRORE: " + res.errore);
  } catch(e) {
    Logger.log("❌ CRASH: " + e.toString() + "\n" + e.stack);
  }
}

