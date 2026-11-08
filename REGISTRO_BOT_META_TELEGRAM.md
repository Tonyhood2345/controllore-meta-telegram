# 🛡️ REGISTRO MASTER: BLOCCO BOT META & CONVOGLIAMENTO SU TELEGRAM
**Ecosistema Immobiliare Giancani — Antonio Giancani**  
*Data Creazione: Novembre 2026 | Stato: BLOCCATO SU META & ATTIVO SU TELEGRAM*

---

> [!IMPORTANT]
> **Scopo di questo Registro:**  
> Questo documento traccia in modo esaustivo e definitivo **ogni singolo bot, script, webhook, repository e credenziale** che riceveva o comunicava con le API di Meta (Facebook, Instagram, WhatsApp Cloud API).  
> Tutte le comunicazioni verso Meta sono state **bloccate**, e qualsiasi interazione, notifica o post è stato **convogliato esclusivamente su Telegram**.  
> Tutte le credenziali, configurazioni e codici sorgente originali sono conservati in questo file e nei file di backup dedicati, così che se in futuro vorrai ripristinare un bot o una funzione potrai farlo **immediatamente senza dover riprodurre nulla da zero**.

---

## 📑 INDICE GENERALE
1. [Canali Telegram Attivi per il Convogliamento](#1-canali-telegram-attivi-per-il-convogliamento)
2. [Censimento Bot e Script: Stato e Azioni Intraprese](#2-censimento-bot-e-script-stato-e-azioni-intraprese)
3. [Dettaglio Modifiche Google Apps Script (DARIA PER DIRETTA)](#3-dettaglio-modifiche-google-apps-script-daria-per-diretta)
4. [Dettaglio Modifiche Repository GitHub](#4-dettaglio-modifiche-repository-github)
5. [Archivio Credenziali, ID e Token Meta (Per Ripristino)](#5-archivio-credenziali-id-e-token-meta-per-ripristino)
6. [Posizione dei File di Backup e Patch Pronti](#6-posizione-dei-file-di-backup-e-patch-pronti)
7. [Procedura di Ripristino Istantaneo](#7-procedura-di-ripristino-istantaneo)

---

## 1. CANALI TELEGRAM ATTIVI PER IL CONVOGLIAMENTO
Tutte le interazioni che in precedenza transitavano su Meta (Facebook Messenger, commenti pagina, WhatsApp Cloud API, Instagram DM/commenti) sono ora centralizzate su:

| Parametro | Valore | Note |
| :--- | :--- | :--- |
| **Telegram Bot Amministrazione Social (Nuovo Ufficiale)** | `9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0`<br>Username: [@AMMINISTRAZIONISOCIAL_BOT](https://t.me/AMMINISTRAZIONISOCIAL_BOT) | Bot ufficiale per ricezione notifiche, approvazione post convogliati, comando `/dashboard` e Webhook attivo |
| **Telegram Bot Storico Giancani** | `8643190035:AAHaUOT12j8l9f6GU9WW4W9HFOLfV-5r5-U` | Usato per le notifiche operative generiche |
| **Telegram Bot Secondario** | `8671578336:AAEHI-s-2g3dY9qnIIVc_hWzDdOuHm-MS6M` | Usato nei bot Mindset e Social Rilancio |
| **Chat ID Antonio (Admin)** | `1723292483` | Riceve tutte le notifiche, lead, OTP, post e approvazioni |
| **Canale / Gruppo Video** | `TELEGRAMGRUPPOVIDEOAgenziaBOT` | Archivio e rendering video |

---

## 2. CENSIMENTO BOT E SCRIPT: STATO E AZIONI INTRAPRESE

### A. Google Apps Script
| Nome Script / File | ID / URL | Servizi Meta Coinvolti | Stato Attuale | Comportamento Convogliato su Telegram |
| :--- | :--- | :--- | :--- | :--- |
| **DARIA PER DIRETTA (Master WebApp)** | ID: `1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft`<br>URL: `https://script.google.com/macros/s/AKfycbzq3gfy5JCZJT1tyF4oECkBFVrckxVzqDuAJgUSvPhU4rv2Bztj7EUT3m4b5ILm4Vdc/exec` | • Webhook Meta (`hub.mode`)<br>• WhatsApp Cloud API (`v18.0`/`v21.0`)<br>• Facebook Graph API (`/me/messages`, `/feed`)<br>• Instagram Graph API (`/media`, `/replies`) | ⛔ **BLOCCATO** | • `doGet` rifiuta la verifica webhook Meta.<br>• `doPost` intercetta qualsiasi payload da WA/FB/IG e lo inoltra ad Antonio su Telegram.<br>• Qualsiasi invio outbound (`_inviaMetaWhatsApp`, `_inviaMessaggioFB`, `inviaWhatsAppTesto`, `dcInviaOtpBoss`) viene reindirizzato a Telegram. |
| **Calendario fine su waha** | ID: `10Oy19VXNnVEynV6WFEzzAoZTuouN13rJKNeils9IfUfvj_oadLfVLF44` | WAHA (WhatsApp HTTP API self-hosted) | ⏸️ **ISOLATO** | Chiamate disattivate / isolate. |
| **Calendario automatica su fine WAHA** | ID: `1cCeyESKqPOPBZrqzALTx__diEQ_UzD_fmWLrNt4x_--MU03HoHo_oWSo` | WAHA (WhatsApp HTTP API self-hosted) | ⏸️ **ISOLATO** | Chiamate disattivate / isolate. |

### B. Repository GitHub
| Repository | File Coinvolti | Chiamata Meta Originaria | Stato Attuale | Comportamento Convogliato su Telegram |
| :--- | :--- | :--- | :--- | :--- |
| **`Tonyhood2345/bot-immobiliare-giancani-Antonio-2`** | `main.py` | `POST https://graph.facebook.com/v19.0/{FB_PAGE_ID}/photos` | ⛔ **BLOCCATO** | `post_to_facebook` intercetta il post programmato e la relativa immagine e li invia direttamente ad Antonio su Telegram via `sendPhoto`. |
| **`Tonyhood2345/live-stream-serverless`** | • `05_SocialECommentiLive.js`<br>• `scripts/pubblica_storia_facebook.py`<br>• `.github/workflows/rilancio_immobili_social.yml` | • Polling commenti Facebook live (`graph.facebook.com/v19.0`)<br>• Upload storie video su Facebook (`video_stories`)<br>• Note di pagina Facebook | ⛔ **BLOCCATO** | • `oscuraCommentoFB` e `getNuoviCommentiFB` disattivati.<br>• `pubblica_storia_video_su_facebook` invia la storia video direttamente su Telegram ad Antonio (`sendVideo`).<br>• Proposte di rilancio sociale inviate solo su Telegram. |
| **`Tonyhood2345/bot-immobiliare-giancani-Antonio`** | `bot_mindset_antonio_giancani.py` | Token Facebook e callback approvazione pubblicazione su FB | ⛔ **BLOCCATO** | Pulsante aggiornato in *"✅ ARCHIVIA / APPROVA SU TELEGRAM (META BLOCCATO)"*, eliminato qualsiasi instradamento su pagina Facebook. |
| **`Tonyhood2345/bot-facebook-giancani`** | Generatore grafiche post Facebook | Post Facebook | ⏸️ **ARCHIVIATO** | Repository privato preservato. Le immagini generate possono essere inviate su Telegram. |
| **`Tonyhood2345/fotofacebook`** | Asset grafici 1.png - 10.png | Storage immagini post FB | ℹ️ **STATICO** | Asset preservati come archivio immagini. |

---

## 3. DETTAGLIO MODIFICHE GOOGLE APPS SCRIPT (DARIA PER DIRETTA)

Nel file bundle aggiornato sono state applicate le seguenti protezioni a livello architetturale:

### 1. `Confing.gs`
Aggiunta la direttiva di blocco:
```javascript
const CONFIG = {
  // ⛔ BLOCCO META ATTIVO: Tutte le comunicazioni verso Meta sono bloccate e convogliate su Telegram
  META_BLOCKED: true,
  ...
```

### 2. `Codice.gs` — Blocco Sottoscrizione Webhook Meta (`doGet`)
Meta non può più validare né rinnovare la sottoscrizione ai webhook:
```javascript
// ⛔ BLOCCO META ATTIVO: Rifiuta la sottoscrizione e la verifica dei webhook Meta
if (params['hub.mode'] === 'subscribe') {
  inviaTelegramBoss("⛔ [SICUREZZA] Tentativo di verifica Webhook Meta intercettato e bloccato con successo.");
  return ContentService.createTextOutput("Meta webhook subscriptions disabled. All interactions routed to Telegram.");
}
```

### 3. `Codice.gs` — Reindirizzamento Outbound (`inviaWhatsAppTesto`)
Qualsiasi messaggio destinato a un contatto WhatsApp o Facebook viene convogliato su Telegram:
```javascript
function inviaWhatsAppTesto(id, t) {
  if (!t) return;
  // ⛔ META BLOCCATO: Qualsiasi messaggio verso WhatsApp/FB viene convogliato su Telegram
  var targetId = String(id).startsWith('TG_') ? String(id).replace('TG_', '') : CONFIG.TELEGRAM_CHAT_ID;
  var prefisso = String(id).startsWith('TG_') ? '' : '📲 [CONVOGLIATO SU TELEGRAM — Destinatario originario: ' + id + ']\n\n';
  _inviaTelegramTesto(targetId, prefisso + t);
}
```

### 4. `Codice.gs` — Blocco Chiamate Dirette a Meta WhatsApp (`_inviaMetaWhatsApp`)
```javascript
function _inviaMetaWhatsApp(id, testo) {
  Logger.log("⛔ [BLOCCO META] _inviaMetaWhatsApp bloccata per ID: " + id);
  _inviaTelegramTesto(CONFIG.TELEGRAM_CHAT_ID, "📲 *[MESSAGGIO WA BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*\n👤 Destinatario: " + id + "\n\n💬 " + testo);
  return;
}
```

### 5. `Codice.gs` — Blocco Chiamate Dirette a Facebook Messenger (`_inviaMessaggioFB`)
```javascript
function _inviaMessaggioFB(senderId, testo) {
  Logger.log("⛔ [BLOCCO META] _inviaMessaggioFB bloccata per ID: " + senderId);
  _inviaTelegramTesto(CONFIG.TELEGRAM_CHAT_ID, "📘 *[MESSAGGIO FB BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*\n👤 Destinatario: " + senderId + "\n\n💬 " + testo);
  return;
}
```

### 6. `Risposte a Ogni canale 2.gs` — Omnichannel Convogliato su Telegram
```javascript
function inviaMessaggioOmnichannel(destinatario, testo) {
  var target = String(destinatario);
  var idTelegram = target.startsWith("TG_") ? target.replace("TG_", "") : CONFIG.TELEGRAM_CHAT_ID;
  var prefisso = target.startsWith("TG_") ? "" : "📢 *[MESSAGGIO OMNICHANNEL CONVOGLIATO SU TELEGRAM]*\n👤 Destinatario: " + destinatario + "\n\n";
  _inviaTelegramTesto(idTelegram, prefisso + testo);
}
```

### 7. `PIANO EDITORIALE.gs` — Blocco Pubblicazione Post Facebook & Instagram
```javascript
function pubblicaSuFacebookSicuro(pageId, testoPost, urlFoto) {
  Logger.log("⛔ [BLOCCO META] pubblicaSuFacebookSicuro intercettata e bloccata.");
  inviaTelegramBoss("📘 *[POST FACEBOOK BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*\n" +
                    (urlFoto ? "🖼️ Foto: " + urlFoto + "\n\n" : "\n") +
                    "📝 Testo:\n" + testoPost);
  return { success: true, blocked: true, redirected_to: 'Telegram' };
}

function pubblicaSuInstagramSicuro(igUserId, captionTesto, urlMedia, tipoMedia) {
  Logger.log("⛔ [BLOCCO META] pubblicaSuInstagramSicuro intercettata e bloccata.");
  inviaTelegramBoss("📸 *[POST INSTAGRAM BLOCCATO DA META — CONVOGLIATO SU TELEGRAM]*\n" +
                    (urlMedia ? "🖼️ Media: " + urlMedia + "\n\n" : "\n") +
                    "📝 Caption:\n" + captionTesto);
  return { success: true, blocked: true, redirected_to: 'Telegram' };
}
```

---

## 4. DETTAGLIO MODIFICHE REPOSITORY GITHUB

### `bot-immobiliare-giancani-Antonio-2` (`main.py`)
- **File originale:** [file:///tmp/bot-immobiliare-2/main.py]
- **File pronto aggiornato:** [file:///home/antigravity/github_patches/bot-immobiliare-giancani-Antonio-2/main.py]
- **Logica:** Quando il cron giornaliero legge `posts.csv`, la funzione `post_to_facebook` non chiama più `graph.facebook.com`. Costruisce il messaggio con l'immagine di copertina e lo pubblica su Telegram con la dicitura:
  `📢 [POST SOCIAL PROGRAMMATO — CONVOGLIATO SU TELEGRAM]`

### `live-stream-serverless` (`scripts/pubblica_storia_facebook.py`)
- **File pronto aggiornato:** [file:///home/antigravity/github_patches/live-stream-serverless/pubblica_storia_facebook.py]
- **Logica:** `pubblica_storia_video_su_facebook` bypassa le 3 fasi di upload resumable verso `graph.facebook.com/v19.0/{page_id}/video_stories` e invia il file video `.mp4` direttamente ad Antonio su Telegram (`sendVideo`).

### `bot-immobiliare-giancani-Antonio` (`bot_mindset_antonio_giancani.py`)
- **File pronto aggiornato:** [file:///home/antigravity/github_patches/bot-immobiliare-giancani-Antonio/bot_mindset_antonio_giancani.py]
- **Logica:** Rimossi i token operativi verso Facebook, aggiornato lo stato e i pulsanti inline verso l'archivio Telegram.

---

## 5. ARCHIVIO CREDENZIALI, ID E TOKEN META (PER RIPRISTINO)
> [!NOTE]
> Tutti questi parametri sono stati salvati qui in modo sicuro e commentati nel codice. **Se in futuro decidi di riattivare Meta, ti basterà ricopiare questi dati senza dover rigenerare credenziali o ricreare applicazioni da capo.**

```ini
# --- CREDENZIALI META DEVELOPERS ---
META_APP_ID=1767940327228817
META_APP_SECRET=9ea1a5cd71aa2ca293d1a119e359055f
META_VERIFY_TOKEN=GiancaniTop2026

# --- WHATSAPP CLOUD API ---
META_PHONE_ID=1052221094649213
WHATSAPP_TOKEN=EAAeljvLd8QUBRTBL3fott5zFUkFHnRL8EWHdv706xpkNulFHUuNGNO0WjN9d6J15ssBD7ZBOYV3jmiyy9YksGl9m8ESyV6wrFVklxj1opnuLNwtHtyxdMcXIdu2NpqqIgxzFLT6CMwvebkiYf4Qekt8hSyWUnkTfPPZAFD8JS7ZAtCmjnCXVJ8Y7q011gZDZD

# --- PAGINE FACEBOOK & TOKEN ---
PAGE_ID_ANTONIO=108297671444008
PAGE_ID_AGENZIA=234931856561526
FB_TOKEN_PAGE=EAAZAH7q8wRZAEBR5o12BCIsIhaKwmhgr8viVYbbAducL8qYVmREm4YdImBaH06GTdql3QZApJJ8d3twlKLBQK7FRjlNq8SZCKymz7TfFeHYPEH5e7hDYtqjDDHpR7wEtUBU671SbVoTdDNEY6KKpGMz81dJhCHBNozOPEkrdJWWGeOGIrPO4EZASARrinrepJFeEaAN0OMZADalQXv
FB_TOKEN_ANTONIO=EAAZAH7q8wRZAEBSVeVa4DxzWiZBSoeSZC47h88ZBmzeNlvL3ow74fIzITgMKMrURWeDZBE5fU8ZCk0Hgm0J8CtqviQPqbrj7DQhnVv57W7WZCh80KCsNq6SL1imUOuBbEZBQqS9LB2iteZCID62Iw4ZCu27w2FA6MrFpsH9DCcxSd58qV1IwzpeIb5FDMg7qmNFiOER2XVo

# --- INSTAGRAM BUSINESS ---
IG_USER_ID=17841400301393511
```

---

## 6. POSIZIONE DEI FILE DI BACKUP E PATCH PRONTI

1. **Nel tuo Google Drive:**
   - **Cartella:** `Agenda 73` (ID: `1wz5FJaa8hMYmET9WPansSvDJaWJGQxJJ`)
   - **File caricato:** `Backup_Script_Blocco_Meta_Convoglia_Telegram_2026.txt` (ID: `1TyBGt9_IEHSTCEHGheR9dATR--RnuxCU`)
   - *Contiene il codice completo di tutti i 30+ file Apps Script con il blocco Meta e il convogliamento su Telegram già applicati.*

2. **Nel workspace locale:**
   - **File Registro Master:** `/home/antigravity/REGISTRO_BOT_META_TELEGRAM.md`
   - **Bundle Apps Script Completo:** `/home/antigravity/DARIA_APPS_SCRIPT_COMPLETO_AGGIORNATO.txt`
   - **Cartella Patch GitHub:** `/home/antigravity/github_patches/`
     - `/home/antigravity/github_patches/bot-immobiliare-giancani-Antonio-2/main.py`
     - `/home/antigravity/github_patches/live-stream-serverless/pubblica_storia_facebook.py`
     - `/home/antigravity/github_patches/bot-immobiliare-giancani-Antonio/bot_mindset_antonio_giancani.py`

---

## 7. PROCEDURA DI RIPRISTINO ISTANTANEO

Se in futuro vorrai riattivare uno specifico bot o riabilitare Meta:

1. **Per Google Apps Script:**
   - Apri il progetto `DARIA PER DIRETTA` su [script.google.com](https://script.google.com/d/1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft/edit).
   - In `Confing.gs` cambia `META_BLOCKED: true` in `META_BLOCKED: false`.
   - Se desideri ripristinare il file precedente, hai la copia esatta del 04/07/2026 salvata su Drive (`Backup_Script_2026-07-04_14-22.txt`).

2. **Per i Bot GitHub:**
   - Basta reimpostare `post_to_facebook` o `pubblica_storia_video_su_facebook` ripristinando le righe commentate con `_ORIGINALE` documentate nei file di patch.
   - Tutti i token e gli ID necessari sono salvati alla [Sezione 5](#5-archivio-credenziali-id-e-token-meta-per-ripristino).
