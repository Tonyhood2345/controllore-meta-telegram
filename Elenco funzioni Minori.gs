// ==========================================

// ══════════════════════════════════════════════════════════════
// ── 8. REPORT, ELENCHI E FUNZIONI MINORI ──────────────────────
// ══════════════════════════════════════════════════════════════
function ottieniChatCompleta(nomeCercato) { /* Funzionalità intatta */ }


function cercaInRubricaGoogle(nomeCercato, orario) { return null; }


function respondOK() { return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT); }

function generaTicket() { return 'VEND-' + Math.floor(1000 + Math.random() * 9000); }
function estraiLinkSocial(testo) { let links = { yt: '', fb: '', ig: '', tk: '' }, urls = testo.match(/\bhttps?:\/\/\S+/gi) || []; urls.forEach(function(u) { if (u.includes('youtube.com') || u.includes('youtu.be')) links.yt = u; else if (u.includes('facebook.com')) links.fb = u; else if (u.includes('instagram.com')) links.ig = u; else if (u.includes('tiktok.com')) links.tk = u; }); return links; }
function registraRichiestaUnificata(data, nome, telefono, operazione, tipologia, citta, budget) { try { let sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).getSheetByName('DATABASE_RICHIESTE'); if (!sheet) { sheet = SpreadsheetApp.openById(CONFIG.LOG_SHEET_ID).insertSheet('DATABASE_RICHIESTE'); sheet.appendRow(['DATA', 'NOME CLIENTE', 'TELEFONO', 'OPERAZIONE', 'TIPOLOGIA', 'CITTÀ', 'BUDGET']); } sheet.appendRow([data, nome, telefono, operazione, tipologia, citta, budget]); } catch(e) {} }
function ottieniSchedaCliente(nome) { /* Funzionalità intatta */ }
function impostaWebhookTelegram() { const url = 'https://api.telegram.org/bot' + CONFIG.TELEGRAM_TOKEN + '/setWebhook?url=' + ScriptApp.getService().getUrl(); Logger.log(UrlFetchApp.fetch(url).getContentText()); }

function SVEGLIA_DARIA() {
  const token = CONFIG.WHATSAPP_TOKEN, metaPhoneId = CONFIG.META_PHONE_ID, tuoNumero = '393201667156';
  if (!token || token === '') { Logger.log("❌ ERRORE: Token vuoto!"); return; }
  Logger.log("⏳ Invio a +" + tuoNumero + "...");
  const res = UrlFetchApp.fetch('https://graph.facebook.com/v18.0/' + metaPhoneId + '/messages', { method: 'post', contentType: 'application/json', headers: { 'Authorization': 'Bearer ' + token }, payload: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', to: tuoNumero, type: 'text', text: { body: "🚀 BIP BOP! DarIA è ONLINE! 🏡💼" } }), muteHttpExceptions: true });
  Logger.log("📡 Risposta: " + res.getContentText());
}



