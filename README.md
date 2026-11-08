# 🛡️ Controllore di Dati Anti-Ban Meta & Gatekeeper Telegram
### Immobiliare Giancani — Modulo di Controllo e Protezione Account

Questo repository contiene **esclusivamente** il sistema di controllo, filtro e validazione dei dati prima che tocchino le API di Meta (Facebook Graph API, Instagram Graph API, WhatsApp Cloud API).

---

## 🎯 Obiettivo del Controllore
Evitare blocchi o restrizioni dell'account Meta intercettando ogni annuncio, post o notifica a monte:
1. **Neutralizzazione Chiamate Dirette:** Tutte le chiamate verso `graph.facebook.com` vengono bloccate preventivamente.
2. **Controllo Limiti di Sicurezza (Anti-Ban):**
   - **Telegram:** max 50/giorno
   - **Facebook:** max 5/giorno
   - **Instagram:** max 5/giorno
   - **WhatsApp:** max 10/giorno
3. **Archiviazione Storica:** Ogni tentativo viene registrato nel foglio Google Sheets `DB_Interazioni`.
4. **Deviazione su Telegram:** Invio dell'anteprima formattata al bot Telegram `@AMMINISTRAZIONISOCIAL_BOT` con tastiera inline (`[✅ Approva]`, `[🛑 Blocca]`, `[📊 Apri Dashboard]`).
5. **Dashboard Visuale:** Interfaccia `Dashboard.html` con statistiche in tempo reale, grafici Chart.js e stato di sicurezza.

---

## 📂 Struttura File
* `controllore_meta_telegram.py` — Modulo Python per bot locali o GitHub Actions.
* `ControlloreDatiMeta.gs` — Modulo Google Apps Script da includere nel progetto editor.
* `Dashboard.html` — Pagina web per visualizzare le metriche e lo storico del controllore.
