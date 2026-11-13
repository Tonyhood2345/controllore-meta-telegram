#!/usr/bin/env python3
"""
===============================================================================
INVIO GIORNALIERO SOCIAL SU TELEGRAM — IMMOBILIARE GIANCANI
Invia ogni giorno una foto randomica di ogni immobile con grafica rotativa
e didascalia pronta per la condivisione istantanea sui social (FB, IG, WA).
===============================================================================
"""

import os
import sys
import time
import json
import random
import urllib.parse
import urllib.request
from datetime import datetime
from io import BytesIO

import crea_grafica_social

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0")
ANTONIO_CHAT_ID    = os.getenv("TELEGRAM_CHAT_ID", "1723292483")
WEBAPP_URL         = "https://tonyhood2345.github.io/controllore-meta-telegram/"

STILI_ROTATIVI = [
    "giancani_green_wave",    # Stile Green Wave Onde Smeraldo (Tecnocasa style adattato Giancani)
    "provenzano_executive",   # Stile Indigo & Gold Executive (con Foto Reale Antonio Giancani)
]

def carica_immobili():
    """Carica gli immobili dal file index.html o da fallback"""
    index_path = "/home/antigravity/CONTROLLORE_META_TELEGRAM/index.html"
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            text = f.read()
        start = text.find("const DATABASE_IMMOBILI_DEFAULT = [")
        end = text.find("];", start)
        json_str = text[start + len("const DATABASE_IMMOBILI_DEFAULT = "): end + 1]
        return json.loads(json_str)
    except Exception as e:
        print(f"⚠️ Errore lettura DATABASE_IMMOBILI_DEFAULT: {e}", file=sys.stderr)
        return []

def invia_foto_telegram(image_pil, caption, inline_keyboard=None):
    """Invia immagine PIL direttamente a Telegram come foto ad alta risoluzione"""
    bio = BytesIO()
    image_pil.save(bio, "JPEG", quality=95)
    bio.seek(0)
    image_bytes = bio.getvalue()
    
    boundary = "----WebKitFormBoundary" + hex(int(time.time() * 1000))[2:]
    body = bytearray()
    
    # Campo chat_id
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="chat_id"\r\n\r\n')
    body.extend(f"{ANTONIO_CHAT_ID}\r\n".encode("utf-8"))
    
    # Campo caption
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="caption"\r\n\r\n')
    body.extend(f"{caption}\r\n".encode("utf-8"))
    
    # Campo parse_mode
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="parse_mode"\r\n\r\n')
    body.extend(b"HTML\r\n")
    
    # Campo reply_markup
    if inline_keyboard:
        body.extend(f"--{boundary}\r\n".encode("utf-8"))
        body.extend(b'Content-Disposition: form-data; name="reply_markup"\r\n\r\n')
        body.extend(json.dumps({"inline_keyboard": inline_keyboard}).encode("utf-8"))
        body.extend(b"\r\n")
        
    # File foto
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="photo"; filename="grafica_social.jpg"\r\n')
    body.extend(b"Content-Type: image/jpeg\r\n\r\n")
    body.extend(image_bytes)
    body.extend(b"\r\n")
    
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        print(f"❌ Errore invio foto Telegram: {e}", file=sys.stderr)
        return None

def genera_e_invia_singolo(immobile, stile_forzato=None):
    """Elabora un singolo immobile, sceglie una foto casuale e invia su Telegram"""
    galleria = immobile.get("galleria", [])
    if not galleria:
        print(f"⚠️ Immobile #{immobile.get('id')} non ha foto in galleria, skip.")
        return False
        
    # 1. Sceglie una foto randomica dalla galleria
    scelta = random.choice(galleria)
    foto_url = scelta.get("foto") or immobile.get("fotoUrl")
    stanza_nome = scelta.get("stanza", "Ambiente")
    desc_sheet = scelta.get("desc") or immobile.get("descrizione", "")
    
    # 2. Sceglie lo stile (rotativo in base al giorno dell'anno, o alternato)
    day_of_year = datetime.now().timetuple().tm_yday
    if stile_forzato:
        stile = stile_forzato
    else:
        # Alterna stile in base al giorno o ID per garantire massima varietà visiva
        stile = STILI_ROTATIVI[(day_of_year + immobile.get("id", 1)) % len(STILI_ROTATIVI)]
        
    titolo = immobile.get("titolo", "Immobile in Vendita")
    prezzo = immobile.get("prezzo", "Trattativa Riservata")
    mq = immobile.get("mq", "Metratura da definire")
    luogo = immobile.get("luogo", "Agrigento / Favara")
    badge = immobile.get("badge", "IN VENDITA")
    
    categoria = "APPARTAMENTO"
    t_lower = titolo.lower()
    if "villa" in t_lower:
        categoria = "VILLA"
    elif "terreno" in t_lower:
        categoria = "TERRENO"
    elif "piano terra" in t_lower:
        categoria = "PIANO TERRA"
    elif "attico" in t_lower:
        categoria = "ATTICO"
    elif "magazzino" in t_lower:
        categoria = "MAGAZZINO"
        
    print(f"🎨 Generazione grafica #{immobile.get('id')}: '{titolo}' | Stile: '{stile}' | Foto: '{stanza_nome}'...")
    img = crea_grafica_social.render_grafica_per_stile(stile, foto_url, titolo, prezzo, mq, luogo, categoria)
    
    # 3. Formatta didascalia pulita pronta per la condivisione sui social
    contatto = "📞 Per informazioni e riservare la visita contatta Antonio Giancani al 320 166 7156 — Immobiliare Giancani"
    
    # Testo condivisibile WhatsApp / Social
    testo_condivisione = (
        f"🏡 *{titolo}*\n"
        f"💰 *Prezzo:* {prezzo}\n"
        f"📐 *Superficie:* {mq}\n"
        f"📍 *Zona:* {luogo}\n\n"
        f"📸 *Dettaglio:* {stanza_nome}\n"
        f"{desc_sheet}\n\n"
        f"{contatto}\n\n"
        f"#ImmobiliareGiancani #Favara #Agrigento #VenditaImmobili"
    )
    
    wa_encoded = urllib.parse.quote_plus(testo_condivisione)
    wa_url = f"https://api.whatsapp.com/send?text={wa_encoded}"
    fb_url = f"https://www.facebook.com/sharer/sharer.php?u={urllib.parse.quote_plus(WEBAPP_URL)}"
    
    # Caption HTML per Telegram
    caption_html = (
        f"🏡 <b>IMMOBILIARE GIANCANI — POST DEL GIORNO</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 <b>{titolo}</b>\n"
        f"💰 <b>Prezzo:</b> {prezzo} <i>(da Google Sheet)</i>\n"
        f"📐 <b>Superficie:</b> {mq}\n"
        f"📍 <b>Luogo:</b> {luogo}\n\n"
        f"📸 <b>Stanza:</b> <i>{stanza_nome}</i>\n"
        f"📝 <b>Descrizione Sheet (Colonna F):</b>\n"
        f"<i>\"{desc_sheet[:280]}...\"</i>\n\n"
        f"<b>{contatto}</b>\n\n"
        f"<i>💡 Clicca i pulsanti sotto per condividere con 1 clic:</i>"
    )
    
    inline_keyboard = [
        [
            {"text": "📲 Condividi su WhatsApp", "url": wa_url},
            {"text": "📘 Condividi su Facebook", "url": fb_url}
        ],
        [
            {"text": "🌐 Apri Scheda WebApp", "url": WEBAPP_URL}
        ]
    ]
    
    res = invia_foto_telegram(img, caption_html, inline_keyboard)
    if res and res.get("ok"):
        print(f"✅ Inviato con successo a Telegram: #{immobile.get('id')} - {titolo}")
        return True
    else:
        print(f"❌ Fallito invio a Telegram: {res}")
        return False

def main():
    immobili = carica_immobili()
    if not immobili:
        print("❌ Nessun immobile trovato.")
        sys.exit(1)
        
    print(f"🚀 Caricati {len(immobili)} immobili dal catalogo.")
    
    if "--test" in sys.argv:
        # Invia solo 1 immobile come test immediato
        target = random.choice(immobili)
        stile = "giancani_green_wave"
        if "--stile" in sys.argv:
            idx = sys.argv.index("--stile")
            if idx + 1 < len(sys.argv):
                stile = sys.argv[idx + 1]
        print(f"🧪 Esecuzione TEST con immobile #{target.get('id')}: {target.get('titolo')}")
        genera_e_invia_singolo(target, stile_forzato=stile)
        return

    # Esecuzione completa per tutti gli immobili (o quelli specificati)
    success_count = 0
    for imm in immobili:
        try:
            ok = genera_e_invia_singolo(imm)
            if ok:
                success_count += 1
            # Pausa per rispetto rate limit Telegram (1.5s tra messaggi)
            time.sleep(1.5)
        except Exception as e:
            print(f"⚠️ Errore su immobile #{imm.get('id')}: {e}")
            
    print(f"\n🎉 Invio completato: {success_count}/{len(immobili)} inviati a Telegram!")

if __name__ == "__main__":
    main()
