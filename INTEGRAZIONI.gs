// ==========================================




// ══════════════════════════════════════════════════════════════
// ── 5. INTEGRAZIONI (GROQ E GITHUB) ───────────────────────────
// ══════════════════════════════════════════════════════════════
function callGroq(sys, user) {
  let kIdx = parseInt(PropertiesService.getScriptProperties().getProperty('groq_idx')) || 1;
  let activeK = kIdx === 1 ? CONFIG.KEYS.GROQ_1 : CONFIG.KEYS.GROQ_2;
  PropertiesService.getScriptProperties().setProperty('groq_idx', kIdx === 1 ? 2 : 1);
  const res = UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + activeK },
    payload: JSON.stringify({ model: 'llama-3.1-8b-instant', messages: [{ role: 'system', content: sys }, { role: 'user', content: user }], temperature: 0.1 }), muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('IA_OFFLINE');
  return JSON.parse(res.getContentText()).choices[0].message.content.trim();
}

function estraiCategoriaConIA(testo) {
  const sys = 'Estrai la tipologia di immobile da questo testo. Scegli SOLO TRA: appartamento, villa, casa, garage, locale, terreno. Se non c\'è, rispondi ESATTAMENTE con: NULL.';
  let r = callGroq(sys, testo).toLowerCase().replace(/[^a-z]/g, '');
  if (r.includes('appartamento')) return 'appartamento'; if (r.includes('villa')) return 'villa'; if (r.includes('casa')) return 'casa';
  if (r.includes('garage')) return 'garage'; if (r.includes('locale')) return 'locale'; if (r.includes('terreno')) return 'terreno'; return null;
}
function estraiCitta(testo) { let r = callGroq('Estrai la CITTÀ, ZONA o QUARTIERE. Rispondi SOLO col nome. Altrimenti: NULL', testo).trim().toLowerCase(); return (r === 'null' || r.includes('null') || r.length < 2) ? null : r.replace(/'/g, ' ').trim(); }
function estraiNomeConIA(testo) { let r = callGroq('Estrai il Nome e Cognome. Se non c\'è, rispondi: NULL. Solo il nome.', testo).trim(); return (r.toUpperCase().includes('NULL') || r.length < 2) ? null : r; }

function avviaBotGitHub(repoName, workflowFile, branchName, chatId) {
  if (!CONFIG.GITHUB_TOKEN) { inviaMessaggioUmano(chatId, '⚠️ Manca token GitHub.'); return; }
  const url = 'https://api.github.com/repos/' + CONFIG.GITHUB_USER + '/' + repoName + '/actions/workflows/' + workflowFile + '/dispatches';
  try {
    const response = UrlFetchApp.fetch(url, { method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + CONFIG.GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }, payload: JSON.stringify({ ref: branchName }), muteHttpExceptions: true });
    if (response.getResponseCode() === 204) inviaMessaggioUmano(chatId, '✅ Bot su GitHub partito!');
    else inviaMessaggioUmano(chatId, '❌ Errore da GitHub (Codice ' + response.getResponseCode() + ').');
  } catch(e) { inviaMessaggioUmano(chatId, '⚠️ Errore connessione GitHub: ' + e.message); }
}
function avviaWorkflowGitHub(repo, workflowFile) {
  const res = UrlFetchApp.fetch('https://api.github.com/repos/' + CONFIG.GITHUB_USER + '/' + repo + '/actions/workflows/' + workflowFile + '/dispatches', {
    method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + CONFIG.GITHUB_TOKEN, 'Accept': 'application/vnd.github.v3+json' }, payload: JSON.stringify({ ref: 'main' }), muteHttpExceptions: true
  });
  return res.getResponseCode() === 204;
}

// ══════════════════════════════════════════════════════════════
// ── 6. UTILITÀ DATI (DB, RUBRICA, CALENDARIO) ─────────────────
// ══════════════════════════════════════════════════════════════
function cercaImmobiliRealiArray(tipoPulito, cittaPulita) {
  try {
    const dati = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_IMMOBILI').getDataRange().getValues();
    let risArray = [];
    for (let i = 1; i < dati.length; i++) {
      if (!dati[i][CONFIG.COL_DESCRIZIONE]) continue;
      let desc = String(dati[i][CONFIG.COL_DESCRIZIONE]).toLowerCase().replace(/'/g, ' '), tipo = String(dati[i][CONFIG.COL_TIPOLOGIA] || '').toLowerCase(), citta = String(dati[i][CONFIG.COL_CITTA] || '').toLowerCase();
      if ((desc.includes(tipoPulito) || tipo.includes(tipoPulito)) && (desc.includes(cittaPulita) || citta.includes(cittaPulita))) {
        let yt = String(dati[i][CONFIG.COL_YOUTUBE] || '').trim(), fb = String(dati[i][CONFIG.COL_FACEBOOK] || '').trim(), linksText = '';
        if (yt) linksText += '\n📺 YouTube: ' + yt; if (fb) linksText += '\n🔵 Facebook: ' + fb; if (!yt && !fb) linksText += '\n📍 Richiedi info in agenzia';
        risArray.push('📌 *' + String(dati[i][CONFIG.COL_DESCRIZIONE]).substring(0, 90) + '...*' + linksText);
        if (risArray.length >= CONFIG.MAX_PROPOSTE) break;
      }
    }
    return risArray;
  } catch(e) { return []; }
}
function ottieniListaDocumenti(tipo) {
  try {
    const dati = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DOCUMENTI_VENDITA').getDataRange().getValues();
    for (let i = 0; i < dati.length; i++) { if (String(dati[i][0]).toUpperCase().includes(tipo.toUpperCase()) && dati[i][1]) return String(dati[i][1]).replace(/\\n/g, '\n'); }
  } catch(e) {}
  return '📄 *Documenti base:*\n1) Titolo di Proprietà\n2) Visura Catastale\n3) Planimetria\n4) Doc. Identità';
}
function getBreveMemoria(numero) {
  try {
    const dati = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log').getDataRange().getValues();
    let memoria = [];
    for (let i = dati.length - 1; i > 0; i--) {
      if (String(dati[i][1]).includes(numero.replace(/^39/, ''))) { memoria.unshift(dati[i][3]); if (memoria.length >= 3) break; }
    }
    return memoria.join('\n---\n');
  } catch(e) { return ''; }
}

function aggiornaCalendarioDaMessaggio(numero, testo, chatId, waName) {
  try {
    let stato = 'DA DEFINIRE', colore = '8';
    
    if (testo.includes('CONFERMO')) { stato = 'CONFERMATO'; colore = '10'; }
    if (testo.includes('DISDICO')) { stato = 'DISDETTO'; colore = '11'; }
    if (testo.includes('POSTICIPO')) { stato = 'DA POSTICIPARE'; colore = '5'; }

    const cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID); 
    if (!cal) return;

    let dateDaControllare = [new Date(), new Date(Date.now() + 86400000)];
    let eventoTrovato = false, dettagliEvento = '';

    dateDaControllare.forEach(function(data) {
      cal.getEventsForDay(data).forEach(function(ev) {
        let titolo = ev.getTitle() || '';
        if (titolo && titolo.includes(String(numero).replace(/^39/, ''))) {
          ev.setTitle('【' + stato + '】 ' + titolo.replace(/【.*?】/g, '').trim()); 
          ev.setColor(colore); 
          eventoTrovato = true;
          dettagliEvento = '🗓️ ' + Utilities.formatDate(data, CONFIG.TIMEZONE, 'dd/MM/yyyy') + ' 🕒 ' + Utilities.formatDate(ev.getStartTime(), CONFIG.TIMEZONE, 'HH:mm') + '\n👤 ' + (waName || 'Cliente') + '\n📱 +' + numero;
        }
      });
    });

    if (eventoTrovato) {
      if (stato === 'CONFERMATO') {
          inviaMessaggioUmano(chatId, "Perfetto! Abbiamo mandato ad Antonio la conferma dell'appuntamento. A domani! 🏡");
      } 
      else if (stato === 'DISDETTO') {
          inviaMessaggioUmano(chatId, "Va bene, ho annullato l'appuntamento e avvisato l'agenzia. Alla prossima!");
      } 
      // 🔄 GESTIONE CONTROLLATA DEL POSTICIPO CON PULSANTI INTERATTIVI NATIVI META API
      else if (stato === 'DA POSTICIPARE') {
          let liberi = trovaAppuntamentiLiberi();
          if (liberi.length > 0) {
              PropertiesService.getScriptProperties().setProperty('stato_appuntamento_' + numero, 'in_attesa');
              
              // 🚀 Invia i pulsanti interattivi reali invece della stringa di testo
              inviaPulsantiPosticipo(numero, liberi);
          } else {
              inviaMessaggioUmano(chatId, "Ho avvisato Antonio per posticipare, ma al momento l'agenda digitale sembra piena! Scrivi direttamente a lui per riprogrammare: https://wa.me/393201667156");
          }
      }
      
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '🚨 *AGGIORNAMENTO APPUNTAMENTO*\n' + stato + '\n' + dettagliEvento);
    } else {
      inviaWhatsAppTesto(CONFIG.ANTONIO_CHAT_ID, '⚠️ Il numero +' + numero + ' ha risposto *' + testo + '*, ma non trovo appuntamenti in agenda.');
    }
  } catch(e) {}
}


