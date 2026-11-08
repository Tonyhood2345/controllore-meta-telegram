# 🏢 DarIA Omnichannel — Immobiliare Giancani

Sistema centrale di automazione, regia e intelligenza artificiale per l'**Agenzia Immobiliare Giancani** di Favara (AG).

---

## 🛡️ 1. Protezione Anti-Ban Meta & Kill-Switch
Tutte le chiamate outbound verso le API Meta (Facebook Graph API, Instagram API, WhatsApp Cloud API) sono state neutralizzate e convogliate su **Telegram** per prevenire blocchi o restrizioni dell'account:
- I webhook `hub.mode = subscribe` di Meta sono intercettati e rifiutati con stato di sicurezza.
- I post, le storie e i reels destinati a Facebook e Instagram vengono bloccati dal supervisore e inoltrati su Telegram con testo e formattazione completi.
- Tutte le interazioni vengono registrate in tempo reale nel foglio Google `DB_Interazioni`.

---

## 🤖 2. Bot Telegram Ufficiali
- **Bot Primario Social & Dashboard**: [@AMMINISTRAZIONISOCIAL_BOT](https://t.me/AMMINISTRAZIONISOCIAL_BOT)
  - Token API: `9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0`
  - Comandi disponibili: `/dashboard`, `/start`, `/stato`
  - Webhook collegato direttamente alla WebApp Google Apps Script.
- **Bot Storico Operativo Giancani**: `8643190035:AAHaUOT12j8l9f6GU9WW4W9HFOLfV-5r5-U`
- **Chat ID Amministratore (Antonio Giancani)**: `1723292483`

---

## 📊 3. Dashboard Web App & Analytics (`Dashboard.html`)
Interfaccia mobile-friendly servita tramite `doGet(e)` con `HtmlService`:
- **KPI Cards**: Post oggi vs Limite massimo per 4 canali (Telegram, Facebook, Instagram, WhatsApp).
- **Medie Statistiche**: Media giornaliera (7gg), settimanale (4 sett) e mensile.
- **Grafici Chart.js**:
  1. Istogramma a barre affiancate: *Attività Reale vs Soglia di Sicurezza Meta*.
  2. Istogramma temporale: *Distribuzione per Giorno della Settimana (Lun-Dom) e Mese dell'Anno*.
- **Registro Attività Recenti**: Tabella dinamica degli ultimi 20 eventi con badge colorati per canale, stato (`✅ Sicuro`, `⏳ In attesa`, `🛑 Bloccato dal supervisore`) ed esito limite.
- **Pulsante Aggiorna Dati**: Ricaricamento asincrono via `google.script.run.ottieniDatiDashboard()`.

---

## 🚀 4. Come fare il Deploy su Google Apps Script (in 2 click)

1. Apri il progetto: [DARIA PER DIRETTA su script.google.com](https://script.google.com/d/1TrXxMTUpqWS0AFizBkBbeznFterICAm9hkeF7EQRDesvZgwTNMO1Nwft/edit)
2. In alto a destra clicca **Distribuisci** (Deploy) ➔ **Nuova implementazione**:
   - **Tipo**: *Applicazione web*
   - **Esegui come**: *Io*
   - **Chi ha accesso**: **Chiunque** (Anyone)
   - Clicca **Distribuisci**.
3. Copia l'URL dell'applicazione web generato (`https://script.google.com/macros/s/.../exec`).

---

## 📁 5. Struttura dei File

```
├── Codice.gs                         # Router centrale doGet, doPost, gestione comandi e webhook
├── Confing.gs                        # Configurazione globale, token bot Telegram, ID fogli e parametri
├── Dashboard.html                    # Template interfaccia WebApp con Tailwind CSS e Chart.js
├── appsscript.json                   # Descrittore manifesto Apps Script con permessi ANYONE
├── .clasp.json                       # Configurazione clasp per sincronizzazione da terminale
├── BACKUP_META_BOTS.md               # Audit completo di tutti i bot e chiamate Meta neutralizzate
├── REGISTRO_BOT_META_TELEGRAM.md     # Registro canali Telegram, token e reindirizzamenti
├── CentraleOperativa.html            # Cockpit di comando agenzia
├── DariaCommandCenter.html           # Centro di controllo unificato
├── FoglioVisita.html                 # Modulo presa visione e sopralluogo immobili
├── IncaricoVendita.html              # Modulo digitale incarichi di vendita
└── ... (tutti i moduli Apps Script .gs e .html)
```
