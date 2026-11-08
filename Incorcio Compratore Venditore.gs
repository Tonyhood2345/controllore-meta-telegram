// ==========================================

function IncrocioImmobileSpecifico(rigaTarget) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetImmobili = ss.getSheetByName("DATABASE_IMMOBILI");
    if (!sheetImmobili) return;
    
    const datiImmobili = sheetImmobili.getDataRange().getValues();
    
    // Se non viene passata una riga specifica, prendiamo l'ultima (nuovo inserimento)
    let rigaDaControllare = rigaTarget || datiImmobili.length;
    if (rigaDaControllare <= 1) return;
    
    const immobile = datiImmobili[rigaDaControllare - 1];
    const idImmobile = immobile[0]; // ID_Immobile
    if (!idImmobile) return;
    
    const tipologia = (immobile[3] || "").toString().trim().toLowerCase(); 
    const comune    = (immobile[4] || "").toString().trim().toLowerCase(); 
    const zona      = (immobile[5] || "").toString().trim().toLowerCase(); 
    const prezzo    = parseFloat(immobile[7]) || 0; 
    const linkReel  = immobile[9] || "https://www.immobiliaregiancani.it"; 

    // 🛡️ CONTROLLO ANTI-SPAM INTELLIGENTE (Verifica ID + Prezzo)
    const sheetLog = ss.getSheetByName("Log Agenda");
    let giaInviato = false;
    let stringaLogCercata = `Incrocio inviato per ID: ${idImmobile} - Prezzo: ${prezzo}€`;
    
    if (sheetLog) {
      const datiLog = sheetLog.getDataRange().getValues();
      for (let l = 1; l < datiLog.length; l++) {
        if (datiLog[l][5] && datiLog[l][5].toString().includes(stringaLogCercata)) {
          giaInviato = true;
          break;
        }
      }
    }

    if (giaInviato) {
      Logger.log(`ℹ️ Incrocio per ${idImmobile} con prezzo ${prezzo}€ già notificato.`);
      return; 
    }

    // --- LOGICA DI INCROCIO CON I CLIENTI ---
    const sheetRichieste = ss.getSheetByName("DATABASE_RICHIESTE");
    const datiRichieste = sheetRichieste.getDataRange().getValues();
    const sheetClienti = ss.getSheetByName("DB_CLIENTI");
    const datiClienti = sheetClienti.getDataRange().getValues();
    const mappaClienti = {};
    
    for (let c = 1; c < datiClienti.length; c++) {
      let idC = datiClienti[c][0];
      if (idC) mappaClienti[idC] = { nome: datiClienti[c][1], telefono: datiClienti[c][2] };
    }

    let acquirentiInTarget = [];

    for (let r = 1; r < datiRichieste.length; r++) {
      let rigaRichiesta = datiRichieste[r];
      if (!rigaRichiesta || rigaRichiesta.length < 5) continue;
      
      let idClienteReq = rigaRichiesta[1]; 
      let reqTipologia = (rigaRichiesta[3] || "").toString().trim().toLowerCase(); 
      let reqBudgetMax = parseFloat(rigaRichiesta[4]) || 0; 
      let reqZoneInteresse = (rigaRichiesta[5] || "").toString().trim().toLowerCase(); 
      let statoIncrocio = (rigaRichiesta[7] || "").toString().trim().toLowerCase(); 
      
      if (statoIncrocio === "evasa" || statoIncrocio === "annullata") continue;

      let matchTipologia = (reqTipologia.includes(tipologia) || tipologia.includes(reqTipologia));
      let matchBudget = (prezzo <= reqBudgetMax);
      let matchZona = (reqZoneInteresse.includes(comune) || reqZoneInteresse.includes(zona) || comune.includes(reqZoneInteresse));

      if (matchTipologia && matchBudget && matchZona) {
        let infoCliente = mappaClienti[idClienteReq] || { nome: "Cliente Sconosciuto", telefono: "" };
        acquirentiInTarget.push({ nome: infoCliente.nome, telefono: infoCliente.telefono, budget: reqBudgetMax, zonaCercata: rigaRichiesta[5] });
      }
    }

    if (acquirentiInTarget.length === 0) return;

    // --- COSTRUZIONE MESSAGGIO TELEGRAM ---
    let messaggioTelegram = `🎯 *INCROCIO IMMOBILIARE RILEVATO!*\n\n`;
    messaggioTelegram += `🏡 *Immobile:* ${immobile[3]} a ${immobile[4]} (${immobile[5]})\n`;
    messaggioTelegram += `💰 *Prezzo Corrente:* ${prezzo.toLocaleString('it-IT')} €\n`;
    messaggioTelegram += `🎬 [Guarda il Video Reel](${linkReel})\n`;
    messaggioTelegram += `\n───────────────────\n`;
    messaggioTelegram += `👥 *Acquirenti in target trovati (${acquirentiInTarget.length}):*\n\n`;

    acquirentiInTarget.forEach((cliente, i) => {
      let numPulito = cliente.telefono.toString().replace(/\+/g, '').replace(/ /g, '');
      if (!numPulito.startsWith('39') && numPulito.startsWith('3')) numPulito = '39' + numPulito;

      let testoWhatsApp = `Ciao ${cliente.nome}! ✨ Ti contatto dall'Immobiliare Giancani. Abbiamo aggiornato/inserito un immobile (${immobile[3]}) a ${immobile[4]} a un prezzo di ${prezzo.toLocaleString('it-IT')}€ che rispecchia perfettamente la tua ricerca! 🏡 Guarda il video: ${linkReel}`;
      let urlLinkWhatsApp = `https://api.whatsapp.com/send?phone=${numPulito}&text=${encodeURIComponent(testoWhatsApp)}`;

      messaggioTelegram += `*${i + 1}. ${cliente.nome}*\n💰 Budget: ${cliente.budget.toLocaleString('it-IT')} €\n🚀 [INVIA PROPOSTA SU WA](${urlLinkWhatsApp})\n\n`;
    });

    inviaNotificaTelegram(messaggioTelegram);

    // Salva nel Log con il prezzo per evitare doppi invii DELLO STESSO PREZZO
    if (sheetLog) {
      let dataOraOra = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      sheetLog.appendRow(["LOG_" + Utilities.getUuid().substring(0,8), dataOraOra, "Sistema", "IncrocioImmobileSpecifico", "SUCCESS", stringaLogCercata]);
    }

  } catch (e) {
    Logger.log("⚠️ Errore incrocio: " + e.message);
  }
}




function onEdit(e) {
  const range = e.range;
  const sheet = range.getSheet();
  
  // Controlla che tu stia modificando il foglio degli immobili
  if (sheet.getName() === "DATABASE_IMMOBILI") {
    const rigaModificata = range.getRow();
    const colonnaModificata = range.getColumn();
    
    // Se modifichi la colonna 8 (Prezzo_Richiesta) o se è una nuova riga intera
    if (colonnaModificata === 8 || colonnaModificata === 1) { 
      // Aspetta 2 secondi che si compilino eventuali altri campi correlati e lancia
      Utilities.sleep(2000);
      IncrocioImmobileSpecifico(rigaModificata);
    }
  }
}

/**
 * Estrae i dati reali di un immobile direttamente dal foglio DATABASE_IMMOBILI
 * impedendo a DarIA di inventare dettagli e alimentando ReportVenditore.html
 */
function ottieniDatiImmobileDalDatabase(ticketOIndirizzo) {
  try {
    const sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_IMMOBILI');
    if (!sheet) return null;
    
    const dati = sheet.getDataRange().getValues();
    let query = String(ticketOIndirizzo).toLowerCase().trim();
    
    // Scansiona il foglio riga per riga per trovare la corrispondenza esatta
    for (let i = 1; i < dati.length; i++) {
      let descrizione = String(dati[i][CONFIG.COL_DESCRIZIONE] || '').toLowerCase();
      let citta = String(dati[i][CONFIG.COL_CITTA] || '').toLowerCase();
      
      // Se trova il match nell'indirizzo o nella descrizione bloccata dello sheet
      if (descrizione.includes(query) || citta.includes(query)) {
        return {
          dataInserimento: dati[i][1],
          descrizione: dati[i][CONFIG.COL_DESCRIZIONE],
          linkYoutube: dati[i][CONFIG.COL_YOUTUBE],
          linkFacebook: dati[i][CONFIG.COL_FACEBOOK],
          citta: dati[i][CONFIG.COL_CITTA],
          // Se nel foglio tieni traccia dei clic o delle viste video nelle colonne successive, le mappiamo qui:
          visteVideo: dati[i][15] || 0, 
          interazioni: dati[i][16] || 0
        };
      }
    }
  } catch(e) {
    Logger.log("⚠️ Errore lettura DATABASE_IMMOBILI: " + e.toString());
  }
  return null;
}

