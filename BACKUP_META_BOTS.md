# 📦 BACKUP_META_BOTS.md — Archivio Tecnico Completo Automazioni Meta
**Ecosistema Immobiliare Giancani — Antonio Giancani**  
*Audit di Sicurezza & Backup Zero-Data-Loss | Data: 8 Novembre 2026*  
*Stato Operativo: ⛔ KILL SWITCH ATTIVO — ✈️ CONVOGLIAMENTO SU TELEGRAM ATTIVO*

---

> [!IMPORTANT]
> **OBIETTIVO DI QUESTO DOCUMENTO (Zero Perdita Dati):**  
> Questo documento costituisce il backup tecnico permanente e dettagliato di **ogni singola automazione, workflow, script, endpoint, template di post e credenziale** che interagiva con l'ecosistema **Meta** (Facebook Graph API, Instagram Graph API, WhatsApp Cloud API).  
> Tutte le chiamate outbound e i webhook verso domini Meta sono stati **neutralizzati con un Kill Switch preventivo** e **convogliati su Telegram** per preservare la totale sicurezza dell'ambiente.  
> Grazie a questo file, se in futuro vorrai ripristinare uno o tutti i bot, avrai a disposizione i payload, gli schemi, i template e i parametri esatti **senza dover riscrivere nemmeno una riga di codice da zero**.

---

## 📑 INDICE DELLE SEZIONI
1. [Variabili d'Ambiente, Token e Parametri Meta Archiviati](#1-variabili-dambiente-token-e-parametri-meta-archiviati)
2. [Censimento e Dettaglio Tecnico di Tutte le Automazioni Meta](#2-censimento-e-dettaglio-tecnico-di-tutte-le-automazioni-meta)
   - [2.1 Progetto Google Apps Script: DARIA PER DIRETTA](#21-progetto-google-apps-script-daria-per-diretta)
   - [2.2 Progetti Google Apps Script: WAHA Calendario](#22-progetti-google-apps-script-waha-calendario)
   - [2.3 Repository: bot-immobiliare-giancani-Antonio-2](#23-repository-bot-immobiliare-giancani-antonio-2)
   - [2.4 Repository: TELEGRAMGRUPPOVIDEOAgenziaBOT](#24-repository-telegramgruppovideoagenziabot)
   - [2.5 Repository: live-stream-serverless](#25-repository-live-stream-serverless)
   - [2.6 Repository: bot-immobiliare-giancani-Antonio](#26-repository-bot-immobiliare-giancani-antonio)
   - [2.7 Repository Bot Chiesa (PastoreBot, Bot-Chiesa-Frasi, PASTORE-BOT-VIDEO)](#27-repository-bot-chiesa)
3. [Elenco Completo Workflow GitHub Actions Disattivati (Cron Schedule)](#3-elenco-completo-workflow-github-actions-disattivati-cron-schedule)
4. [Archivio Template di Post, Payload e Formati di Testo Originali](#4-archivio-template-di-post-payload-e-formati-di-testo-originali)
5. [Architettura di Convogliamento su Telegram](#5-architettura-di-convogliamento-su-telegram)
6. [Guida al Ripristino Selettivo o Globale](#6-guida-al-ripristino-selettivo-o-globale)

---

## 1. VARIABILI D'AMBIENTE, TOKEN E PARAMETRI META ARCHIVIATI

I seguenti parametri sono stati censiti, isolati e archiviati per consentirne il riutilizzo immediato:

```ini
# ==============================================================================
# PARAMETRI APPLICAZIONE META DEVELOPERS
# ==============================================================================
META_APP_ID=1767940327228817
META_APP_SECRET=9ea1a5cd71aa2ca293d1a119e359055f
META_VERIFY_TOKEN=GiancaniTop2026

# ==============================================================================
# WHATSAPP BUSINESS CLOUD API NATIVA
# ==============================================================================
META_PHONE_ID=1052221094649213
WHATSAPP_TOKEN=EAAeljvLd8QUBRTBL3fott5zFUkFHnRL8EWHdv706xpkNulFHUuNGNO0WjN9d6J15ssBD7ZBOYV3jmiyy9YksGl9m8ESyV6wrFVklxj1opnuLNwtHtyxdMcXIdu2NpqqIgxzFLT6CMwvebkiYf4Qekt8hSyWUnkTfPPZAFD8JS7ZAtCmjnCXVJ8Y7q011gZDZD
WHATSAPP_CHANNEL_URL=https://whatsapp.com/channel/0029VaCGIA1LY6d1frzuDu2N

# ==============================================================================
# PAGINE FACEBOOK & TOKEN DI PAGINA
# ==============================================================================
# Pagina Personale / Professionale Antonio Giancani
PAGE_ID_ANTONIO=108297671444008
FB_TOKEN_ANTONIO=EAAZAH7q8wRZAEBSVeVa4DxzWiZBSoeSZC47h88ZBmzeNlvL3ow74fIzITgMKMrURWeDZBE5fU8ZCk0Hgm0J8CtqviQPqbrj7DQhnVv57W7WZCh80KCsNq6SL1imUOuBbEZBQqS9LB2iteZCID62Iw4ZCu27w2FA6MrFpsH9DCcxSd58qV1IwzpeIb5FDMg7qmNFiOER2XVo

# Pagina Aziendale Immobiliare Giancani
PAGE_ID_AGENZIA=234931856561526
FB_TOKEN_PAGE=EAAZAH7q8wRZAEBR5o12BCIsIhaKwmhgr8viVYbbAducL8qYVmREm4YdImBaH06GTdql3QZApJJ8d3twlKLBQK7FRjlNq8SZCKymz7TfFeHYPEH5e7hDYtqjDDHpR7wEtUBU671SbVoTdDNEY6KKpGMz81dJhCHBNozOPEkrdJWWGeOGIrPO4EZASARrinrepJFeEaAN0OMZADalQXv

# Pagina Favara
PAGE_ID_FAVARA=252550024776798

# Token Sessione / Orchestratore (Live Stream)
FB_PAGE_TOKEN_ORCHESTRATORE=EAAZAH7q8wRZAEBS4ZC4Nh6cBZBy3bJsccPVrkCPT9C4x7hGaXUMymWqrWWXsiyhZBo0Y67P7pSA4AZBq9h0ZA8...

# ==============================================================================
# INSTAGRAM BUSINESS ACCOUNT
# ==============================================================================
IG_USER_ID=17841400301393511
IG_ACCOUNT_NAME=@giancani_immobiliare

# ==============================================================================
# WEBAPP GOOGLE APPS SCRIPT
# ==============================================================================
MASTER_WEBAPP_URL=https://script.google.com/macros/s/AKfycbzq3gfy5JCZJT1tyF4oECkBFVrckxVzqDuAJgUSvPhU4rv2Bztj7EUT3m4b5ILm4Vdc/exec
PROJECT_ID_APPS_SCRIPT=1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft
```

---

## 2. CENSIMENTO E DETTAGLIO TECNICO DI TUTTE LE AUTOMAZIONI META

### 2.1 Progetto Google Apps Script: DARIA PER DIRETTA
* **ID Progetto:** `1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft`
* **File di Backup Drive:** `Backup_Script_Blocco_Meta_Convoglia_Telegram_2026.txt` (Cartella `Agenda 73`, ID: `1TyBGt9_IEHSTCEHGheR9dATR--RnuxCU`)

#### Automazioni Censite nel Progetto:
1. **Webhook Challenge Verification (`Codice.gs` -> `doGet`)**:
   - *Funzione originaria:* Rispondeva al challenge `hub.mode === 'subscribe'` di Meta per mantenere attivi i webhook dei commenti e messaggi.
   - *Endpoint:* `GET https://script.google.com/macros/s/.../exec?hub.mode=subscribe&hub.verify_token=GiancaniTop2026&hub.challenge=...`
   - *Kill Switch:* Rifiuta la sottoscrizione e restituisce avviso di disattivazione.
2. **Webhook Inbound Receiver (`Codice.gs` -> `doPost`)**:
   - *Funzione originaria:* Riceveva i messaggi WhatsApp (`whatsapp_business_account`), Messenger (`page`) e Instagram (`instagram`).
   - *Kill Switch & Telegram Routing:* Invece di inviare conferme o risposte via Meta Graph API, estrae il mittente (`waName`, `num`) e il messaggio (`testo`) e li invia direttamente ad Antonio su Telegram (`inviaTelegramBoss`).
3. **Omnichannel & Direct Messaging (`INTEGRAZIONI.gs`, `Risposte a Ogni canale 2.gs`, `Codice.gs`)**:
   - `_inviaMetaWhatsApp(id, testo)` ➡️ Chiamava `POST https://graph.facebook.com/v18.0/{CONFIG.META_PHONE_ID}/messages`. **Kill Switch:** `return` immediato + routing su Telegram.
   - `_inviaMessaggioFB(senderId, testo)` ➡️ Chiamava `POST https://graph.facebook.com/v21.0/me/messages`. **Kill Switch:** `return` immediato + routing su Telegram.
   - `_inviaRispostaCommentoFB` e `_inviaRispostaCommentoIG` ➡️ Rispondevano ai commenti pubblici. **Kill Switch:** `return true` + notifica a Telegram.
   - `inviaWhatsAppTesto(id, t)` ➡️ Reindirizzamento universale a Telegram `_inviaTelegramTesto`.
4. **Piano Editoriale & Token Lifecycle (`PIANO EDITORIALE.gs`)**:
   - `pubblicaSuFacebookSicuro(pageId, testoPost, urlFoto)` ➡️ Chiamava `POST https://graph.facebook.com/v18.0/{pageId}/photos` o `/feed`. **Kill Switch:** Blocco preventivo, invio post e foto su Telegram.
   - `pubblicaSuInstagramSicuro(igUserId, captionTesto, urlMedia, tipoMedia)` ➡️ Chiamava `POST https://graph.facebook.com/v18.0/{igUserId}/media` e `/media_publish`. **Kill Switch:** Blocco preventivo, invio post e media su Telegram.
   - `importaPostFacebook()` & `importaTuttiIPost()` ➡️ Trigger periodici per scaricare post da Meta. **Kill Switch:** Blocco preventivo con `return;`.
   - `rinnovaTokenMetaAutomatico()` & `installaTriggerRinnovoToken()` ➡️ Trigger per rinnovare il token Meta. **Kill Switch:** Blocco preventivo con `return;`.
5. **Accesso Amministratore OTP (`LoginBoss.gs` -> `dcInviaOtpBoss`)**:
   - *Funzione originaria:* Spediva il codice OTP di sblocco a 6 cifre via WhatsApp Cloud API.
   - *Kill Switch:* Disabilitato WhatsApp Meta; invio codice OTP direttamente ad Antonio su Telegram.

---

### 2.2 Progetti Google Apps Script: WAHA Calendario
* `Calendario fine su waha` (ID: `10Oy19VXNnVEynV6WFEzzAoZTuouN13rJKNeils9IfUfvj_oadLfVLF44`)
* `Calendario automatica su fine WAHA` (ID: `1cCeyESKqPOPBZrqzALTx__diEQ_UzD_fmWLrNt4x_--MU03HoHo_oWSo`)
* *Funzione:* Invio promemoria appuntamenti calendario tramite istanza WAHA.
* *Stato:* Isolati, chiamate esterne non attive.

---

### 2.3 Repository: `bot-immobiliare-giancani-Antonio-2`
* **File:** `main.py`
* **Workflow:** `workflows/schedule.yml` (disattivato il trigger `schedule`)
* **Endpoint Meta Originale:** `POST https://graph.facebook.com/v19.0/{FB_PAGE_ID}/photos`
* **Payload Originale:**
  ```json
  {
    "url": "{image_url}",
    "message": "{messaggio_post}",
    "access_token": "{FB_ACCESS_TOKEN}"
  }
  ```
* **Template del Post:**
  Estrae da `posts.csv` la riga corrispondente alla data corrente (`gg/mm/aaaa`), compone `{messaggio_post}` (completo di hashtag, contatti e dettagli immobile) con `{image_url}` (immagine ospitata sul repository GitHub).
* **Kill Switch & Telegram Routing:**
  La funzione `post_to_facebook` è neutralizzata e sostituita con una chiamata sicura `requests.post("https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto")` con chat ID `1723292483`, preservando testo, formattazione Markdown e foto.

---

### 2.4 Repository: `TELEGRAMGRUPPOVIDEOAgenziaBOT`
* **File:** `bot.py`, `bot_statistiche.py`
* **Workflow:** `.github/workflows/main.yml`, `.github/workflows/statistiche_notturne.yml`
* **Funzioni e Endpoints Meta Originali:**
  1. `upload_facebook(video_file, descrizione)` ➡️ `POST https://graph.facebook.com/v18.0/{FB_PAGE_ID}/videos`
  2. `upload_instagram_reels(video_file, caption)` ➡️ `POST https://graph.facebook.com/v21.0/{IG_USER_ID}/media` (con poll di status e publish)
  3. `upload_facebook_foto(foto_files, commento)` ➡️ `POST https://graph.facebook.com/v18.0/{FB_PAGE_ID}/photos` o `/feed`
  4. `upload_instagram_carosello(foto_files, commento)` ➡️ `POST https://graph.facebook.com/v21.0/{IG_USER_ID}/media`
  5. `invia_whatsapp_richiesta(numero, testo)` ➡️ `POST https://graph.facebook.com/v18.0/{WHATSAPP_PHONE_ID}/messages`
  6. `bot_statistiche.py` ➡️ `GET https://graph.facebook.com/v18.0/{fb_id}?fields=views,likes...`
* **Kill Switch & Telegram Routing:**
  Tutte le funzioni sono state neutralizzate inserendo una redirezione diretta verso `send_telegram(video_file, caption)` e `invia_telegram_foto(foto_files, caption)`. I workflow cron notturni sono stati commentati.

---

### 2.5 Repository: `live-stream-serverless`
* **File Modificati:**
  * `bot_orchestratore_15min_social.py`
  * `bot_social_responder_polling.py`
  * `bot_saluti_giancani_note.py`
  * `bot_favara_publisher.py`
  * `pubblica_storia_facebook.py`
  * `scripts/pubblica_storia_facebook.py`
  * `05_SocialECommentiLive.js`
  * `.github/workflows/` (9 file di workflow disattivati)
* **Endpoints Meta Originali Neutralizzati:**
  * `POST https://graph.facebook.com/v19.0/{page_id}/video_stories` (Fasi: start, upload binario, finish)
  * `POST https://graph.facebook.com/v19.0/{page_id}/feed` (Note orarie Facebook)
  * `POST https://graph.facebook.com/v20.0/{page_id}/photos` (Favara publisher)
  * `GET/POST https://graph.facebook.com/v19.0/{FB_PAGE_ID}/conversations` & `/comments` (Social responder)
* **Kill Switch & Telegram Routing:**
  * In `pubblica_storia_video_su_facebook` e `bot_orchestratore_15min_social.py`, il video `.mp4` viene spedito a Telegram ad Antonio (`requests.post(..., data={'chat_id': 1723292483}, files={'video': ...})`).
  * In `bot_social_responder_polling.py`, il ciclo di polling commenti e conversazioni è neutralizzato all'ingresso con `return`.
  * In `05_SocialECommentiLive.js`, `getNuoviCommentiFB` restituisce `[]` e `oscuraCommentoFB` restituisce `blocked: true`.

---

### 2.6 Repository: `bot-immobiliare-giancani-Antonio`
* **File:** `bot_mindset_antonio_giancani.py`, `bot_pillole_immobiliari_video.py`
* **Workflow:** `.github/workflows/orario.yml`
* **Endpoints Meta Originali Neutralizzati:**
  * `POST https://graph.facebook.com/v19.0/{FACEBOOK_PAGE_ID}/videos`
* **Kill Switch & Telegram Routing:**
  * `pubblica_su_facebook` in `bot_pillole_immobiliari_video.py` convoglia il video del Reel direttamente su Telegram con didascalia completa.
  * In `bot_mindset_antonio_giancani.py`, il pulsante interattivo non invia a Facebook ma archivia su Telegram.

---

### 2.7 Repository Bot Chiesa
* **Repository Coinvolti:**
  * `Bot-Chiesa-Frasi-quotidiani` (`main.py`, `.github/workflows/bot_chiesa-3.yml`)
  * `PastoreBot` (`main.py`, `.github/workflows/blank.yml`)
  * `PASTORE-BOT-VIDEO-FRASI` (`main.py`, `.github/workflows /bot_chiesa.yml`)
* **Endpoint Meta Originale:** `POST https://graph.facebook.com/v19.0/{PAGE_ID}/photos?access_token={FACEBOOK_TOKEN}`
* **Kill Switch & Telegram Routing:**
  `post_facebook` intercettata con blocco preventivo; la grafica e la frase giornaliera della chiesa vengono recapitate su Telegram tramite `post_telegram`. I cron nei workflow sono disattivati.

---

## 3. ELENCO COMPLETO WORKFLOW GITHUB ACTIONS DISATTIVATI (CRON SCHEDULE)

Tutti i seguenti file hanno ora la sezione `schedule:` commentata con `# [KILL SWITCH META DISATTIVATO]`:

| # | Repository | File Workflow | Cron Originale Disattivato |
| :-: | :--- | :--- | :--- |
| 1 | `bot-immobiliare-giancani-Antonio-2` | `workflows/schedule.yml` | `cron: '0 13 * * *'` (Ogni giorno alle 13:00 UTC) |
| 2 | `live-stream-serverless` | `.github/workflows/bot_orchestratore_15min.yml` | `cron: '*/15 * * * *'` (Ogni 15 minuti) |
| 3 | `live-stream-serverless` | `.github/workflows/bot_social_responder.yml` | `cron: '*/10 * * * *'` (Ogni 10 minuti) |
| 4 | `live-stream-serverless` | `.github/workflows/carosello_immobili_social.yml` | `cron: '0 9,15,19 * * *'` (Ore 9, 15, 19) |
| 5 | `live-stream-serverless` | `.github/workflows/daily_story.yml` | `cron: '0 8 * * *'` (Ogni giorno alle 8:00) |
| 6 | `live-stream-serverless` | `.github/workflows/rilancio_immobili_social.yml` | `cron: '0 12 * * *'` e `30 16 * * *'` |
| 7 | `live-stream-serverless` | `.github/workflows/storie-orarie-offline.yml` | `cron: '0 7-22 * * *'` (Ogni ora dalle 7 alle 22) |
| 8 | `live-stream-serverless` | `.github/workflows/storie_buone_notizie.yml` | `cron: '0 10,16 * * *'` |
| 9 | `live-stream-serverless` | `.github/workflows/storie_youtube_quotidiane.yml` | `cron: '0 11,18 * * *'` |
| 10 | `bot-immobiliare-giancani-Antonio` | `.github/workflows/orario.yml` | `cron: '0 8,13,18 * * *'` |
| 11 | `TELEGRAMGRUPPOVIDEOAgenziaBOT` | `.github/workflows/main.yml` | `cron: '0 8 * * *'` |
| 12 | `TELEGRAMGRUPPOVIDEOAgenziaBOT` | `.github/workflows/statistiche_notturne.yml` | `cron: '0 2 * * *'` |
| 13 | `PastoreBot` | `.github/workflows/blank.yml` | `cron: '0 6 * * *'` |
| 14 | `Bot-Chiesa-Frasi-quotidiani` | `.github/workflows/bot_chiesa-3.yml` | `cron: '0 7 * * *'` |
| 15 | `PASTORE-BOT-VIDEO-FRASI` | `.github/workflows /bot_chiesa.yml` | `cron: '0 7 * * *'` |

---

## 4. ARCHIVIO TEMPLATE DI POST, PAYLOAD E FORMATI DI TESTO ORIGINALI

I seguenti template contengono la struttura esatta preservata per Telegram:

### A. Template Annuncio Immobile Singolo & Carosello (`TELEGRAMGRUPPOVIDEOAgenziaBOT`)
```markdown
🏠 IMMOBILE IN VENDITA — IMMOBILIARE GIANCANI
━━━━━━━━━━━━━━━━━━━━
📌 Titolo: {titolo}
📍 Zona / Città: {citta} ({provincia})
📐 Superficie: {superficie} metri quadri
🚪 Vani: {vani} | Camere: {camere} | Bagni: {bagni}
💰 Prezzo: {prezzo}

📝 Descrizione:
{descrizione}

✨ Caratteristiche Principali:
- Classe Energetica: {classe_energetica}
- Stato Immobile: {stato_immobile}
- Balconi / Terrazzo: {terrazzo}

📞 Per informazioni o per fissare una visita sul posto:
Immobiliare Giancani — Antonio Giancani
📲 Telefono / WhatsApp: 320 166 7156
━━━━━━━━━━━━━━━━━━━━
— Immobiliare Giancani
```

### B. Template Nota di Pagina & Fascia Oraria (`live-stream-serverless`)
```markdown
{fascia_info['titolo_nota']}

{fascia_info['riflessione_nota']}

━━━━━━━━━━━━━━━━━━━━
🏠 IMMOBILE IN EVIDENZA: {titolo.upper()}
📐 SUPERFICIE: {mq}
💰 PREZZO: {prezzo}
━━━━━━━━━━━━━━━━━━━━

🎙️ Dettagli esclusivi: "{testo_f}"
🎵 Canzone consigliata: {fascia_info['musica_titolo']}

👉 Per informazioni e visite guidate sul posto:
📞 Contattaci direttamente o invia un messaggio in privato.

📱 Canali Ufficiali:
• YouTube: https://www.youtube.com/@immobiliaregiancani761
• TikTok: https://www.tiktok.com/@immobiliare_giancani

━━━━━━━━━━━━━━━━━━━━
— Immobiliare Giancani
```

### C. Template Post Quotidiano Mindset (`bot-immobiliare-giancani-Antonio`)
```markdown
🎬 NUOVO VIDEO SHORTS / STORIES (1080x1920)
⭐ ANTONIO GIANCANI

🏷️ Categoria: #{categoria}
📖 Frase di Prestigio (Colonna F):
_{colonna_f}_

🎙️ Voce: Diego Neurale (Lettura & Meditazione)
🎵 Audio: Musica di sottofondo Royalty-Free
🔄 Effetto Video: Loop in Rewind Continuo
⏰ Fascia Oraria: {orario_suggerito}

━━━━━━━━━━━━━━━━━━━━
— Immobiliare Giancani
```

---

## 5. ARCHITETTURA DI CONVOGLIAMENTO SU TELEGRAM

Tutte le interazioni sono confluite su Telegram rispettando questi parametri:
* **Token Bot Primario:** `8643190035:AAHaUOT12j8l9f6GU9WW4W9HFOLfV-5r5-U`
* **Token Bot Secondario:** `8671578336:AAEHI-s-2g3dY9qnIIVc_hWzDdOuHm-MS6M`
* **Chat ID Antonio:** `1723292483`

Qualsiasi messaggio proveniente da lead o clienti che tenta di contattare l'agenzia viene intercettato da `doPost(e)` e notificato su Telegram con il testo:
`🚨 [INTERAZIONE BLOCCATA DA META — CONVOGLIATA SU TELEGRAM]`  
indicando il nome del contatto, il numero e il testo integrale del messaggio.

---

## 6. GUIDA AL RIPRISTINO SELETTIVO O GLOBALE

Se in futuro vorrai ripristinare Meta:

1. **Ripristino Google Apps Script:**
   - Apri `DARIA PER DIRETTA` su [script.google.com](https://script.google.com/d/1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft/edit).
   - In `Confing.gs` cambia `META_BLOCKED: true` in `META_BLOCKED: false`.
   - Se desideri ripristinare il file integrale pre-blocco, usa il backup su Drive `Backup_Script_2026-07-04_14-22.txt` (ID: `1jaByu96K0yOVOUhE7hFYWtQw6qHKHteJ`).
2. **Ripristino Workflow GitHub Actions:**
   - Apri il file `.github/workflows/<nome>.yml` desiderato e rimuovi la stringa `# [KILL SWITCH META DISATTIVATO]` per riattivare la sezione `schedule:`.
3. **Ripristino Script Python:**
   - In ciascuno script Python modificato, la vecchia funzione originale è conservata intatta con il suffisso `_ORIGINALE`.
