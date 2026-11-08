// ==========================================

// ============================================================
//  CENTRALE OPERATIVA BOSS — SuperAgenda73  v2.0
//  Novità: proprietari multipli da DB_PROPRIETARI, autosave,
//          alert 3 mesi prezzo, messaggio appuntamento
// ============================================================

var CO_TABS = {
  IMMOBILI:    'INCARICHI_IMMOBILI',
  RUBRICA:     'CONTATTI_RUBRICA',
  ACQUIRENTI:  'DATABASE_RICHIESTE',
  PROPRIETARI: 'DB_PROPRIETARI',
  VISITE:      'VISITE_CO',
  PROPOSTE:    'STORICO_PROPOSTE',
  BENCHMARK:   'BENCHMARK_ZONA',
  BOZZE:       'CO_BOZZE_IMMOBILI'
};



// ─── INIT SHEET ─────────────────────────────────────────────
function coInitSheet() {
  var ss = SpreadsheetApp.openById(ID_SHEET);
  var tabsNeeded = [
    { name: CO_TABS.VISITE,    headers: ['ID_VISITA','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','PANORAMA','QUALITA_INTERNA','STRUTTURA','PREZZO','POTENZIALE','MEDIA','NOTE','AUDIO_URL'] },
    { name: CO_TABS.PROPOSTE,  headers: ['ID','ID_IMMOBILE','DATA','CLIENTE','TELEFONO','IMPORTO_OFFERTA','PREZZO_RICHIESTO','SCOSTAMENTO_PCT','ESITO','NOTE'] },
    { name: CO_TABS.BENCHMARK, headers: ['ZONA','TIPOLOGIA','PREZZO_MQ_MIN','PREZZO_MQ_MAX','PREZZO_MQ_MEDIO','FONTE','DATA_AGGIORNAMENTO'] },
    { name: CO_TABS.RUBRICA,   headers: ['NOME','COGNOME','TELEFONO','EMAIL','DATA_NASCITA','DATA_ONOMASTICO','RUOLO','NOTE'] },
    { name: CO_TABS.BOZZE,     headers: ['ID_BOZZA','ID_IMMOBILE','DATA_BOZZA','DATI_JSON','STATO'] }
  ];
  tabsNeeded.forEach(function(t) {
    if (!ss.getSheetByName(t.name)) {
      var sh = ss.insertSheet(t.name);
      sh.appendRow(t.headers);
      sh.getRange(1,1,1,t.headers.length).setFontWeight('bold').setBackground('#1e293b').setFontColor('#f8fafc');
      Logger.log('Creato: ' + t.name);
    }
  });
}


function coSalvaImmobile(dati) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.IMMOBILI);
    if (!sh) return { ok: false, error: 'Tab non trovato' };
    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var id = dati.ID_IMMOBILE || ('IMM-' + new Date().getTime());
    dati.ID_IMMOBILE = id;
    dati.DATA_INSERIMENTO = dati.DATA_INSERIMENTO || new Date().toLocaleDateString('it-IT');
    dati.STATO = dati.STATO || 'Disponibile';
    dati.GIORNI_SENZA_VISITE = dati.GIORNI_SENZA_VISITE || 0;
    dati.DATA_INCARICO = dati.DATA_INCARICO || new Date().toLocaleDateString('it-IT');

    // Se aggiornamento (rowNum passato), aggiorna la riga
    if (dati._row) {
      var rowNum = parseInt(dati._row);
      headers.forEach(function(h, j) {
        if (dati[h] !== undefined && h !== '_row') {
          sh.getRange(rowNum, j+1).setValue(dati[h]);
        }
      });
      // Cancella bozza se esiste
      if (dati.ID_BOZZA) coEliminaBozza(dati.ID_BOZZA);
      return { ok: true, id: id, aggiornato: true };
    }

    var row = headers.map(function(h) { return dati[h] !== undefined ? dati[h] : ''; });
    sh.appendRow(row);
    if (dati.ID_BOZZA) coEliminaBozza(dati.ID_BOZZA);
    return { ok: true, id: id, aggiornato: false };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coEliminaImmobile(rowNum) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.IMMOBILI);
    if (!sh) return { ok: false, error: 'Tab non trovato' };
    sh.deleteRow(parseInt(rowNum));
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coAggiornaImmobile(rowNum, campo, valore) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.IMMOBILI);
    var headers = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var col = headers.indexOf(campo) + 1;
    if (col === 0) return { ok: false, error: 'Campo non trovato: ' + campo };
    sh.getRange(rowNum, col).setValue(valore);
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ============================================================
//  AUTOSAVE / BOZZE
// ============================================================

function coSalvaBozza(idImmobile, datiJson) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.BOZZE);
    if (!sh) return { ok: false, error: 'Tab CO_BOZZE_IMMOBILI non trovato' };

    var data = sh.getDataRange().getValues();
    var h = data[0];
    var colId = h.indexOf('ID_IMMOBILE');
    var idBozza = 'BZ-' + new Date().getTime();

    // Cerca bozza esistente per stesso immobile e aggiorna
    for (var i = 1; i < data.length; i++) {
      if (data[i][colId] === idImmobile) {
        sh.getRange(i+1, h.indexOf('DATA_BOZZA')+1).setValue(new Date().toLocaleString('it-IT'));
        sh.getRange(i+1, h.indexOf('DATI_JSON')+1).setValue(datiJson);
        sh.getRange(i+1, h.indexOf('STATO')+1).setValue('bozza');
        return { ok: true, id: data[i][h.indexOf('ID_BOZZA')], nuovo: false };
      }
    }
    // Nuova bozza
    sh.appendRow([idBozza, idImmobile, new Date().toLocaleString('it-IT'), datiJson, 'bozza']);
    return { ok: true, id: idBozza, nuovo: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coEliminaBozza(idBozza) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.BOZZE);
    if (!sh) return { ok: true };
    var data = sh.getDataRange().getValues();
    for (var i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === idBozza) { sh.deleteRow(i+1); break; }
    }
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

// ============================================================
//  SEZIONE PROPRIETARI (DB_PROPRIETARI)
// ============================================================

function coGetProprietariImmobile(idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPRIETARI);
    if (!sh) return { ok: false, error: 'Tab DB_PROPRIETARI non trovato' };

    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, proprietari: [] };
    var h = data[0];
    var colImm = h.indexOf('ID_IMMOBILE');
    if (colImm < 0) return { ok: false, error: 'Colonna ID_IMMOBILE non trovata in DB_PROPRIETARI' };

    var proprietari = data.slice(1).filter(function(r) {
      return String(r[colImm]).trim() === String(idImmobile).trim();
    }).map(function(r) {
      var obj = {};
      h.forEach(function(k, i) { obj[k] = r[i]; });
      return obj;
    });
    return { ok: true, proprietari: proprietari };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coGetTuttiProprietari() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPRIETARI);
    if (!sh) return { ok: false, error: 'Tab DB_PROPRIETARI non trovato' };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, rows: [] };
    var h = data[0];
    var rows = data.slice(1).map(function(r, i) {
      var obj = { _row: i + 2 };
      h.forEach(function(k, j) { obj[k] = r[j]; });
      return obj;
    });
    return { ok: true, rows: rows };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coLookupProprietarioPerTelefono(telefono) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPRIETARI);
    if (!sh) return { ok: true, trovati: [] };
    var data = sh.getDataRange().getValues();
    if (data.length < 2) return { ok: true, trovati: [] };
    var h = data[0];
    var colTel = h.indexOf('TELEFONO');
    if (colTel < 0) return { ok: true, trovati: [] };
    var clean = String(telefono).replace(/\D/g, '');
    var trovati = data.slice(1).filter(function(r) {
      return String(r[colTel]).replace(/\D/g,'').endsWith(clean);
    }).map(function(r) {
      var obj = {};
      h.forEach(function(k, i) { obj[k] = r[i]; });
      return obj;
    });
    return { ok: true, trovati: trovati };
  } catch(e) { return { ok: false, error: e.message }; }
}

// Collega un proprietario esistente a un immobile (aggiunge ID_IMMOBILE al record)
function coCollegaProprietario(rowProp, idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPRIETARI);
    var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var colImm = h.indexOf('ID_IMMOBILE') + 1;
    if (colImm === 0) return { ok: false, error: 'Colonna ID_IMMOBILE non trovata' };
    // Supporta immobili multipli: aggiunge con separatore ;
    var valoreAttuale = sh.getRange(rowProp, colImm).getValue();
    var ids = valoreAttuale ? String(valoreAttuale).split(';').map(function(s){return s.trim();}) : [];
    if (ids.indexOf(idImmobile) === -1) ids.push(idImmobile);
    sh.getRange(rowProp, colImm).setValue(ids.join(';'));
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}

function coScollegaProprietario(rowProp, idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPRIETARI);
    var h = sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
    var colImm = h.indexOf('ID_IMMOBILE') + 1;
    if (colImm === 0) return { ok: false, error: 'Colonna ID_IMMOBILE non trovata' };
    var valoreAttuale = sh.getRange(rowProp, colImm).getValue();
    var ids = String(valoreAttuale).split(';').map(function(s){return s.trim();}).filter(function(id){ return id !== idImmobile; });
    sh.getRange(rowProp, colImm).setValue(ids.join(';'));
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
}



function _resetGiorniSenzaVisite(idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.IMMOBILI);
    var data = sh.getDataRange().getValues();
    var h = data[0];
    var colId = h.indexOf('ID_IMMOBILE'), colGiorni = h.indexOf('GIORNI_SENZA_VISITE'), colUlt = h.indexOf('DATA_ULTIMA_VISITA');
    for (var i = 1; i < data.length; i++) {
      if (data[i][colId] === idImmobile) {
        if (colGiorni>=0) sh.getRange(i+1,colGiorni+1).setValue(0);
        if (colUlt>=0) sh.getRange(i+1,colUlt+1).setValue(new Date().toLocaleDateString('it-IT'));
        break;
      }
    }
  } catch(e) { Logger.log('_resetGiorniSenzaVisite: '+e.message); }
}

// ============================================================
//  SEZIONE STORICO PROPOSTE
// ============================================================

function coSalvaProposta(dati) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.PROPOSTE);
    if (!sh) return { ok: false, error: 'Tab non trovato' };
    var offerta = parseFloat(dati.IMPORTO_OFFERTA)||0;
    var richiesto = parseFloat(dati.PREZZO_RICHIESTO)||1;
    var scostamento = (((offerta-richiesto)/richiesto)*100).toFixed(2)+'%';
    sh.appendRow(['PRO-'+new Date().getTime(), dati.ID_IMMOBILE, new Date().toLocaleDateString('it-IT'), dati.CLIENTE, dati.TELEFONO, offerta, richiesto, scostamento, dati.ESITO||'In valutazione', dati.NOTE||'']);
    return { ok: true, scostamento: scostamento };
  } catch(e) { return { ok: false, error: e.message }; }
}



// ============================================================
//  ALERT PREZZO 3 MESI — trigger mensile
// ============================================================

function coCheckImmobiliInvenduti() {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var sh = ss.getSheetByName(CO_TABS.IMMOBILI);
    if (!sh) return;

    var data = sh.getDataRange().getValues();
    var h = data[0];
    var colId      = h.indexOf('ID_IMMOBILE');
    var colTipo    = h.indexOf('TIPOLOGIA');
    var colVia     = h.indexOf('VIA');
    var colCitta   = h.indexOf('CITTA');
    var colPrezzo  = h.indexOf('PREZZO');
    var colStato   = h.indexOf('STATO');
    var colData    = h.indexOf('DATA_INCARICO');
    var colAllert  = h.indexOf('ALERT_PREZZO_3M');

    var oggi = new Date();
    var segnalati = [];

    for (var i = 1; i < data.length; i++) {
      var stato = String(data[i][colStato]||'').toLowerCase();
      if (stato === 'venduto' || stato === 'ritirato') continue;

      var dataIncarico = data[i][colData] ? new Date(data[i][colData]) : null;
      if (!dataIncarico || isNaN(dataIncarico)) continue;

      var giorniSulMercato = Math.floor((oggi - dataIncarico) / (1000*60*60*24));
      if (giorniSulMercato < 90) continue;

      // Già segnalato questo mese?
      var meseCorrente = Utilities.formatDate(oggi, 'Europe/Rome', 'yyyy-MM');
      if (colAllert >= 0 && String(data[i][colAllert]).startsWith(meseCorrente)) continue;

      var idImm    = data[i][colId];
      var tipologia= data[i][colTipo];
      var via      = data[i][colVia];
      var citta    = data[i][colCitta];
      var prezzo   = data[i][colPrezzo];

      segnalati.push({ id: idImm, tipologia: tipologia, via: via, citta: citta, prezzo: prezzo, giorni: giorniSulMercato, row: i+1 });

      // Segna data alert
      if (colAllert >= 0) sh.getRange(i+1, colAllert+1).setValue(meseCorrente + ' - segnalato');
    }

    if (segnalati.length === 0) { Logger.log('Nessun immobile invenduto da segnalare.'); return; }

    // Componi messaggio a Antonio
    var testo = '⚠️ *ALERT PREZZO — Centrale Operativa*\n\n';
    testo += 'Caro Antonio, ' + segnalati.length + ' immobile/i non si vende/ono da oltre 90 giorni:\n\n';
    segnalati.forEach(function(s, idx) {
      testo += (idx+1) + ') *' + (s.tipologia||'Immobile') + '* — ' + (s.via||'') + ', ' + (s.citta||'') + '\n';
      testo += '   💰 Prezzo: ' + _formatEuroGas(s.prezzo) + '\n';
      testo += '   📅 Sul mercato da: ' + s.giorni + ' giorni\n\n';
    });
    testo += '💡 _Forse è il momento di rivedere il prezzo con i proprietari._\n';
    testo += '\nUsa la dashboard → 📋 Messaggio Appuntamento per contattarli.';

    // Invia a Antonio (3201667156)
    _inviaDarIA('3201667156', testo);
    Logger.log('Alert prezzo inviato per ' + segnalati.length + ' immobile/i.');
  } catch(e) {
    Logger.log('coCheckImmobiliInvenduti error: ' + e.message);
  }
}

// Genera il messaggio da inviare AI PROPRIETARI (lo invia Antonio manualmente)
function coGeneraMessaggioAppuntamento(idImmobile) {
  try {
    var ss = SpreadsheetApp.openById(ID_SHEET);
    var shImm = ss.getSheetByName(CO_TABS.IMMOBILI);
    if (!shImm) return { ok: false, error: 'Tab DATABASE_IMMOBILI non trovato' };

    var data = shImm.getDataRange().getValues();
    var h = data[0];
    var immRow = null;
    for (var i = 1; i < data.length; i++) {
      if (data[i][h.indexOf('ID_IMMOBILE')] === idImmobile) { immRow = data[i]; break; }
    }
    if (!immRow) return { ok: false, error: 'Immobile non trovato' };

    var tipologia = immRow[h.indexOf('TIPOLOGIA')] || 'immobile';
    var via       = immRow[h.indexOf('VIA')] || '';
    var citta     = immRow[h.indexOf('CITTA')] || '';
    var prezzo    = immRow[h.indexOf('PREZZO')] || '';
    var colData   = h.indexOf('DATA_INCARICO');
    var dataInc   = colData >= 0 ? immRow[colData] : '';

    // Recupera proprietari collegati
    var resProp = coGetProprietariImmobile(idImmobile);
    var proprietari = resProp.ok ? resProp.proprietari : [];

    var indirizzo = (via + (citta ? ', ' + citta : '')).trim();

    // Messaggio WhatsApp (warm, professionale)
    var msgWA = '📋 *AGENZIA IMMOBILIARE GIANCANI — Favara*\n\n';
    msgWA += 'Gentile';
    if (proprietari.length > 0) {
      var nomiProp = proprietari.map(function(p){ return ' *' + (p.NOME||'') + ' ' + (p.COGNOME||'') + '*'; }).join(' e');
      msgWA += nomiProp;
    } else {
      msgWA += ' Proprietario/a';
    }
    msgWA += ',\n\n';
    msgWA += 'Le scrivo in merito al ' + tipologia.toLowerCase() + ' di *' + (indirizzo||'sua proprietà') + '*';
    if (prezzo) msgWA += ', attualmente proposto a *' + _formatEuroGas(prezzo) + '*';
    msgWA += '.\n\n';
    msgWA += 'Dopo un\'attenta analisi del mercato e dei riscontri ricevuti dai potenziali acquirenti, ';
    msgWA += 'ritengo utile incontrarci per condividere alcune riflessioni riguardo al posizionamento del prezzo. ';
    msgWA += 'Il mercato in questo momento ci offre ancora buone opportunità, ma è fondamentale presentarci ';
    msgWA += 'con una proposta competitiva per non perdere le occasioni giuste.\n\n';
    msgWA += '📅 Sarei lieto di fissare un appuntamento presso il nostro ufficio ';
    msgWA += '(Corso Vittorio Veneto 151, Favara) per aggiornare insieme la strategia di vendita.\n\n';
    msgWA += '_Quando sarebbe disponibile questa settimana o la prossima?_\n\n';
    msgWA += 'Rimango a sua disposizione.\n';
    msgWA += 'Cordiali saluti,\n*Antonio Giancani*\n📞 +39 320 166 7156';

    // Messaggio Email
    var msgEmail = 'Oggetto: Aggiornamento strategia di vendita — ' + (indirizzo||'Sua proprietà') + '\n\n';
    msgEmail += 'Gentile';
    if (proprietari.length > 0) {
      msgEmail += proprietari.map(function(p){ return ' ' + (p.NOME||'') + ' ' + (p.COGNOME||''); }).join(' e');
    } else {
      msgEmail += ' Proprietario/a';
    }
    msgEmail += ',\n\n';
    msgEmail += 'Mi permetto di contattarLa in merito al ' + tipologia.toLowerCase();
    msgEmail += indirizzo ? ' sito in ' + indirizzo : '';
    msgEmail += ', affidatoci in data ' + (dataInc || 'recente') + '.\n\n';
    msgEmail += 'Dopo aver analizzato attentamente l\'andamento del mercato locale e le ';
    msgEmail += 'impressioni raccolte dai potenziali acquirenti che hanno visionato l\'immobile, ';
    msgEmail += 'ritengo opportuno incontrarci per una revisione congiunta della strategia di vendita.\n\n';
    msgEmail += 'Una piccola correzione del prezzo potrebbe rivelarsi determinante per ';
    msgEmail += 'accelerare i tempi di vendita e massimizzare il risultato complessivo.\n\n';
    msgEmail += 'La invito pertanto a fissare un appuntamento presso il nostro studio:\n';
    msgEmail += 'Agenzia Immobiliare Giancani\n';
    msgEmail += 'Corso Vittorio Veneto 151, 92026 Favara (AG)\n\n';
    msgEmail += 'Sono disponibile nei seguenti giorni: lunedì–venerdì ore 9:00–13:00 / 16:00–19:00.\n\n';
    msgEmail += 'Rimango a Sua disposizione per qualsiasi chiarimento.\n\n';
    msgEmail += 'Distinti saluti,\n';
    msgEmail += 'Antonio Giancani\n';
    msgEmail += 'Agenzia Immobiliare Giancani\n';
    msgEmail += 'Tel: +39 320 166 7156 | +39 350 590 2923\n';
    msgEmail += 'www.immobiliaregiancani.it';

    return {
      ok: true,
      msgWA: msgWA,
      msgEmail: msgEmail,
      proprietari: proprietari,
      immobile: { tipologia: tipologia, indirizzo: indirizzo, prezzo: prezzo }
    };
  } catch(e) { return { ok: false, error: e.message }; }
}

function _formatEuroGas(v) {
  var n = parseFloat(String(v).replace(/[^0-9.]/g,''));
  if (!n) return String(v);
  return '€ ' + n.toLocaleString('it-IT');
}

// ============================================================
//  COMPLEANNI & ONOMASTICI
// ============================================================

function coCheckFesteggiati() {
  var oggi = new Date();
  var oggiMM = oggi.getMonth()+1, oggiDD = oggi.getDate();
  var ss = SpreadsheetApp.openById(ID_SHEET);
  var sh = ss.getSheetByName(CO_TABS.RUBRICA);
  if (!sh) return;
  var data = sh.getDataRange().getValues();
  var festeggiati = [];
  data.slice(1).forEach(function(r) {
    var nome = r[0]+' '+r[1], tel = String(r[2]).replace(/\D/g,''), email = r[3];
    if (r[4]) { var dn=new Date(r[4]); if(!isNaN(dn)&&dn.getMonth()+1===oggiMM&&dn.getDate()===oggiDD) festeggiati.push({nome:nome,telefono:tel,email:email,tipo:'compleanno'}); }
    if (r[5]) { var on=new Date(r[5]); if(!isNaN(on)&&on.getMonth()+1===oggiMM&&on.getDate()===oggiDD) festeggiati.push({nome:nome,telefono:tel,email:email,tipo:'onomastico'}); }
  });
  if (festeggiati.length===0) return;
  PropertiesService.getScriptProperties().setProperty('CO_FESTEGGIATI_'+Utilities.formatDate(oggi,'Europe/Rome','yyyyMMdd'), JSON.stringify(festeggiati));
  festeggiati.forEach(function(f){ if(f.telefono) _inviaDarIA(f.telefono, _testoAuguri(f.nome, f.tipo)); });
}


function coGetWaLink(telefono, tipo, nomeCompleto) {
  var testo = encodeURIComponent(_testoAuguri(nomeCompleto||'', tipo));
  var num = String(telefono).replace(/\D/g,'');
  if (!num.startsWith('39')) num = '39'+num;
  return { ok: true, url: 'https://wa.me/'+num+'?text='+testo };
}

function _inviaDarIA_manual(telefono, tipo) {
  _inviaDarIA(telefono, _testoAuguri('', tipo));
}

function _testoAuguri(nome, tipo) {
  var nomeBreve = nome ? nome.trim().split(' ')[0] : 'amico/a';
  if (tipo==='compleanno') return '🎂 Caro/a *'+nomeBreve+'*, tanti auguri di buon compleanno! 🎉\n\nCon affetto,\n*Antonio Giancani*\nAgenzia Immobiliare Giancani – Favara';
  return '✨ Caro/a *'+nomeBreve+'*, tanti auguri per il tuo onomastico! 🌟\n\nCon stima,\n*Antonio Giancani*\nAgenzia Immobiliare Giancani – Favara';
}

// ============================================================
//  ALERT CLIENTI FREDDI (>10 giorni senza visite)
// ============================================================

function coAggiornaSogliaVisite() {
  try {
    var ss=SpreadsheetApp.openById(ID_SHEET);
    var sh=ss.getSheetByName(CO_TABS.IMMOBILI);
    if (!sh) return;
    var data=sh.getDataRange().getValues();
    var h=data[0];
    var colGiorni=h.indexOf('GIORNI_SENZA_VISITE'), colAllert=h.indexOf('ALERT_FREDDO'), colStato=h.indexOf('STATO');
    if (colGiorni<0) return;
    for (var i=1;i<data.length;i++) {
      var stato=String(data[i][colStato]||'').toLowerCase();
      if (stato==='venduto'||stato==='ritirato') continue;
      var giorni=(parseInt(data[i][colGiorni])||0)+1;
      sh.getRange(i+1,colGiorni+1).setValue(giorni);
      if (colAllert>=0) sh.getRange(i+1,colAllert+1).setValue(giorni>10?'FREDDO':'');
    }
  } catch(e) { Logger.log('coAggiornaSogliaVisite: '+e.message); }
}

// ============================================================
//  IA REWRITE
// ============================================================

function coIARewrite(descrizione) {
  try {
    var groqKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY')||PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY_2');
    if (!groqKey) return { ok: false, error: 'GROQ_API_KEY non trovato' };
    var toni=['emozionale','tecnico','urgente'], risultati={};
    toni.forEach(function(tono){
      var payload={model:'llama3-8b-8192',messages:[{role:'user',content:'Riscrivi questa descrizione immobiliare in tono '+tono+'. Max 120 parole. Solo il testo.\n\n'+descrizione}],max_tokens:300,temperature:0.8};
      var resp=UrlFetchApp.fetch('https://api.groq.com/openai/v1/chat/completions',{method:'post',contentType:'application/json',headers:{'Authorization':'Bearer '+groqKey},payload:JSON.stringify(payload),muteHttpExceptions:true});
      var json=JSON.parse(resp.getContentText());
      risultati[tono]=(json.choices&&json.choices[0]&&json.choices[0].message)?json.choices[0].message.content.trim():'Errore.';
    });
    return { ok: true, risultati: risultati };
  } catch(e) { return { ok: false, error: e.message }; }
}



// ============================================================
//  DARIA — invio WhatsApp
// ============================================================

function _inviaDarIA(telefono, testo) {
  try {
    var token=PropertiesService.getScriptProperties().getProperty('WHATSAPP_TOKEN');
    var phoneId='1142385582281087';
    if (!token) { Logger.log('WHATSAPP_TOKEN mancante'); return; }
    var num=String(telefono).replace(/\D/g,'');
    if (!num.startsWith('39')) num='39'+num;
    var payload={messaging_product:'whatsapp',to:num,type:'text',text:{body:testo}};
    var resp=UrlFetchApp.fetch('https://graph.facebook.com/v19.0/'+phoneId+'/messages',{method:'post',contentType:'application/json',headers:{'Authorization':'Bearer '+token},payload:JSON.stringify(payload),muteHttpExceptions:true});
    Logger.log('DarIA → '+telefono+': HTTP '+resp.getResponseCode());
  } catch(e) { Logger.log('_inviaDarIA error: '+e.message); }
}

// ============================================================
//  INSTALL TRIGGERS
// ============================================================

function coInstallTriggers() {
  var toRemove=['coCheckFesteggiati','coAggiornaSogliaVisite','coCheckImmobiliInvenduti'];
  ScriptApp.getProjectTriggers().forEach(function(t){
    if (toRemove.indexOf(t.getHandlerFunction())!==-1) ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('coCheckFesteggiati').timeBased().everyDays(1).atHour(8).create();
  ScriptApp.newTrigger('coAggiornaSogliaVisite').timeBased().everyDays(1).atHour(9).create();
  // Alert 3 mesi: primo giorno del mese alle 10:00
  ScriptApp.newTrigger('coCheckImmobiliInvenduti').timeBased().onMonthDay(1).atHour(10).create();
  Logger.log('✅ Trigger installati: compleanni 08:00, freddi 09:00, 3mesi il 1° del mese 10:00');
}

