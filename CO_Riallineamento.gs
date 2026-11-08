// ==========================================

// ============================================================
//  CO_Riallineamento.gs — SuperAgenda73
//  Riallinea tutto il sistema: crea INCARICHI_IMMOBILI,
//  migra DB_PROPRIETARI, collega Incarico → Centrale Operativa
//  Esegui: coRiallineamentoCompleto()
// ============================================================

// ─── MAPPA SCHEDE ────────────────────────────────────────────
var SCHEDE = {
  // Pubblicitario (non toccare — si aggiorna ogni giorno con feed portali)
  DB_PUB:         'DATABASE_IMMOBILI',

  // Gestionale incarichi (NUOVO — immobili in vendita da incarico firmato)
  INCARICHI:      'INCARICHI_IMMOBILI',

  // Proprietari (esiste, va migrato)
  PROPRIETARI:    'DB_PROPRIETARI',

  // Incarichi firmati (storico documenti)
  STORICO_INC:    'STORICO_INCARICHI',

  // Acquirenti/richieste (esiste)
  ACQUIRENTI:     'DATABASE_RICHIESTE',

  // Schede clienti (esiste)
  CLIENTI:        'SCHEDE_CLIENTI',

  // Visite (Centrale Operativa)
  VISITE:         'VISITE_CO',
  PROPOSTE:       'STORICO_PROPOSTE',
  BENCHMARK:      'BENCHMARK_ZONA',
  RUBRICA:        'CONTATTI_RUBRICA',
  BOZZE:          'CO_BOZZE_IMMOBILI'
};

// ─── SCHEMA INCARICHI_IMMOBILI ───────────────────────────────
var SCHEMA_INCARICHI_IMMOBILI = [
  'ID_IMMOBILE',           // es. IMM-1234567890 (generato automaticamente)
  'ID_INCARICO',           // collegamento a STORICO_INCARICHI
  'DATA_INCARICO',         // data firma incarico
  'SCADENZA_INCARICO',     // data scadenza
  'TIPO_INCARICO',         // ESCLUSIVA / NON ESCLUSIVA
  'AGENTE',                // Antonio / Andrea Giancani
  'STATO',                 // Disponibile / Trattativa / Venduto / Ritirato / Scaduto
  // Dati immobile
  'TIPOLOGIA',             // Appartamento, Villa, ecc.
  'VIA',
  'NUMERO_CIVICO',
  'CITTA',
  'CAP',
  'ZONA',
  'PIANO',
  'MQ_TOTALI',
  'LOCALI',
  'BAGNI',
  'GARAGE',
  'GIARDINO',
  'CLASSE_ENERGETICA',
  'ANNO_COSTRUZIONE',
  'AFFITTATO',
  'URBANISTICA_CATASTALE',
  'CONDIZIONI_CONDOMINIALI',
  'MUTUO_RESIDUO',
  // Prezzi
  'PREZZO_RICHIESTO',
  'PREZZO_MINIMO',
  'DATA_ROGITO_PREVISTA',
  // Provvigione
  'PROVVIGIONE_TIPO',      // FISSO / PERCENTUALE
  'PROVVIGIONE_EURO',
  'PROVVIGIONE_PCT',
  // Proprietari (IDs separati da ;)
  'ID_PROPRIETARI',        // es. PROP-001;PROP-002
  // Dati catastali (JSON)
  'CATASTO_TIPO',
  'CATASTO_JSON',
  // Media
  'LINK_FOTO',
  'LINK_VIDEO',
  'LAT',
  'LNG',
  // Gestione interna
  'DESCRIZIONE',
  'NOTE_PRIVATE',
  'VALUTAZIONE_BOSS',
  'GIORNI_SUL_MERCATO',
  'GIORNI_SENZA_VISITE',
  'DATA_ULTIMA_VISITA',
  'ALERT_FREDDO',          // FREDDO se >10gg senza visite
  'ALERT_PREZZO_3M',       // mese-anno quando segnalato
  'PIANI_DETTAGLIO',       // JSON [{nome, mq}]
  'DATA_INSERIMENTO'
];

// ─── SCHEMA DB_PROPRIETARI (versione allineata) ──────────────
var SCHEMA_PROPRIETARI = [
  'ID_PROPRIETARIO',       // es. PROP-1234567890
  'NOME',
  'COGNOME',
  'TELEFONO_WA',           // usato per DarIA e lookup
  'EMAIL',
  'CODICE_FISCALE',
  'DATA_NASCITA',          // GG/MM/AAAA
  'LUOGO_NASCITA',
  'INDIRIZZO_RESIDENZA',
  'ID_IMMOBILE',           // IDs separati da ; (INCARICHI_IMMOBILI)
  'NOTE_INTERNE',
  'DATA_INSERIMENTO'
];

// ============================================================
//  FUNZIONE PRINCIPALE — esegui questa
// ============================================================
function coRiallineamentoCompleto() {
  var log = [];
  var ss  = SpreadsheetApp.openById(ID_SHEET);
  log.push('═══════════════════════════════════════════════');
  log.push(' RIALLINEAMENTO SUPERAGENDA73 — ' + new Date().toLocaleString('it-IT'));
  log.push('═══════════════════════════════════════════════');

  // 1. Crea/aggiorna INCARICHI_IMMOBILI
  log.push('\n[1/5] INCARICHI_IMMOBILI');
  _creaOAggiornaTab(ss, SCHEDE.INCARICHI, SCHEMA_INCARICHI_IMMOBILI, '#0c4a6e', '#e0f2fe', log);

  // 2. Migra DB_PROPRIETARI
  log.push('\n[2/5] DB_PROPRIETARI');
  _migraProprietari(ss, log);

  // 3. Crea tab secondari Centrale Operativa se mancano
  log.push('\n[3/5] TAB CENTRALI OPERATIVI');
  var tabsExtra = [
    { name: SCHEDE.VISITE,    headers: ['ID_VISITA','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','PANORAMA','QUALITA_INTERNA','STRUTTURA','PREZZO','POTENZIALE','MEDIA','NOTE','AUDIO_URL'], bg:'#134e4a', fg:'#ccfbf1' },
    { name: SCHEDE.PROPOSTE,  headers: ['ID','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','IMPORTO_OFFERTA','PREZZO_RICHIESTO','SCOSTAMENTO_PCT','ESITO','NOTE'], bg:'#14532d', fg:'#dcfce7' },
    { name: SCHEDE.BENCHMARK, headers: ['ZONA','TIPOLOGIA','PREZZO_MQ_MIN','PREZZO_MQ_MAX','PREZZO_MQ_MEDIO','FONTE','DATA_AGGIORNAMENTO'], bg:'#3b0764', fg:'#f3e8ff' },
    { name: SCHEDE.RUBRICA,   headers: ['NOME','COGNOME','TELEFONO','EMAIL','DATA_NASCITA','DATA_ONOMASTICO','RUOLO','NOTE'], bg:'#7c2d12', fg:'#ffedd5' },
    { name: SCHEDE.BOZZE,     headers: ['ID_BOZZA','ID_IMMOBILE','DATA_BOZZA','DATI_JSON','STATO'], bg:'#3d1a78', fg:'#f3e8ff' }
  ];
  tabsExtra.forEach(function(t) {
    if (!ss.getSheetByName(t.name)) {
      var sh = ss.insertSheet(t.name);
      sh.appendRow(t.headers);
      sh.getRange(1,1,1,t.headers.length).setFontWeight('bold').setBackground(t.bg).setFontColor(t.fg);
      sh.setFrozenRows(1);
      log.push('   ✅ Creato: ' + t.name);
    } else {
      log.push('   ℹ️  Esiste già: ' + t.name);
    }
  });

  // 4. Collega CO_TABS alla nuova scheda INCARICHI_IMMOBILI
  log.push('\n[4/5] Aggiornamento CO_TABS in CentraleOperativa.gs');
  log.push('   ℹ️  CO_TABS.IMMOBILI ora punta a: INCARICHI_IMMOBILI');
  log.push('   ℹ️  Aggiorna manualmente CO_TABS.IMMOBILI = \'INCARICHI_IMMOBILI\' nel file CentraleOperativa.gs');

  // 5. Installa trigger
  log.push('\n[5/5] Trigger');
  _installaTriggerRiallineamento(log);

  log.push('\n═══════════════════════════════════════════════');
  log.push(' ✅ RIALLINEAMENTO COMPLETATO');
  log.push('═══════════════════════════════════════════════');
  log.push('\nProssimi passi MANUALI:');
  log.push('1. In CentraleOperativa.gs cambia: CO_TABS.IMMOBILI = \'INCARICHI_IMMOBILI\'');
  log.push('2. Esegui coSincronizzaIncarichiInImmobili() per popolare INCARICHI_IMMOBILI da STORICO_INCARICHI');
  log.push('3. Fai nuovo deploy della webapp');

  Logger.log(log.join('\n'));
  try { SpreadsheetApp.getUi().alert(log.join('\n')); } catch(e) {}
  return log.join('\n');
}

// ─── CREA O AGGIORNA UN TAB CON SCHEMA ──────────────────────
function _creaOAggiornaTab(ss, nome, schema, bg, fg, log) {
  var sh = ss.getSheetByName(nome);
  if (!sh) {
    sh = ss.insertSheet(nome);
    sh.appendRow(schema);
    sh.getRange(1,1,1,schema.length).setFontWeight('bold').setBackground(bg).setFontColor(fg);
    sh.setFrozenRows(1);
    _formattaColonneImm(sh);
    log.push('   ✅ Creato: ' + nome + ' (' + schema.length + ' colonne)');
    return;
  }
  // Aggiunge colonne mancanti a destra
  var attuali = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  var aggiunte = 0;
  schema.forEach(function(col) {
    if (attuali.indexOf(col) === -1) {
      var nc = sh.getLastColumn() + 1;
      sh.getRange(1,nc).setValue(col).setFontWeight('bold').setBackground(bg).setFontColor(fg);
      aggiunte++;
    }
  });
  if (aggiunte > 0) log.push('   ✅ Aggiornato ' + nome + ': aggiunte ' + aggiunte + ' colonne');
  else log.push('   ℹ️  ' + nome + ': tutte le colonne già presenti');
  sh.setFrozenRows(1);
}

function _formattaColonneImm(sh) {
  try {
    sh.setColumnWidth(1, 160);  // ID_IMMOBILE
    sh.setColumnWidth(2, 130);  // ID_INCARICO
    sh.setColumnWidth(8, 130);  // TIPOLOGIA
    sh.setColumnWidth(9, 180);  // VIA
    sh.setColumnWidth(11, 100); // CITTA
    sh.setColumnWidth(15, 80);  // MQ_TOTALI
    sh.setColumnWidth(27, 130); // PREZZO_RICHIESTO
    sh.setColumnWidth(28, 120); // PREZZO_MINIMO
    sh.setColumnWidth(31, 160); // ID_PROPRIETARI
  } catch(e) {}
}

// ─── MIGRAZIONE DB_PROPRIETARI ───────────────────────────────
function _migraProprietari(ss, log) {
  var sh = ss.getSheetByName(SCHEDE.PROPRIETARI);
  if (!sh) {
    sh = ss.insertSheet(SCHEDE.PROPRIETARI);
    sh.appendRow(SCHEMA_PROPRIETARI);
    sh.getRange(1,1,1,SCHEMA_PROPRIETARI.length).setFontWeight('bold').setBackground('#312e81').setFontColor('#e0e7ff');
    sh.setFrozenRows(1);
    _formattaColonneProp(sh);
    log.push('   ✅ DB_PROPRIETARI creato con schema completo');
    return;
  }

  // Rinomina colonne vecchie
  var rinomina = {
    'Telefono_WA':  'TELEFONO_WA',
    'Nome':         'NOME',
    'Cognome':      'COGNOME',
    'Email':        'EMAIL',
    'Note_Interne': 'NOTE_INTERNE',
    'ID_Proprietario':'ID_PROPRIETARIO'
  };

  var attuali = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
  attuali.forEach(function(h, i) {
    if (rinomina[h]) {
      sh.getRange(1, i+1).setValue(rinomina[h]);
      log.push('   🔄 Rinominata: ' + h + ' → ' + rinomina[h]);
    }
  });

  // Ri-leggi
  attuali = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);

  // Aggiungi colonne mancanti
  var mancanti = SCHEMA_PROPRIETARI.filter(function(c) { return attuali.indexOf(c) === -1; });
  mancanti.forEach(function(col) {
    var nc = sh.getLastColumn() + 1;
    sh.getRange(1, nc).setValue(col).setFontWeight('bold').setBackground('#312e81').setFontColor('#e0e7ff');
    log.push('   ✅ Aggiunta colonna: ' + col);
  });

  // Popola ID_PROPRIETARIO mancanti
  var dati = sh.getDataRange().getValues();
  var h2   = dati[0].map(String);
  var colId = h2.indexOf('ID_PROPRIETARIO') + 1;
  var colTs = h2.indexOf('DATA_INSERIMENTO') + 1;
  if (colId > 0) {
    for (var i = 1; i < dati.length; i++) {
      if (!dati[i][colId-1] || String(dati[i][colId-1]).trim() === '') {
        sh.getRange(i+1, colId).setValue('PROP-' + new Date().getTime() + '-' + i);
      }
      if (colTs > 0 && !dati[i][colTs-1]) {
        sh.getRange(i+1, colTs).setValue(new Date().toLocaleDateString('it-IT'));
      }
    }
    log.push('   ✅ ID_PROPRIETARIO auto-generati per righe esistenti');
  }

  _formattaColonneProp(sh);
  sh.setFrozenRows(1);
}

function _formattaColonneProp(sh) {
  try {
    sh.setColumnWidth(1, 160);  // ID_PROPRIETARIO
    sh.setColumnWidth(2, 100);  // NOME
    sh.setColumnWidth(3, 110);  // COGNOME
    sh.setColumnWidth(4, 140);  // TELEFONO_WA
    sh.setColumnWidth(5, 180);  // EMAIL
    sh.setColumnWidth(6, 140);  // CODICE_FISCALE
    sh.setColumnWidth(10, 220); // ID_IMMOBILE
    sh.setColumnWidth(11, 200); // NOTE_INTERNE
  } catch(e) {}
}

// ─── INSTALLA TRIGGER ────────────────────────────────────────
function _installaTriggerRiallineamento(log) {
  var daRimuovere = ['coMasterDailyTrigger','coCheckFesteggiati','coAggiornaSogliaVisite','coCheckImmobiliInvenduti','coAggiornaMercato'];
  var rimossi = 0;
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (daRimuovere.indexOf(t.getHandlerFunction()) !== -1) {
      ScriptApp.deleteTrigger(t);
      rimossi++;
    }
  });
  log.push('   🗑️  Rimossi ' + rimossi + ' trigger vecchi');

  ScriptApp.newTrigger('coMasterDailyTrigger').timeBased().everyDays(1).atHour(8).create();
  ScriptApp.newTrigger('coCheckImmobiliInvenduti').timeBased().onMonthDay(1).atHour(10).create();
  ScriptApp.newTrigger('coAggiornaMercato').timeBased().everyDays(1).atHour(9).create();
  log.push('   ✅ Trigger installati: MasterDaily 08:00 | Invenduti 1°mese 10:00 | Mercato 09:00');
}

// ============================================================
//  SINCRONIZZAZIONE: STORICO_INCARICHI → INCARICHI_IMMOBILI
//  Esegui DOPO coRiallineamentoCompleto()
// ============================================================
function coSincronizzaIncarichiInImmobili() {
  try {
    var ss       = SpreadsheetApp.openById(ID_SHEET);
    var shSto    = ss.getSheetByName(SCHEDE.STORICO_INC);
    var shImm    = ss.getSheetByName(SCHEDE.INCARICHI);
    if (!shSto || !shImm) return { ok: false, error: 'Tab mancante' };

    var dataSto = shSto.getDataRange().getValues();
    var hSto    = dataSto[0];
    var dataImm = shImm.getDataRange().getValues();
    var hImm    = dataImm[0].map(String);

    // ID già presenti in INCARICHI_IMMOBILI
    var idEsistenti = {};
    for (var i = 1; i < dataImm.length; i++) {
      var idInc = String(dataImm[i][hImm.indexOf('ID_INCARICO')]);
      if (idInc) idEsistenti[idInc] = true;
    }

    var sincronizzati = 0;
    // Usa numeri riga come ID incarico se non esiste colonna specifica
    for (var i = 1; i < dataSto.length; i++) {
      var idInc = 'INC-ROW-' + (i+1);
      if (idEsistenti[idInc]) continue;

      var rigaSto = dataSto[i];
      var dataInc = String(rigaSto[hSto.indexOf('DATA_INCARICO')] || '');
      var agente  = String(rigaSto[hSto.indexOf('AGENTE')] || 'Antonio Giancani');
      var stato   = String(rigaSto[hSto.indexOf('STATO')] || 'Disponibile');
      if (stato === '' || stato === '0') stato = 'Disponibile';

      // Estrai venditore principale
      var v1Nome  = String(rigaSto[hSto.indexOf('VENDITORE_1_NOME')] || '');
      var v1Tel   = String(rigaSto[hSto.indexOf('VENDITORE_1_TEL')]  || '');

      // Prezzi
      var prezzoR  = String(rigaSto[hSto.indexOf('PREZZO_VENDITA_TOTALE')] || '');
      var prezzoM  = String(rigaSto[hSto.indexOf('PREZZO_MINIMO')]          || '');

      // Catasto → indirizzo approssimativo
      var descCat = String(rigaSto[hSto.indexOf('CATASTO_FOGLIO_1')] || '');

      // Crea riga in INCARICHI_IMMOBILI
      var nuovaRiga = new Array(hImm.length).fill('');
      function set(campo, valore) {
        var idx = hImm.indexOf(campo);
        if (idx >= 0) nuovaRiga[idx] = valore;
      }

      var newId = 'IMM-' + new Date().getTime() + '-' + i;
      set('ID_IMMOBILE',        newId);
      set('ID_INCARICO',        idInc);
      set('DATA_INCARICO',      dataInc);
      set('TIPO_INCARICO',      String(rigaSto[hSto.indexOf('TIPO_INCARICO')] || 'ESCLUSIVA'));
      set('AGENTE',             agente);
      set('STATO',              stato);
      set('TIPOLOGIA',          String(rigaSto[hSto.indexOf('TIPO_IMMOBILE')] || ''));
      set('PREZZO_RICHIESTO',   prezzoR);
      set('PREZZO_MINIMO',      prezzoM);
      set('PROVVIGIONE_TIPO',   String(rigaSto[hSto.indexOf('PROVVIGIONE_TIPO')] || ''));
      set('PROVVIGIONE_EURO',   String(rigaSto[hSto.indexOf('PROVVIGIONE_EURO')] || ''));
      set('CATASTO_TIPO',       String(rigaSto[hSto.indexOf('CATASTO_TIPO')] || ''));
      set('SCADENZA_INCARICO',  String(rigaSto[hSto.indexOf('DATA_SCADENZA')] || ''));
      set('GIORNI_SUL_MERCATO', '0');
      set('GIORNI_SENZA_VISITE','0');
      set('DATA_INSERIMENTO',   new Date().toLocaleDateString('it-IT'));

      shImm.appendRow(nuovaRiga);
      sincronizzati++;
    }
    Logger.log('✅ Sincronizzati ' + sincronizzati + ' incarichi in INCARICHI_IMMOBILI');
    return { ok: true, sincronizzati: sincronizzati };
  } catch(e) {
    Logger.log('coSincronizzaIncarichiInImmobili error: ' + e.message);
    return { ok: false, error: e.message };
  }
}

// ============================================================
//  HOOK: salvaDatiIncarico() chiama questa funzione
//  Aggiunge automaticamente l'immobile a INCARICHI_IMMOBILI
//  quando si firma un nuovo incarico
// ============================================================
function coAggiungiImmobileDopoIncarico(datiIncarico, urlPdf) {
  try {
    var ss    = SpreadsheetApp.openById(ID_SHEET);
    var sh    = ss.getSheetByName(SCHEDE.INCARICHI);
    if (!sh) { Logger.log('INCARICHI_IMMOBILI non trovato'); return null; }

    var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);

    function set(riga, campo, valore) {
      var idx = h.indexOf(campo);
      if (idx >= 0) riga[idx] = valore;
    }

    var prezzoR = parseFloat(String(datiIncarico.prezzoVendita||'0').replace(/\./g,'').replace(',','.')) || 0;
    var prezzoM = parseFloat(String(datiIncarico.prezzoMinimo||'0').replace(/\./g,'').replace(',','.'))  || 0;

    var calcProvv = _calcolaProvvLocale(prezzoR);

    // Indirizzo dal catasto
    var indirizzoBase = '';
    if (datiIncarico.catasto && datiIncarico.catasto[0]) {
      indirizzoBase = datiIncarico.catasto[0].descrizione || '';
    }

    // Proprietari IDs (cercati in DB_PROPRIETARI per telefono)
    var idProprietari = [];
    (datiIncarico.venditori || []).forEach(function(v) {
      var idProp = _trovaPropId(ss, v.telefono, v.cf);
      if (!idProp) idProp = _creaProprietario(ss, v);
      if (idProp) idProprietari.push(idProp);
    });

    var dataOggi = new Date().toLocaleDateString('it-IT');
    var newId    = 'IMM-' + new Date().getTime();

    var nuovaRiga = new Array(h.length).fill('');
    set(nuovaRiga, 'ID_IMMOBILE',        newId);
    set(nuovaRiga, 'DATA_INCARICO',      datiIncarico.dataIncarico || dataOggi);
    set(nuovaRiga, 'TIPO_INCARICO',      datiIncarico.tipoIncarico || 'ESCLUSIVA');
    set(nuovaRiga, 'AGENTE',             datiIncarico.agente || 'Antonio Giancani');
    set(nuovaRiga, 'STATO',              'Disponibile');
    set(nuovaRiga, 'TIPOLOGIA',          datiIncarico.tipoImmobile || '');
    set(nuovaRiga, 'AFFITTATO',          datiIncarico.affittato === 'si' ? 'SÌ' : 'NO');
    set(nuovaRiga, 'URBANISTICA_CATASTALE', datiIncarico.urbanisticaCatastale || '');
    set(nuovaRiga, 'CONDIZIONI_CONDOMINIALI', datiIncarico.condizioniCondominiali || '');
    set(nuovaRiga, 'CLASSE_ENERGETICA',  datiIncarico.classeEnergeticaApe || 'N/D');
    set(nuovaRiga, 'MUTUO_RESIDUO',      datiIncarico.mutuoResiduo || '0');
    set(nuovaRiga, 'PREZZO_RICHIESTO',   prezzoR);
    set(nuovaRiga, 'PREZZO_MINIMO',      prezzoM);
    set(nuovaRiga, 'DATA_ROGITO_PREVISTA', datiIncarico.dataRogitoPrevista || '');
    set(nuovaRiga, 'PROVVIGIONE_TIPO',   calcProvv.tipo);
    set(nuovaRiga, 'PROVVIGIONE_EURO',   calcProvv.imponibile);
    set(nuovaRiga, 'PROVVIGIONE_PCT',    calcProvv.pctEquivalente);
    set(nuovaRiga, 'ID_PROPRIETARI',     idProprietari.join(';'));
    set(nuovaRiga, 'CATASTO_TIPO',       datiIncarico.catasto_tipo || 'FABBRICATI');
    set(nuovaRiga, 'CATASTO_JSON',       JSON.stringify(datiIncarico.catasto || []));
    set(nuovaRiga, 'NOTE_PRIVATE',       datiIncarico.noteLibere || '');
    set(nuovaRiga, 'GIORNI_SUL_MERCATO', '0');
    set(nuovaRiga, 'GIORNI_SENZA_VISITE','0');
    set(nuovaRiga, 'ALERT_FREDDO',       '');
    set(nuovaRiga, 'DATA_INSERIMENTO',   dataOggi);

    // Indirizzo (dal catasto)
    if (indirizzoBase) {
      var parti = indirizzoBase.split(' ');
      set(nuovaRiga, 'VIA', indirizzoBase);
    }

    sh.appendRow(nuovaRiga);

    // Collega ID immobile ai proprietari
    idProprietari.forEach(function(idP) {
      _collegaImmobileAProprietario(ss, idP, newId);
    });

    Logger.log('✅ INCARICHI_IMMOBILI: aggiunto ' + newId + ' con ' + idProprietari.length + ' proprietari');
    return newId;
  } catch(e) {
    Logger.log('coAggiungiImmobileDopoIncarico error: ' + e.message);
    return null;
  }
}

// ─── CERCA O CREA PROPRIETARIO ───────────────────────────────
function _trovaPropId(ss, telefono, cf) {
  try {
    var sh = ss.getSheetByName(SCHEDE.PROPRIETARI);
    if (!sh || sh.getLastRow() < 2) return null;
    var data = sh.getDataRange().getValues();
    var h    = data[0].map(String);
    var colTel = h.indexOf('TELEFONO_WA');
    var colCf  = h.indexOf('CODICE_FISCALE');
    var colId  = h.indexOf('ID_PROPRIETARIO');
    var telClean = String(telefono||'').replace(/\D/g,'');
    var cfClean  = String(cf||'').toUpperCase().trim();

    for (var i = 1; i < data.length; i++) {
      var tRiga = String(data[i][colTel]||'').replace(/\D/g,'');
      var cfRiga = String(data[i][colCf]||'').toUpperCase().trim();
      if ((telClean && tRiga.endsWith(telClean.slice(-9))) ||
          (cfClean  && cfRiga === cfClean)) {
        return String(data[i][colId]);
      }
    }
    return null;
  } catch(e) { return null; }
}

function _creaProprietario(ss, venditore) {
  try {
    var sh = ss.getSheetByName(SCHEDE.PROPRIETARI);
    if (!sh) return null;
    var h  = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    var newId = 'PROP-' + new Date().getTime();

    var riga = new Array(h.length).fill('');
    function set(campo, val) { var idx=h.indexOf(campo); if(idx>=0) riga[idx]=val; }

    var nomiParts = String(venditore.nome||'').trim().split(' ');
    set('ID_PROPRIETARIO', newId);
    set('NOME',            nomiParts[0] || '');
    set('COGNOME',         nomiParts.slice(1).join(' ') || '');
    set('TELEFONO_WA',     String(venditore.telefono||'').replace(/\D/g,''));
    set('CODICE_FISCALE',  String(venditore.cf||'').toUpperCase());
    set('DATA_NASCITA',    venditore.dataNascita || '');
    set('LUOGO_NASCITA',   venditore.luogoNascita || '');
    set('INDIRIZZO_RESIDENZA', venditore.residenza || '');
    set('DATA_INSERIMENTO', new Date().toLocaleDateString('it-IT'));

    sh.appendRow(riga);
    Logger.log('✅ Creato proprietario: ' + newId + ' — ' + venditore.nome);
    return newId;
  } catch(e) { Logger.log('_creaProprietario error: '+e.message); return null; }
}

function _collegaImmobileAProprietario(ss, idProp, idImm) {
  try {
    var sh = ss.getSheetByName(SCHEDE.PROPRIETARI);
    if (!sh) return;
    var data = sh.getDataRange().getValues();
    var h    = data[0].map(String);
    var colId  = h.indexOf('ID_PROPRIETARIO') + 1;
    var colImm = h.indexOf('ID_IMMOBILE') + 1;
    if (!colId || !colImm) return;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][colId-1]) === idProp) {
        var esistenti = String(data[i][colImm-1]||'').split(';').map(function(s){return s.trim();}).filter(Boolean);
        if (esistenti.indexOf(idImm) === -1) {
          esistenti.push(idImm);
          sh.getRange(i+1, colImm).setValue(esistenti.join(';'));
        }
        return;
      }
    }
  } catch(e) {}
}

function _calcolaProvvLocale(prezzo) {
  var IVA = 0.22;
  if (prezzo > 0 && prezzo <= 65000) {
    var imp = 2000;
    return { tipo:'FISSO', imponibile:imp, iva:Math.round(imp*IVA*100)/100, totale:Math.round(imp*(1+IVA)*100)/100, pctEquivalente:Math.round((imp/prezzo*100)*100)/100 };
  }
  var imp2 = Math.round(prezzo*0.03*100)/100;
  return { tipo:'PERCENTUALE', imponibile:imp2, iva:Math.round(imp2*IVA*100)/100, totale:Math.round(imp2*(1+IVA)*100)/100, pctEquivalente:3 };
}

// ============================================================
//  AGGIORNA TRIGGER GIORNALIERO: aggiorna GIORNI_SUL_MERCATO
// ============================================================
function coAggiornaMercato() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(SCHEDE.INCARICHI);
    if (!sh || sh.getLastRow() < 2) return;

    var data = sh.getDataRange().getValues();
    var h    = data[0].map(String);
    var colStato   = h.indexOf('STATO');
    var colGiorniM = h.indexOf('GIORNI_SUL_MERCATO');
    var colGiorniV = h.indexOf('GIORNI_SENZA_VISITE');
    var colFreddo  = h.indexOf('ALERT_FREDDO');

    for (var i = 1; i < data.length; i++) {
      var stato = String(data[i][colStato]||'').toLowerCase();
      if (stato === 'venduto' || stato === 'ritirato' || stato === 'scaduto') continue;

      if (colGiorniM >= 0) {
        var gm = (parseInt(data[i][colGiorniM])||0) + 1;
        sh.getRange(i+1, colGiorniM+1).setValue(gm);
      }
      if (colGiorniV >= 0) {
        var gv = (parseInt(data[i][colGiorniV])||0) + 1;
        sh.getRange(i+1, colGiorniV+1).setValue(gv);
        if (colFreddo >= 0) sh.getRange(i+1, colFreddo+1).setValue(gv > 10 ? 'FREDDO' : '');
      }
    }
    Logger.log('✅ coAggiornaMercato: giorni aggiornati');
  } catch(e) { Logger.log('coAggiornaMercato error: '+e.message); }
}

// ============================================================
//  INCROCIO ACQUIRENTI su INCARICHI_IMMOBILI
//  (sostituisce coIncrociAcquirenti in CentraleOperativa.gs)
// ============================================================
function coIncrociAcquirentiV2(immobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(SCHEDE.ACQUIRENTI);
    if (!sh) return { ok: true, matches: [] };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, matches: [] };
    var h    = data[0];
    var prezzoImm = parseFloat(String(immobile.PREZZO_RICHIESTO||immobile.PREZZO||'0').replace(/[^0-9.]/g,'')) || 0;
    var citta     = String(immobile.CITTA||immobile.VIA||'').toLowerCase();
    var tipologia = String(immobile.TIPOLOGIA||'').toLowerCase();

    var matches = data.slice(1).filter(function(r) {
      var obj = {}; h.forEach(function(k,i){ obj[k]=r[i]; });
      var zonaOk    = !citta    || !obj['ZONA_INTERESSE']    || String(obj['ZONA_INTERESSE']).toLowerCase().indexOf(citta) !== -1;
      var budgetMax = parseFloat(String(obj['BUDGET_MAX']||'0').replace(/[^0-9.]/g,'')) || 0;
      var budgetOk  = budgetMax === 0 || prezzoImm === 0 || prezzoImm <= budgetMax * 1.15;
      var tipoOk    = !tipologia || !obj['TIPOLOGIA_CERCATA'] || String(obj['TIPOLOGIA_CERCATA']).toLowerCase().indexOf(tipologia) !== -1;
      return zonaOk && budgetOk && tipoOk;
    }).map(function(r) {
      var obj = {}; h.forEach(function(k,i){ obj[k]=r[i]; }); return obj;
    });
    return { ok: true, matches: matches };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ============================================================
//  DIAGNOSI RIALLINEAMENTO
// ============================================================
function codiagnosi() {
  var ss  = SpreadsheetApp.openById(ID_SHEET);
  var log = ['🔍 DIAGNOSI RIALLINEAMENTO — ' + new Date().toLocaleString('it-IT'), ''];

  var tabDaVerificare = [
    { nome: SCHEDE.INCARICHI,   colonne: ['ID_IMMOBILE','STATO','PREZZO_RICHIESTO','ID_PROPRIETARI','GIORNI_SUL_MERCATO','ALERT_FREDDO'] },
    { nome: SCHEDE.PROPRIETARI, colonne: ['ID_PROPRIETARIO','NOME','COGNOME','TELEFONO_WA','CODICE_FISCALE','ID_IMMOBILE'] },
    { nome: SCHEDE.STORICO_INC, colonne: ['DATA_INCARICO','AGENTE','VENDITORE_1_NOME'] },
    { nome: SCHEDE.ACQUIRENTI,  colonne: ['NOME','TELEFONO','ZONA_INTERESSE','BUDGET_MAX','TIPOLOGIA_CERCATA'] },
    { nome: SCHEDE.VISITE,      colonne: ['ID_VISITA','ID_IMMOBILE','MEDIA'] },
    { nome: SCHEDE.PROPOSTE,    colonne: ['ID','ID_IMMOBILE','SCOSTAMENTO_PCT'] },
    { nome: SCHEDE.BENCHMARK,   colonne: ['ZONA','TIPOLOGIA','PREZZO_MQ_MEDIO'] },
    { nome: SCHEDE.BOZZE,       colonne: ['ID_BOZZA','DATI_JSON','STATO'] },
    { nome: SCHEDE.DB_PUB,      colonne: [] }
  ];

  log.push('📋 STRUTTURA TAB:');
  tabDaVerificare.forEach(function(t) {
    var sh = ss.getSheetByName(t.nome);
    if (!sh) { log.push('  ❌ ' + t.nome + ' — MANCANTE'); return; }
    log.push('  ✅ ' + t.nome + ' — ' + Math.max(0,sh.getLastRow()-1) + ' righe');
    if (t.colonne.length > 0) {
      var hSheet = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
      t.colonne.forEach(function(c) {
        log.push('     ' + (hSheet.indexOf(c)>=0?'✅':'❌') + ' ' + c);
      });
    }
  });

  log.push('\n⏰ TRIGGER:');
  ScriptApp.getProjectTriggers().forEach(function(t) {
    log.push('  ▶ ' + t.getHandlerFunction() + ' [' + t.getEventType() + ']');
  });

  log.push('\n🔑 PROPERTIES:');
  ['WHATSAPP_TOKEN','GROQ_API_KEY'].forEach(function(k) {
    var v = PropertiesService.getScriptProperties().getProperty(k);
    log.push('  ' + (v?'✅':'❌') + ' ' + k);
  });

  var out = log.join('\n');
  Logger.log(out);
  try { SpreadsheetApp.getUi().alert(out); } catch(e) {}
  return out;
}

