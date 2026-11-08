// ==========================================

// ============================================================
// CONFIGURAZIONE OTP AVANZATA BOSS — DARIA SYSTEM
// ============================================================
var _DC_OTP_TTL = 10 * 60 * 1000;       // OTP: 10 minuti
var _DC_SES_TTL =  4 * 60 * 60 * 1000;  // Sessione standard: 4 ore
var _DC_BOSS_NUMERO = "393201667156";   // Il tuo numero memorizzato nel sistema
var _DC_BOSS_TTL = 48 * 60 * 60 * 1000; // Durata validità bypass Boss: 48 ore


function dcVerificaOTP(tel, otp, deviceId, ipCorrente) {
  try {
    // ── PULIZIA E FORMATTAZIONE INLINE DEL NUMERO ──
    if (!tel) return {ok:false, m:"Numero o credenziale non valida."};
    var t = String(tel).replace(/\D/g, ''); // Rimuove spazi, + o caratteri non numerici
    if (t.length === 10 && !t.startsWith('39')) {
      t = '39' + t; // Forza il prefisso internazionale se inserito a 10 cifre
    }
    if (!t) return {ok:false, m:"Numero o credenziale non valida."};
    
    // ── INTERCETTAZIONE ACCESSO CON PASSWORD DIRETTA ──
    if (String(otp).trim() === "3201667156") {
      var tok  = Utilities.getUuid();
      var nome = cercaNomeInRubrica(t) || "Antonio Giancani";
      
      // Gestione bypass automatico device Boss 48 ore
      if (t === _DC_BOSS_NUMERO && deviceId && ipCorrente) {
        var sessioneBoss = { ip: ipCorrente, e: Date.now() + _DC_BOSS_TTL };
        PropertiesService.getScriptProperties().setProperty('DC_BOSS_SYS_' + deviceId, JSON.stringify(sessioneBoss));
      }
      
      // Scrittura sessione standard nel database interno script properties
      PropertiesService.getScriptProperties().setProperty('DC_S_'+tok, JSON.stringify({t:t, n:nome, e:Date.now()+_DC_SES_TTL}));
      return {ok:true, tok:tok, nome:nome, tel:t};
    }
    // ──────────────────────────────────────────────────
    
    // Fallback di sicurezza per i vecchi OTP temporanei se non si usa la password principale
    var raw = PropertiesService.getScriptProperties().getProperty('DC_O_'+t);
    if (!raw) return {ok:false, m:"Password errata o non autorizzata."};
    var d = JSON.parse(raw);
    if (Date.now()>d.e) {
      PropertiesService.getScriptProperties().deleteProperty('DC_O_'+t);
      return {ok:false, m:"Sessione scaduta."};
    }
    if (d.o!==String(otp).trim()) return {ok:false, m:"Credenziali errate."};
    PropertiesService.getScriptProperties().deleteProperty('DC_O_'+t);
    
    var tok  = Utilities.getUuid();
    var nome = cercaNomeInRubrica(t) || "Boss System";
    PropertiesService.getScriptProperties().setProperty('DC_S_'+tok, JSON.stringify({t:t, n:nome, e:Date.now()+_DC_SES_TTL}));
    return {ok:true, tok:tok, nome:nome, tel:t};
  } catch(e) { return {ok:false, m:e.toString()}; }
}
/* ── 2. HOME DATA (SICURA E COMPLETA DI TUTTI I PARAMETRI) ── */
function dcHome(tok) {
  var s = _dcSes(tok); if(!s) return {auth:false};
  
  var r = {
    auth: true, nome: s.n, tel: s.t,
    totaleImmobili: 0, totaleRichieste: 0, richiesteVendita: 0, richiesteAcquisto: 0, richiesteAffitto: 0,
    appuntamentiDomani: 0, bozzeVisiteAperte: 0, bozzeIncarichiAperte: 0, incarichiAttivi: 0, utentiTotali: 0, commentiInCoda: 0
  };
  
  var ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID);
  function lr(name){try{var sh=ss.getSheetByName(name);return sh?Math.max(0,sh.getLastRow()-1):0;}catch(e){return 0;}}
  
  r.totaleImmobili = r.kImm = lr('DATABASE_IMMOBILI');
  r.utentiTotali   = r.kUte = lr('SCHEDE_CLIENTI');
  r.incarichiAttivi = r.kInc = lr('STORICO_INCARICHI');
  
  try {
    var sh = ss.getSheetByName('DATABASE_RICHIESTE');
    if(sh){
      var rows = sh.getDataRange().getValues(); 
      r.totaleRichieste = r.kRic = Math.max(0, rows.length - 1);
      for(var i=1; i<rows.length; i++){
        var op = String(rows[i][3]||'').toUpperCase();
        if(op==='ACQUISTO') r.richiesteAcquisto++;
        else if(op==='VENDITA') r.richiesteVendita++;
        else if(op==='AFFITTO') r.richiesteAffitto++;
      }
      r.kAcq = r.richiesteAcquisto; r.kVen = r.richiesteVendita; r.kAff = r.richiesteAffitto;
    }
  } catch(e) {}
  
  try {
    var bv = ss.getSheetByName('BOZZE_VISITE');
    if(bv){
      var dv = bv.getDataRange().getValues();
      for(var i=1; i<dv.length; i++) if(String(dv[i][5]).toUpperCase()!=='COMPLETATO') r.bozzeVisiteAperte++;
    }
    var bi = ss.getSheetByName('BOZZE_INCARICHI');
    if(bi){
      var di = bi.getDataRange().getValues();
      for(var i=1; i<di.length; i++) if(String(di[i][5]).toUpperCase()==='BOZZA') r.bozzeIncarichiAperte++;
    }
    r.kBV = r.bozzeVisiteAperte; r.kBI = r.bozzeIncarichiAperte;
  } catch(e) {}
  
  try {
    var sc = ss.getSheetByName('CODA_COMMENTI');
    if(sc){
      var dc = sc.getDataRange().getValues();
      for(var i=1; i<dc.length; i++){ var st = String(dc[i][4]); if(st==='DA_FARE'||st==='SCELTA_FORZATA') r.commentiInCoda++; }
    }
    r.kCom = r.commentiInCoda;
  } catch(e) {}
  
  try {
    var cal = CalendarApp.getCalendarById(CONFIG.CALENDAR_ID);
    r.appuntamentiDomani = cal.getEventsForDay(new Date(Date.now()+86400000)).length;
    r.oggi   = cal.getEventsForDay(new Date()).map(function(e){return{t:e.getTitle(),o:Utilities.formatDate(e.getStartTime(),CONFIG.TIMEZONE,"HH:mm")};});
    r.domani = cal.getEventsForDay(new Date(Date.now()+86400000)).map(function(e){return{t:e.getTitle(),o:Utilities.formatDate(e.getStartTime(),CONFIG.TIMEZONE,"HH:mm")};});
  } catch(e) { r.oggi=[]; r.domani=[]; }
  
  return r;
}

/* ── 3. CHAT MANAGEMENT ──────────────────────────────────── */
function dcChatList(tok) {
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var sh = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log');
    if(!sh) return {auth:true, lista:[]};
    var rows = sh.getDataRange().getValues(); var map = {};
    for(var i=rows.length-1; i>=Math.max(1, rows.length-1000); i--){
      var num = String(rows[i][1]||'').replace(/\D/g,'');
      if(!num || num.length<8) continue;
      if(!map[num]){
        var txt = String(rows[i][3]||'');
        map[num] = {
          n: String(rows[i][2]||'Cliente'), num: num,
          u: txt.replace(/^[UB]:/,'').substring(0,45),
          bot: txt.startsWith('B:'),
          ts: rows[i][0] instanceof Date ? rows[i][0].getTime() : 0,
          data: rows[i][0] instanceof Date ? Utilities.formatDate(rows[i][0], CONFIG.TIMEZONE, "dd/MM HH:mm") : "",
          pausa: PropertiesService.getScriptProperties().getProperty('PAUSA_DARIA_'+num)==='true'
        };
      }
    }
    var lista = Object.values(map).sort(function(a,b){return b.ts-a.ts;}).slice(0,30);
    return {auth:true, lista:lista};
  } catch(e) { return {auth:true, lista:[]}; }
}

function dcChatLog(tok, num){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var msgs = htmlOttieniCronologia(num);
    var pausa = PropertiesService.getScriptProperties().getProperty('PAUSA_DARIA_'+num)==='true';
    return {auth:true, msgs:msgs, pausa:pausa, nome:cercaNomeInRubrica(num)||'Cliente'};
  } catch(e) { return {auth:true, msgs:[], pausa:false, nome:'Cliente'}; }
}

function dcSendMsg(tok, num, txt){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var n = String(num).replace(/\D/g,'');
    _inviaMetaWhatsApp(n, txt);
    PropertiesService.getScriptProperties().setProperty('PAUSA_DARIA_'+n, 'true');
    try {
      SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('Chat_IA_Log')
        .appendRow([new Date(), n, 'Antonio (Dashboard)', 'B:[Boss Dashboard] ' + txt]);
    } catch(e) {}
    return {ok:true};
  } catch(e) { return {ok:false, m:e.toString()}; }
}

function dcTogglePausa(tok, num, on){
  var s = _dcSes(tok); if(!s) return {auth:false};
  var n = String(num).replace(/\D/g,'');
  if(on) PropertiesService.getScriptProperties().setProperty('PAUSA_DARIA_'+n, 'true');
  else   PropertiesService.getScriptProperties().deleteProperty('PAUSA_DARIA_'+n);
  return {ok:true};
}

/* ── 4. BROADCAST AUDIENCE ───────────────────────────────── */
function dcClienti(tok){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var sh = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('SCHEDE_CLIENTI');
    if(!sh) return {auth:true, lista:[]};
    var d = sh.getDataRange().getValues(); var lista = [];
    for(var i=1; i<d.length; i++){
      var t = String(d[i][1]||'').replace(/\D/g,''); var n = String(d[i][2]||'');
      if(t.length>=9 && n && !t.includes('FB') && !t.includes('TG')) lista.push({num:t, nome:n});
    }
    return {auth:true, lista:lista};
  } catch(e) { return {auth:true, lista:[]}; }
}

function dcBroadcast(tok, numeri, txt){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var ok=0, err=0;
    numeri.forEach(function(n){
      try { Utilities.sleep(400); _inviaMetaWhatsApp(String(n).replace(/\D/g,''), txt); ok++; }
      catch(e) { err++; }
    });
    return {auth:true, ok:true, inviati:ok, errori:err};
  } catch(e) { return {auth:true, ok:false, m:e.toString()}; }
}

/* ── 5. PIPELINE LEAD RETRIEVAL ──────────────────────────── */
function dcPipeline(tok){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var sh = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_RICHIESTE');
    if(!sh) return {auth:true, lead:[]};
    var d = sh.getDataRange().getValues(); var lead = [];
    for(var i=1; i<d.length; i++){
      if(!d[i][1] && !d[i][0]) continue;
      lead.push({
        id:i, data:String(d[i][0]||''), nome:String(d[i][1]||''),
        tel:String(d[i][2]||'').replace(/\D/g,''), op:String(d[i][3]||''),
        tipo:String(d[i][4]||''), zona:String(d[i][5]||''), bgt:String(d[i][6]||'')
      });
    }
    return {auth:true, lead:lead};
  } catch(e) { return {auth:true, lead:[]}; }
}

/* ── 6. AZIONI RAPIDE (AUTENTICATE E PROTETTE) ────────────── */
function dcAzione(tok, az) {
  var s = _dcSes(tok); if(!s) return {auth:false, successo:false, messaggio:"Sessione non autorizzata."};
  var M = {
    resoconto: function(){ inviaResocontoSerale(); },
    conferme:  function(){ inviaRichiestaConferme(); },
    incrocio:  function(){ IncrocioImmobileSpecifico(null); },
    commenti:  function(){ processaCodaCommenti(); }
  };
  if(!M[az]) return {ok:false, successo:false, messaggio:"Azione non riconosciuta."};
  try {
    M[az]();
    return {ok:true, successo:true, messaggio:"Completato con successo dal Centro di Comando!"};
  } catch(e) { return {ok:false, successo:false, messaggio:e.toString()}; }
}

function dcElenco(tok, tipo){
  var s = _dcSes(tok); if(!s) return {auth:false};
  return {auth:true, test: tipo==='utenti' ? ottieniElencoUtenti() : ottieniElencoProprietari()};
}

/* ── 7. GENERATORE PROMPT IA ─────────────────────────────── */
function dcGeneraDesc(tok, dati){
  var s = _dcSes(tok); if(!s) return {auth:false};
  try {
    var p = "Sei DarIA, copywriter immobiliare esperta di Immobiliare Giancani Favara (AG). " +
            "Scrivi una descrizione pubblicitaria persuasiva, ricca di emoji, per questo immobile:\n" +
            JSON.stringify(dati) + "\n" +
            "Includi: Agenzia Giancani, tel 393201667156, Favara. Max 180 parole. Solo testo finito, senza premesse.";
    return {auth:true, ok:true, testo: callGroq("Sei una copywriter esperta immobiliare.", p)};
  } catch(e) { return {auth:true, ok:false, m:e.toString()}; }
}

// ============================================================
// CO_Setup.gs — SuperAgenda73
// ============================================================
function coSetupCompleto() {
  var log = [];
  var ss  = SpreadsheetApp.openById(ID_SHEET);
  log.push('═══════════════════════════════════════');
  log.push(' CO SETUP COMPLETO — ' + new Date().toLocaleString('it-IT'));
  log.push('═══════════════════════════════════════');

  log.push('\n📋 [1/4] DB_PROPRIETARI');
  var shProp = ss.getSheetByName('DB_PROPRIETARI');
  if (!shProp) {
    shProp = ss.insertSheet('DB_PROPRIETARI');
    log.push('    ✅ Tab creato da zero');
  } else {
    log.push('    ℹ️  Tab già esistente — verifico colonne');
  }

  var PROP_HEADERS = [
    'ID_PROPRIETARIO', 'NOME', 'COGNOME', 'TELEFONO_WA', 'EMAIL',
    'CODICE_FISCALE', 'DATA_NASCITA', 'INDIRIZZO_RESIDENZA',
    'ID_IMMOBILE', 'NOTE_INTERNE', 'DATA_INSERIMENTO'
  ];

  var attuali = shProp.getLastColumn() > 0 ? shProp.getRange(1, 1, 1, shProp.getLastColumn()).getValues()[0].map(String) : [];

  if (attuali.length === 0) {
    shProp.appendRow(PROP_HEADERS);
    shProp.getRange(1, 1, 1, PROP_HEADERS.length).setFontWeight('bold').setBackground('#312e81').setFontColor('#e0e7ff');
    log.push('    ✅ Headers scritti: ' + PROP_HEADERS.join(', '));
  } else {
    var mancanti = PROP_HEADERS.filter(function(h) { return attuali.indexOf(h) === -1; });
    if (mancanti.length > 0) {
      var rinomina = { 'Telefono_WA': 'TELEFONO_WA', 'Nome': 'NOME', 'Cognome': 'COGNOME', 'Email': 'EMAIL', 'Note_Interne':'NOTE_INTERNE' };
      attuali.forEach(function(h, i) {
        if (rinomina[h]) {
          shProp.getRange(1, i + 1).setValue(rinomina[h]);
          log.push('    🔄 Rinominata colonna: ' + h + ' → ' + rinomina[h]);
        }
      });
      attuali = shProp.getRange(1, 1, 1, shProp.getLastColumn()).getValues()[0].map(String);
      mancanti = PROP_HEADERS.filter(function(h) { return attuali.indexOf(h) === -1; });

      mancanti.forEach(function(h) {
        var newCol = shProp.getLastColumn() + 1;
        shProp.getRange(1, newCol).setValue(h).setFontWeight('bold').setBackground('#312e81').setFontColor('#e0e7ff');
        log.push('    ✅ Aggiunta colonna: ' + h);
      });
    } else {
      log.push('    ✅ Tutte le colonne già presenti');
    }

    var dProp = shProp.getDataRange().getValues();
    var hProp = dProp[0].map(String);
    var colId  = hProp.indexOf('ID_PROPRIETARIO') + 1;
    var colTs  = hProp.indexOf('DATA_INSERIMENTO') + 1;
    if (colId > 0) {
      for (var i = 1; i < dProp.length; i++) {
        if (!dProp[i][colId - 1]) {
          shProp.getRange(i + 1, colId).setValue('PROP-' + new Date().getTime() + '-' + i);
        }
        if (colTs > 0 && !dProp[i][colTs - 1]) {
          shProp.getRange(i + 1, colTs).setValue(new Date().toLocaleDateString('it-IT'));
        }
      }
      log.push('    ✅ ID_PROPRIETARIO auto-generati per righe esistenti');
    }
  }

  try {
    shProp.setColumnWidth(1, 160); shProp.setColumnWidth(2, 100); shProp.setColumnWidth(3, 110);
    shProp.setColumnWidth(4, 130); shProp.setColumnWidth(5, 180); shProp.setColumnWidth(9, 220);
    shProp.setColumnWidth(10, 200); shProp.setFrozenRows(1);
  } catch(e) {}

  log.push('\n🏠 [2/4] DATABASE_IMMOBILI — colonne aggiuntive');
  var shImm = ss.getSheetByName('DATABASE_IMMOBILI');
  if (!shImm) {
    shImm = ss.insertSheet('DATABASE_IMMOBILI');
    var IMM_HEADERS = [
      'ID_IMMOBILE','TIPOLOGIA','STATO','PREZZO','VIA','NUMERO_CIVICO','CITTA','CAP','ZONA',
      'MQ_TOTALI','PIANI_DETTAGLIO','PIANO','LOCALI','BAGNI','GARAGE','GIARDINO',
      'CLASSE_ENERGETICA','ANNO_COSTRUZIONE','DESCRIZIONE', 'LAT','LNG','LINK_FOTO','LINK_VIDEO',
      'TELEFONO_PROPRIETARIO','PROPRIETARIO', 'DATA_INSERIMENTO','DATA_INCARICO','DATA_ULTIMA_VISITA',
      'GIORNI_SENZA_VISITE','ALERT_FREDDO','ALERT_PREZZO_3M', 'VALUTAZIONE_BOSS','NOTE_PRIVATE','COMMISSIONE_PCT'
    ];
    shImm.appendRow(IMM_HEADERS);
    shImm.getRange(1, 1, 1, IMM_HEADERS.length).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#e0f2fe');
    shImm.setFrozenRows(1);
    log.push('    ✅ Tab DATABASE_IMMOBILI creato con schema completo');
  } else {
    var NUOVE_COLONNE_IMM = [
      'DATA_INCARICO', 'ALERT_PREZZO_3M', 'GIORNI_SENZA_VISITE', 'ALERT_FREDDO',
      'VALUTAZIONE_BOSS', 'MQ_TOTALI', 'PIANI_DETTAGLIO', 'ZONA', 'LINK_VIDEO', 'LINK_FOTO', 'LAT', 'LNG',
      'DATA_ULTIMA_VISITA', 'NOTE_PRIVATE', 'COMMISSIONE_PCT'
    ];
    var hImm = shImm.getRange(1, 1, 1, shImm.getLastColumn()).getValues()[0].map(String);
    var aggiunte = 0;
    NUOVE_COLONNE_IMM.forEach(function(col) {
      if (hImm.indexOf(col) === -1) {
        var nc = shImm.getLastColumn() + 1;
        shImm.getRange(1, nc).setValue(col).setFontWeight('bold').setBackground('#1e3a5f').setFontColor('#e0f2fe');
        log.push('    ✅ Aggiunta: ' + col);
        aggiunte++;
      }
    });
    if (aggiunte === 0) log.push('    ✅ Tutte le colonne già presenti');
    try { shImm.setFrozenRows(1); } catch(e) {}
  }

  log.push('\n📝 [3/4] CO_BOZZE_IMMOBILI');
  var shBozze = ss.getSheetByName('CO_BOZZE_IMMOBILI');
  if (!shBozze) {
    shBozze = ss.insertSheet('CO_BOZZE_IMMOBILI');
    var BOZZE_HEADERS = ['ID_BOZZA','ID_IMMOBILE','DATA_BOZZA','DATI_JSON','STATO'];
    shBozze.appendRow(BOZZE_HEADERS);
    shBozze.getRange(1, 1, 1, BOZZE_HEADERS.length).setFontWeight('bold').setBackground('#3d1a78').setFontColor('#f3e8ff');
    shBozze.setColumnWidth(4, 400); shBozze.setFrozenRows(1);
    log.push('    ✅ Tab creato');
  } else {
    log.push('    ℹ️  Tab già esistente — nessuna modifica');
  }

  var tabsExtra = [
    { name: 'VISITE_CO', headers: ['ID_VISITA','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','PANORAMA','QUALITA_INTERNA','STRUTTURA','PREZZO','POTENZIALE','MEDIA','NOTE','AUDIO_URL'], bg: '#0c4a6e', fg: '#e0f2fe' },
    { name: 'STORICO_PROPOSTE', headers: ['ID','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','IMPORTO_OFFERTA','PREZZO_RICHIESTO','SCOSTAMENTO_PCT','ESITO','NOTE'], bg: '#14532d', fg: '#dcfce7' },
    { name: 'BENCHMARK_ZONA', headers: ['ZONA','TIPOLOGIA','PREZZO_MQ_MIN','PREZZO_MQ_MAX','PREZZO_MQ_MEDIO','FONTE','DATA_AGGIORNAMENTO'], bg: '#3b0764', fg: '#f3e8ff' },
    { name: 'CONTATTI_RUBRICA', headers: ['NOME','COGNOME','TELEFONO','EMAIL','DATA_NASCITA','DATA_ONOMASTICO','RUOLO','NOTE'], bg: '#7c2d12', fg: '#ffedd5' }
  ];

  tabsExtra.forEach(function(t) {
    if (!ss.getSheetByName(t.name)) {
      var sh2 = ss.insertSheet(t.name);
      sh2.appendRow(t.headers);
      sh2.getRange(1, 1, 1, sh2.getLastColumn()).setFontWeight('bold').setBackground(t.bg).setFontColor(t.fg);
      sh2.setFrozenRows(1);
      log.push('    ✅ Tab ' + t.name + ' creato');
    }
  });

  log.push('\n⏰ [4/4] Trigger automatici');
  var TRIGGERS_CO = ['coCheckFesteggiati', 'coAggiornaSogliaVisite', 'coCheckImmobiliInvenduti', 'coMasterDailyTrigger'];
  var rimossi = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (TRIGGERS_CO.indexOf(t.getHandlerFunction()) !== -1) { ScriptApp.deleteTrigger(t); rimossi++; }
  });
  log.push('    🗑️  Rimossi ' + rimossi + ' trigger vecchi');

  ScriptApp.newTrigger('coMasterDailyTrigger').timeBased().everyDays(1).atHour(8).create();
  log.push('    ✅ Trigger unico installato: coMasterDailyTrigger alle 08:00');

  ScriptApp.newTrigger('coCheckImmobiliInvenduti').timeBased().onMonthDay(1).atHour(10).create();
  log.push('    ✅ Trigger mensile: coCheckImmobiliInvenduti ogni 1° del mese alle 10:00');

  log.push('\n═══════════════════════════════════════');
  log.push(' ✅ SETUP COMPLETATO SENZA ERRORI');
  log.push('═══════════════════════════════════════');
  Logger.log(log.join('\n'));
  return log.join('\n');
}

// ============================================================
// TRIGGER UNICO GIORNALIERO
// ============================================================
function coMasterDailyTrigger() {
  var logMaster = ['🕗 coMasterDailyTrigger — ' + new Date().toLocaleString('it-IT')];
  try { coCheckFesteggiati(); logMaster.push('✅ Compleanni/Onomastici processati'); } catch(e) { logMaster.push('❌ Compleanni error: ' + e.message); }
  try { Utilities.sleep(3000); coAggiornaSogliaVisite(); logMaster.push('✅ Soglia visite aggiornata'); } catch(e) { logMaster.push('❌ Soglia visite error: ' + e.message); }
  try {
    var oggi = new Date();
    if (oggi.getDate() === 1) { Utilities.sleep(3000); coCheckImmobiliInvenduti(); logMaster.push('✅ Check immobili invenduti (1° del mese)'); }
  } catch(e) { logMaster.push('❌ Invenduti error: ' + e.message); }
  Logger.log(logMaster.join('\n'));
}

// ============================================================
// DIAGNOSI & AUTO-REPAIR
// ============================================================
function coDiagnosi() {
  var ssId = '1s68pw0WEUcV0ZqltiahAqCp_r5rsycSjxKNh0VZQq_g';
  var ss = SpreadsheetApp.openById(ssId);
  var log = ['🔍 DIAGNOSI & AUTO-REPAIR CENTRALE OPERATIVA — ' + new Date().toLocaleString('it-IT'), ''];

  var struttureTab = {
    'DATABASE_IMMOBILI': ['ID_IMMOBILE', 'STATO', 'PREZZO', 'GIORNI_SENZA_VISITE', 'ALERT_FREDDO', 'ALERT_PREZZO_3M', 'DATA_INCARICO', 'VALUTAZIONE_BOSS', 'INDIRIZZO', 'TIPOLOGIA'],
    'DB_PROPRIETARI': ['ID_PROPRIETARIO', 'NOME', 'COGNOME', 'TELEFONO_WA', 'EMAIL', 'ID_IMMOBILE'],
    'CO_BOZZE_IMMOBILI': ['ID_BOZZA', 'DATA_ORA', 'AGENTE', 'DATI_JSON', 'STATO'],
    'VISITE_CO': ['ID_VISITA', 'DATA_ORA', 'CLIENTE', 'TELEFONO', 'IMMOBILE', 'NOTE', 'STATO'],
    'STORICO_PROPOSTE': ['ID_PROPOSTA', 'DATA', 'CLIENTE', 'IMMOBILE', 'PREZZO_PROPOSTO', 'STATO'],
    'BENCHMARK_ZONA': ['ZONA', 'PREZZO_MEDIO_MQ', 'NOTE'],
    'CONTATTI_RUBRICA': ['TELEFONO', 'NOME_COMPLETO', 'CATEGORIA', 'NOTE']
  };

  log.push('📋 VERIFICA ESTRUTTURA TAB SHEET:');
  for (var nomeTab in struttureTab) {
    var sh = ss.getSheetByName(nomeTab);
    if (sh) {
      log.push('  ✅ ' + nomeTab + ' — ' + Math.max(0, sh.getLastRow() - 1) + ' righe esistenti');
    } else {
      try {
        var nuovoSh = ss.insertSheet(nomeTab);
        var intestazioni = struttureTab[nomeTab];
        nuovoSh.getRange(1, 1, 1, intestazioni.length).setValues([intestazioni]);
        nuovoSh.getRange(1, 1, 1, intestazioni.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
        nuovoSh.setFrozenRows(1);
        log.push('  🛠️ ' + nomeTab + ' — CREATO AUTOMATICAMENTE.');
      } catch (err) { log.push('  ❌ ' + nomeTab + ' — ERRORE: ' + err.toString()); }
    }
  }

  var props = PropertiesService.getScriptProperties();
  ['WHATSAPP_TOKEN', 'GROQ_API_KEY'].forEach(function(k) {
    log.push('  ' + (props.getProperty(k) ? '✅' : '❌') + ' ' + k);
  });

  var output = log.join('\n');
  Logger.log(output);
  return output;
}



function eseguiAutomazioniGiornaliere() {
  Logger.log("=== INIZIO ESECUZIONE AUTOMAZIONI ===");
  
  // 1. Controllo e gestione dei festeggiati (Compleanni e Onomastici)
  try {
    Logger.log("Avvio coCheckFesteggiati...");
    coCheckFesteggiati();
    Logger.log("✅ coCheckFesteggiati completato con successo.");
  } catch (error) {
    Logger.log("❌ Errore in coCheckFesteggiati: " + error.toString());
  }
  
  // ⏳ Pausa di sicurezza di 5 secondi (5000 millisecondi)
  // Permette alle chiamate API precedenti di chiudersi e riduce il carico sui server
  Logger.log("⏱️ Pausa di stabilità attiva... attendo 5 secondi prima di aggiornare le visite.");
  Utilities.sleep(5000); 
  
  // 2. Aggiornamento della soglia delle visite (Verifica immobili e clienti freddi)
  try {
    Logger.log("Avvio coAggiornaSogliaVisite...");
    coAggiornaSogliaVisite();
    Logger.log("✅ coAggiornaSogliaVisite completato con successo.");
  } catch (error) {
    Logger.log("❌ Errore in coAggiornaSogliaVisite: " + error.toString());
  }
  
  Logger.log("=== FINE ESECUZIONE AUTOMAZIONI ===");
}


// ============================================================
// FUNZIONI PONTE FRONTEND -> BACKEND (CON VERIFICA TOKEN)
// ============================================================





/**
 * Verifica interna di sicurezza basata sul sistema della centrale operativa
 */
function _verificaSessioneCentrale(tok) {
  // Rimosso il controllo ricorsivo su _dcSes che causava il crash del sistema
  var raw = PropertiesService.getScriptProperties().getProperty('DC_S_' + tok);
  if (!raw) return null;
  
  var s = JSON.parse(raw);
  if (Date.now() > s.e) {
    PropertiesService.getScriptProperties().deleteProperty('DC_S_' + tok);
    return null;
  }
  return s;
}


/**
 * Carica l'elenco degli immobili associato alla Centrale Operativa
 */
function coGetImmobili(tok) {
  var sessione = _verificaSessioneCentrale(tok);
  if (!sessione) return { ok: false, error: "Sessione scaduta o non autorizzata.", rows: [] };
  
  try {
    var ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID || ID_SHEET);
    var sh = ss.getSheetByName('DATABASE_IMMOBILI');
    if (!sh) return { ok: false, error: "Tabella DATABASE_IMMOBILI non trovata." };
    
    var data = sh.getDataRange().getValues();
    if (data.length <= 1) return { ok: true, rows: [] };
    
    var headers = data[0].map(String);
    var rows = [];
    
    // Indici colonne chiave
    var idxId = headers.indexOf('ID_IMMOBILE');
    var idxTipo = headers.indexOf('TIPOLOGIA');
    var idxStato = headers.indexOf('STATO');
    var idxPrezzo = headers.indexOf('PREZZO');
    var idxVia = headers.indexOf('VIA');
    var idxCivico = headers.indexOf('NUMERO_CIVICO');
    var idxCitta = headers.indexOf('CITTA');
    var idxMq = headers.indexOf('MQ_TOTALI');
    var idxGiorni = headers.indexOf('GIORNI_SENZA_VISITE');
    var idxFreddo = headers.indexOf('ALERT_FREDDO');
    var idxBoss = headers.indexOf('VALUTAZIONE_BOSS');
    var idxZona = headers.indexOf('ZONA');
    
    for (var i = 1; i < data.length; i++) {
      if (!data[i][idxId]) continue;
      rows.push({
        _row: i + 1,
        ID_IMMOBILE: data[i][idxId],
        TIPOLOGIA: data[i][idxTipo] || 'Immobile',
        STATO: data[i][idxStato] || 'Disponibile',
        PREZZO: data[i][idxPrezzo] || 0,
        VIA: data[i][idxVia] || '',
        NUMERO_CIVICO: data[i][idxCivico] || '',
        CITTA: data[i][idxCitta] || '',
        ZONA: idxZona !== -1 ? data[i][idxZona] : '',
        MQ_TOTALI: data[i][idxMq] || 0,
        GIORNI_SENZA_VISITE: idxGiorni !== -1 ? data[i][idxGiorni] : 0,
        ALERT_FREDDO: idxFreddo !== -1 ? data[i][idxFreddo] : '',
        VALUTAZIONE_BOSS: idxBoss !== -1 ? data[i][idxBoss] : ''
      });
    }
    
    return { ok: true, rows: rows };
  } catch(e) {
    return { ok: false, error: e.toString() };
  }
}

/**
 * Carica i festeggiati del giorno
 */
function coGetFesteggiatiOggi(tok) {
  var sessione = _verificaSessioneCentrale(tok);
  if (!sessione) return { ok: false, error: "Non autorizzato" };
  
  // Sfrutta il motore già pronto nel tuo backend
  try {
    var ss = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID || ID_SHEET);
    var sh = ss.getSheetByName('CONTATTI_RUBRICA');
    var festeggiati = [];
    if (!sh) return { ok: true, festeggiati: [] };
    
    var data = sh.getDataRange().getValues();
    var oggi = new Date();
    var dStr = Utilities.formatDate(oggi, CONFIG.TIMEZONE || "GMT+2", "dd/MM");
    
    // Assumiamo testata fissa: TELEFONO (0), NOME_COMPLETO (1) o struttura simile da diagnosi
    for(var i=1; i<data.length; i++) {
      var nato = data[i][4] instanceof Date ? Utilities.formatDate(data[i][4], "GMT+2", "dd/MM") : String(data[i][4]);
      if(nato.indexOf(dStr) !== -1) {
        festeggiati.push({
          nome: data[i][1] || data[i][0] || "Cliente",
          telefono: String(data[i][0] || data[i][2]).replace(/\D/g,''),
          tipo: 'compleanno',
          email: data[i][3] || ''
        });
      }
    }
    return { ok: true, festeggiati: festeggiati };
  } catch(e) {
    return { ok: true, festeggiati: [] };
  }
}

/**
 * Carica appuntamenti dei prossimi 7 giorni
 */
function coGetAppuntamenti(tok) {
  var sessione = _verificaSessioneCentrale(tok);
  if (!sessione) return { ok: false, error: "Non autorizzato" };
  
  try {
    var calId = (typeof CONFIG !== 'undefined' && CONFIG.CALENDAR_ID) ? CONFIG.CALENDAR_ID : "primary";
    var cal = CalendarApp.getCalendarById(calId);
    var oggi = new Date();
    var traSetteGiorni = new Date(oggi.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    var eventiCal = cal.getEvents(oggi, traSetteGiorni);
    var eventi = eventiCal.map(function(e) {
      return {
        titolo: e.getTitle(),
        inizio: Utilities.formatDate(e.getStartTime(), "Europe/Rome", "dd/MM HH:mm"),
        luogo: e.getLocation() || ''
      };
    });
    return { ok: true, eventi: eventi };
  } catch(e) {
    return { ok: true, eventi: [] };
  }
}
// ============================================================
//  DATABASE-LEVEL FUNCTIONS (db*)
// ============================================================

function dbIncrociAcquirenti(immobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.ACQUIRENTI);
    if (!sh) return { ok: true, matches: [] };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, matches: [] };
    var h = data[0];
    var prezzoImm = parseFloat(String(immobile.PREZZO).replace(/[^0-9.]/g,'')) || 0;
    var matches = data.slice(1).filter(function(r) {
      var obj = {}; h.forEach(function(k,i){ obj[k]=r[i]; });
      var zonaMatch = !immobile.CITTA || !obj['ZONA_INTERESSE'] || String(obj['ZONA_INTERESSE']).toLowerCase().indexOf(String(immobile.CITTA).toLowerCase()) !== -1;
      var budgetMax = parseFloat(String(obj['BUDGET_MAX']).replace(/[^0-9.]/g,'')) || 0;
      var budgetMatch = budgetMax === 0 || prezzoImm === 0 || prezzoImm <= budgetMax * 1.15;
      var tipoMatch = !immobile.TIPOLOGIA || !obj['TIPOLOGIA_CERCATA'] || String(obj['TIPOLOGIA_CERCATA']).toLowerCase().indexOf(String(immobile.TIPOLOGIA).toLowerCase()) !== -1;
      return zonaMatch && budgetMatch && tipoMatch;
    }).map(function(r) {
      var obj = {}; h.forEach(function(k,i){ obj[k]=r[i]; }); return obj;
    });
    return { ok: true, matches: matches };
  } catch(e) { return { ok: false, error: e.message }; }
}

function dbSalvaFeedbackVisita(dati) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.VISITE);
    if (!sh) return { ok: false, error: 'Tab VISITE_CO non trovato' };
    var voti = [parseFloat(dati.PANORAMA)||0, parseFloat(dati.QUALITA_INTERNA)||0, parseFloat(dati.STRUTTURA)||0, parseFloat(dati.PREZZO)||0, parseFloat(dati.POTENZIALE)||0];
    var media = (voti.reduce(function(a,b){return a+b;},0)/voti.length).toFixed(2);
    var id = 'VIS-' + new Date().getTime();
    sh.appendRow([id, dati.ID_IMMOBILE, new Date().toLocaleDateString('it-IT'), dati.CLIENTE, dati.TELEFONO, voti[0],voti[1],voti[2],voti[3],voti[4], media, dati.NOTE||'', dati.AUDIO_URL||'']);
    _resetGiorniSenzaVisite(dati.ID_IMMOBILE);
    return { ok: true, id: id, media: media };
  } catch(e) { return { ok: false, error: e.message }; }
}

function dbLookupTelefono(telefono) {
  try {
    var ss=SpreadsheetApp.openById(ID_SHEET);
    var sh=ss.getSheetByName(CO_TABS.RUBRICA);
    if (!sh) return { ok: true, contatto: null };
    var data=sh.getDataRange().getValues();
    var h=data[0], colTel=h.indexOf('TELEFONO');
    if (colTel<0) return { ok: true, contatto: null };
    var clean=String(telefono).replace(/\D/g,'');
    var found=data.slice(1).find(function(r){return String(r[colTel]).replace(/\D/g,'').endsWith(clean);});
    if (!found) return { ok: true, contatto: null };
    var obj={}; h.forEach(function(k,i){obj[k]=found[i];}); return { ok: true, contatto: obj };
  } catch(e) { return { ok: false, error: e.message }; }
}

function dbGetProposte(idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPOSTE);
    if (!sh) return { ok: true, rows: [] };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, rows: [] };
    var h = data[0];
    var rows = data.slice(1).filter(function(r){ return r[h.indexOf('ID_IMMOBILE')]===idImmobile; }).map(function(r){ var obj={}; h.forEach(function(k,i){obj[k]=r[i];}); return obj; });
    return { ok: true, rows: rows };
  } catch(e) { return { ok: false, error: e.message }; }
}

function dbBenchmark(zona, tipologia) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.BENCHMARK);
    if (!sh) return { ok: true, benchmark: null };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, benchmark: null };
    var h = data[0];
    var found = data.slice(1).find(function(r){ return String(r[0]).toLowerCase()===String(zona).toLowerCase()&&String(r[1]).toLowerCase()===String(tipologia).toLowerCase(); });
    if (!found) return { ok: true, benchmark: null };
    var obj = {}; h.forEach(function(k,i){obj[k]=found[i];}); return { ok: true, benchmark: obj };
  } catch(e) { return { ok: false, error: e.message }; }
}

