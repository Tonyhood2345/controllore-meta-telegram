// ==========================================

function OttieniDatiReportVenditore(ticket) {
  try {
    let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName("REPORT_VENDITORI");
    if (!sheet) return null;
    let dati = sheet.getDataRange().getValues();
    for (let i = 1; i < dati.length; i++) {
      if (String(dati[i][0]) === String(ticket)) {
        let dataInvio = dati[i][4];
        let giorni = dataInvio ? Math.floor((new Date() - new Date(dataInvio)) / 86400000) : 0;
        return {
          ticket: dati[i][0],
          indirizzo: dati[i][3] || "Immobile",
          visiteSocial: dati[i][6] || 0,
          visiteLoco: dati[i][7] || 0,
          documenti: dati[i][8] || 0,
          notaAndamento: dati[i][9] || "Nessuna nota disponibile.",
          giorniLancio: giorni,
          ttViews: 0, fbViews: dati[i][6] || 0, igViews: 0, ytViews: 0, immobViews: 0, ideaViews: 0
        };
      }
    }
    return null;
  } catch(e) { return null; }
}
function OttieniDatiReels() {
  try {
    var SS_ID = PropertiesService.getScriptProperties().getProperty('ID_FOGLIO_REELS');
    if (!SS_ID) return "ERRORE: Configurazione di sicurezza mancante (ID_FOGLIO_REELS).";

    var ss = SpreadsheetApp.openById(SS_ID);
    var sheet = ss.getSheets()[0]; 
    var dati = sheet.getDataRange().getValues();
    
    if (dati.length < 2) return [];
    
    // Mappatura Rigida Indici Colonne
    var idxCitta = 24; // Colonna Y
    var idxDida  = 4;  // Colonna E (Descrizione)
    var idxFb    = 16; // Colonna Q (Link Facebook)
    var idxIg    = 17; // Colonna R (Link Instagram)
    var idxYt    = 18; // Colonna S (Link YouTube)
    var indiciFoto = [25, 26, 27, 28, 29]; // Z, AA, AB, AC, AD

    var fotoFallback = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1280&q=80";
    var results = [];
    
    for (var i = 1; i < dati.length; i++) {
      try {
        var riga = dati[i];
        if (!riga) continue;

        var valFb = (riga[idxFb] || "").toString().trim();
        var valIg = (riga[idxIg] || "").toString().trim();
        var valYt = (riga[idxYt] || "").toString().trim();

        if (!valFb.startsWith("http") && !valIg.startsWith("http") && !valYt.startsWith("http")) continue;

        // 🎯 RIMOZIONE DOPPIONI: Carica solo link di immagini uniche e distinte
        var galleriaFoto = [];
        indiciFoto.forEach(function(idx) {
          var f = (riga[idx] || "").toString().trim();
          if (f.startsWith("http") && galleriaFoto.indexOf(f) === -1) {
            galleriaFoto.push(f);
          }
        });

        if (galleriaFoto.length === 0) galleriaFoto.push(fotoFallback);

        var idVideoYt = "";
        if (valYt && valYt.includes("youtu")) {
          var ytMatch = valYt.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^?&"'>]+)/);
          if (ytMatch && ytMatch[1]) idVideoYt = ytMatch[1];
        }

        results.push({
          id: i,
          citta: (riga[idxCitta] || "Favara").toString().trim(),
          didascalia: (riga[idxDida] || "Soluzione Immobiliare. Dettagli in agenzia.").toString().trim(),
          imgs: galleriaFoto, 
          ytId: idVideoYt,
          fb: valFb.startsWith("http") ? valFb : "",
          ig: valIg.startsWith("http") ? valIg : "",
          ytLink: valYt.startsWith("http") ? valYt : ""
        });
      } catch (e) { continue; }
    }
    return results;
  } catch (e) { return "ERRORE: " + e.toString(); }
}


