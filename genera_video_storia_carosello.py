#!/usr/bin/env python3
"""
===============================================================================
GENERATORE VIDEO CAROSELLO STORIE (9:16) — IMMOBILIARE GIANCANI
Genera un video montaggio MP4 verticale (1080x1920) per Storie/Reels/WhatsApp
con TUTTI gli immobili in ordine random, foto random e testi autentici dello Sheet.
===============================================================================
"""

import os
import sys
import time
import json
import random
import glob
import subprocess
import urllib.request
import urllib.parse
from datetime import datetime
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter

import crea_grafica_social

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "9162866522:AAHMrLtOTxwujogyveQtR_UI2c_gBIgm_s0")
ANTONIO_CHAT_ID    = os.getenv("TELEGRAM_CHAT_ID", "1723292483")
REPO_DIR           = "/home/antigravity/CONTROLLORE_META_TELEGRAM"
OUTPUT_DIR         = os.path.join(REPO_DIR, "assets", "video")
FRAMES_DIR         = "/tmp/story_carousel_frames"

def carica_immobili():
    """Carica gli immobili dal file index.html"""
    index_path = os.path.join(REPO_DIR, "index.html")
    try:
        with open(index_path, "r", encoding="utf-8") as f:
            text = f.read()
        start = text.find("const DATABASE_IMMOBILI_DEFAULT = [")
        end = text.find("];", start)
        json_str = text[start + len("const DATABASE_IMMOBILI_DEFAULT = "): end + 1]
        return json.loads(json_str)
    except Exception as e:
        print(f"⚠️ Errore lettura immobili: {e}", file=sys.stderr)
        return []

def render_slide_verticale(immobile, photo_im, stanza_nome, desc_sheet, indice, totale, palette):
    """Genera un singolo frame verticale 1080x1920 ad altissima qualità"""
    W, H = 1080, 1920
    col_prim = palette["primario"]
    col_sec  = palette["secondario"]
    
    # 1. Sfondo elegante con blur profondo della foto immobile
    backdrop = photo_im.resize((W, H), Image.Resampling.LANCZOS).filter(ImageFilter.GaussianBlur(35))
    dark = Image.new("RGBA", (W, H), (8, 12, 24, 215))
    im = Image.alpha_composite(backdrop.convert("RGBA"), dark).convert("RGB")
    draw = ImageDraw.Draw(im)
    
    # 2. Barre di avanzamento Storie in alto (1 bar per immobile)
    bar_y = 25
    pad_x = 25
    avail_w = W - pad_x * 2
    gap = 5
    bar_w = (avail_w - (totale - 1) * gap) / totale
    for i in range(totale):
        bx1 = pad_x + i * (bar_w + gap)
        bx2 = bx1 + bar_w
        if i < indice:
            bcol = (255, 255, 255, 240)
        elif i == indice:
            bcol = col_sec
        else:
            bcol = (255, 255, 255, 60)
        draw.rounded_rectangle([(bx1, bar_y), (bx2, bar_y + 4)], radius=2, fill=bcol)
        
    # 3. Header Agenzia Superiore Glass Card
    h_box = (25, 45, W - 25, 160)
    draw.rounded_rectangle([(h_box[0], h_box[1]), (h_box[2], h_box[3])], radius=20, fill=(15, 23, 42, 235), outline=(255, 255, 255, 40), width=1)
    
    logo_path = os.path.join(REPO_DIR, "assets", "logo_giancani_trasparente.png")
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        lw = 270
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        im.paste(logo, (50, 62), logo)
    else:
        f_l = crea_grafica_social.get_font(24, bold=True)
        draw.text((50, 75), "IMMOBILIARE GIANCANI", fill=col_sec, font=f_l)
        
    # Ritratto reale Antonio Giancani
    ag_cx, ag_cy, ag_r = W - 85, 102, 44
    draw.ellipse([(ag_cx - ag_r - 3, ag_cy - ag_r - 3), (ag_cx + ag_r + 3, ag_cy + ag_r + 3)], fill=col_sec)
    ag_path = os.path.join(REPO_DIR, "assets", "agente_antonio_giancani.png")
    if os.path.exists(ag_path):
        ag_img = Image.open(ag_path).convert("RGBA").resize((ag_r*2, ag_r*2), Image.Resampling.LANCZOS)
        mask = Image.new("L", (ag_r*2, ag_r*2), 0)
        ImageDraw.Draw(mask).ellipse([(0, 0), (ag_r*2, ag_r*2)], fill=255)
        im.paste(ag_img, (ag_cx - ag_r, ag_cy - ag_r), mask)
        
    f_ag_lbl = crea_grafica_social.get_font(14, bold=True)
    draw.text((ag_cx - 165, ag_cy - 12), "Antonio Giancani", fill=(255, 255, 255, 255), font=f_ag_lbl)
    f_ag_sub = crea_grafica_social.get_font(11, bold=False)
    draw.text((ag_cx - 165, ag_cy + 8), "Titolare Agenzia", fill=col_sec, font=f_ag_sub)
    
    # 4. Hero Photo Immobile con angoli arrotondati
    ph_w = W - 50
    ph_h = 960
    scale = max(ph_w / photo_im.width, ph_h / photo_im.height)
    nw, nh = int(photo_im.width * scale), int(photo_im.height * scale)
    scaled_photo = photo_im.resize((nw, nh), Image.Resampling.LANCZOS)
    x_off = (nw - ph_w) // 2
    y_off = (nh - ph_h) // 2
    photo_crop = scaled_photo.crop((x_off, y_off, x_off + ph_w, y_off + ph_h))
    
    mask_ph = Image.new("L", (ph_w, ph_h), 0)
    ImageDraw.Draw(mask_ph).rounded_rectangle([(0, 0), (ph_w, ph_h)], radius=24, fill=255)
    im.paste(photo_crop, (25, 180), mask_ph)
    draw.rounded_rectangle([(25, 180), (25 + ph_w, 180 + ph_h)], radius=24, outline=(255, 255, 255, 60), width=2)
    
    # Badge IN VENDITA top-left
    draw.rounded_rectangle([(45, 200), (230, 248)], radius=12, fill=col_prim)
    f_badge = crea_grafica_social.get_font(18, bold=True)
    draw.text((65, 213), "IN VENDITA", fill=(255, 255, 255, 255), font=f_badge)
    
    # Badge Contatore Immobile top-right
    draw.rounded_rectangle([(W - 245, 200), (W - 45, 248)], radius=12, fill=col_sec)
    f_cnt = crea_grafica_social.get_font(16, bold=True)
    draw.text((W - 225, 214), f"IMMOBILE {indice+1}/{totale}", fill=(15, 23, 42, 255), font=f_cnt)
    
    # Badge Stanza bottom-left
    draw.rounded_rectangle([(45, 180 + ph_h - 68), (560, 180 + ph_h - 20)], radius=12, fill=(15, 23, 42, 215), outline=(255, 255, 255, 50), width=1)
    f_room = crea_grafica_social.get_font(16, bold=True)
    stz_txt = f"📸 {stanza_nome[:38]}"
    draw.text((60, 180 + ph_h - 55), stz_txt, fill=(255, 255, 255, 255), font=f_room)
    
    # 5. Scheda Specifica & Prezzo Reale Sheet
    s_box = (25, 1160, W - 25, 1340)
    draw.rounded_rectangle([(s_box[0], s_box[1]), (s_box[2], s_box[3])], radius=20, fill=col_prim, outline=col_sec, width=2)
    
    titolo = immobile.get("titolo", "Immobile")
    prezzo = immobile.get("prezzo", "Trattativa Riservata")
    mq     = immobile.get("mq", "")
    luogo  = immobile.get("luogo", "Favara / Agrigento")
    
    f_title = crea_grafica_social.get_font(26, bold=True)
    draw.text((45, 1180), titolo[:42], fill=(255, 255, 255, 255), font=f_title)
    
    f_price = crea_grafica_social.get_font(38, bold=True)
    draw.text((45, 1225), prezzo, fill=col_sec, font=f_price)
    
    f_spec = crea_grafica_social.get_font(18, bold=True)
    spec_txt = f"📐 {mq}  •  📍 {luogo[:28]}"
    draw.text((45, 1285), spec_txt, fill=(255, 255, 255, 230), font=f_spec)
    
    # 6. Scheda Descrizione Sheet (Colonna F)
    d_box = (25, 1360, W - 25, 1750)
    draw.rounded_rectangle([(d_box[0], d_box[1]), (d_box[2], d_box[3])], radius=20, fill=(15, 23, 42, 235), outline=(255, 255, 255, 40), width=1)
    
    f_dhead = crea_grafica_social.get_font(16, bold=True)
    draw.text((50, 1380), "📝 DETTAGLIO AUTENTICO DALLO SHEET (COLONNA F):", fill=col_sec, font=f_dhead)
    
    f_dtext = crea_grafica_social.get_font(20, bold=False)
    lines = []
    words = desc_sheet.split()
    cur = ""
    for w in words:
        test = cur + (" " if cur else "") + w
        if len(test) > 52:
            lines.append(cur)
            cur = w
        else:
            cur = test
    if cur:
        lines.append(cur)
        
    dy = 1420
    for line in lines[:8]:
        draw.text((50, dy), line, fill=(241, 245, 249, 255), font=f_dtext)
        dy += 34
        
    # 7. Pulsante CTA Bottom
    btn_box = (25, 1780, W - 25, 1875)
    draw.rounded_rectangle([(btn_box[0], btn_box[1]), (btn_box[2], btn_box[3])], radius=35, fill=col_sec)
    f_cta = crea_grafica_social.get_font(21, bold=True)
    draw.text((80, 1812), "📞 PRENOTA LA VISITA: ANTONIO GIANCANI 320 166 7156", fill=(15, 23, 42, 255), font=f_cta)
    
    return im

def genera_video_carosello(durata_per_slide=3.5, musica_nome=None, invia_telegram=False):
    """Genera il video MP4 completo di tutti gli immobili mescolati a random"""
    os.makedirs(FRAMES_DIR, exist_ok=True)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # 1. Carica e rimescola gli immobili a random
    immobili = carica_immobili()
    if not immobili:
        print("❌ Nessun immobile trovato.")
        return None
        
    print(f"🔀 Shuffling {len(immobili)} immobili in ordine completamente casuale...")
    random.shuffle(immobili)
    
    palette = crea_grafica_social.ottieni_palette_del_giorno()
    print(f"🎨 Applicata Palette del Giorno per il Carosello: {palette['nome']}")
    
    totale = len(immobili)
    slide_files = []
    
    print("\n📸 Generazione frame verticali per ogni immobile...")
    for idx, imm in enumerate(immobili):
        galleria = imm.get("galleria", [])
        if not galleria:
            continue
            
        # Sceglie una foto random per ciascun immobile
        scelta = random.choice(galleria)
        foto_url = scelta.get("foto") or imm.get("fotoUrl")
        stanza_nome = scelta.get("stanza", "Ambiente")
        desc_sheet = scelta.get("desc") or imm.get("descrizione", "")
        
        photo_im = crea_grafica_social.scarica_o_apri_immagine(foto_url, 1080, 1080)
        slide_im = render_slide_verticale(imm, photo_im, stanza_nome, desc_sheet, idx, totale, palette)
        
        slide_path = os.path.join(FRAMES_DIR, f"slide_{idx:02d}.jpg")
        slide_im.save(slide_path, "JPEG", quality=95)
        slide_files.append(slide_path)
        print(f"  ✓ Frame {idx+1}/{totale}: {imm.get('titolo')[:32]} ({stanza_nome})")
        
    if not slide_files:
        print("❌ Nessun frame generato.")
        return None
        
    # 2. Crea file di concatenazione ffmpeg
    concat_txt = os.path.join(FRAMES_DIR, "concat_list.txt")
    with open(concat_txt, "w") as f:
        for sf in slide_files:
            f.write(f"file '{sf}'\n")
            f.write(f"duration {durata_per_slide}\n")
        # Ultimo frame ripetuto senza durata (standard ffmpeg concat demuxer)
        f.write(f"file '{slide_files[-1]}'\n")
        
    # 3. Seleziona traccia musicale
    musica_dir = os.path.join(REPO_DIR, "assets", "musica")
    brani = glob.glob(os.path.join(musica_dir, "*.mp3"))
    if not brani:
        print("⚠️ Nessun file mp3 trovato in assets/musica.")
        audio_opt = []
    else:
        if musica_nome:
            target_mp3 = os.path.join(musica_dir, musica_nome)
            audio_track = target_mp3 if os.path.exists(target_mp3) else random.choice(brani)
        else:
            audio_track = random.choice(brani)
        print(f"🎵 Traccia Musicale Diretta01: {os.path.basename(audio_track)}")
        audio_opt = ["-i", audio_track]
        
    # 4. Rendering FFmpeg
    output_mp4 = os.path.join(OUTPUT_DIR, "storia_carosello_immobili.mp4")
    print(f"🎬 Avvio rendering video FFmpeg in '{output_mp4}'...")
    
    t0 = time.time()
    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0", "-i", concat_txt
    ]
    if audio_opt:
        cmd.extend(audio_opt)
        cmd.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest"])
    else:
        cmd.extend(["-c:v", "libx264", "-pix_fmt", "yuv420p"])
        
    cmd.append(output_mp4)
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print(f"❌ Errore FFmpeg: {res.stderr}", file=sys.stderr)
        return None
        
    durata_tot = round(len(slide_files) * durata_per_slide, 1)
    file_size_mb = round(os.path.getsize(output_mp4) / (1024 * 1024), 2)
    print(f"🎉 Video Carosello Storie generato con successo in {round(time.time() - t0, 1)}s!")
    print(f"   📊 Durata: {durata_tot}s | Risoluzione: 1080x1920 (9:16) | Peso: {file_size_mb} MB")
    
    # 5. Invio su Telegram se richiesto
    if invia_telegram:
        invia_video_telegram(output_mp4, durata_tot, len(slide_files), palette["nome"])
        
    return output_mp4

def invia_video_telegram(video_path, durata, num_immobili, nome_palette):
    """Invia il file MP4 come video su Telegram a ad Antonio Giancani"""
    print(f"🚀 Invio video carosello su Telegram al bot @AMMINISTRAZIONISOCIAL_BOT...")
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendVideo"
    
    caption = (
        f"🎬 <b>VIDEO CAROSELLO STORIE (9:16) — TUTTI GLI IMMOBILI</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"🔀 <b>Sequenza:</b> {num_immobili} Immobili in Ordine Casuale\n"
        f"📸 <b>Foto:</b> Scatti casuali da ciascun Google Sheet\n"
        f"📝 <b>Testi:</b> Descrizioni autentiche dalla Colonna F\n"
        f"🎨 <b>Palette:</b> {nome_palette}\n"
        f"⏱️ <b>Durata Totale:</b> {durata}s (Ideale per Storie FB/IG & Status WhatsApp)\n"
        f"📞 <b>Contatto:</b> Antonio Giancani — 320 166 7156\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"<i>💡 Scarica il video e pubblicalo direttamente nelle tue Storie!</i>"
    )
    
    boundary = "----WebKitFormBoundary" + hex(int(time.time() * 1000))[2:]
    body = bytearray()
    
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="chat_id"\r\n\r\n')
    body.extend(f"{ANTONIO_CHAT_ID}\r\n".encode("utf-8"))
    
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="caption"\r\n\r\n')
    body.extend(caption.encode("utf-8"))
    body.extend(b"\r\n")
    
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="parse_mode"\r\n\r\n')
    body.extend(b"HTML\r\n")
    
    body.extend(f"--{boundary}\r\n".encode("utf-8"))
    body.extend(b'Content-Disposition: form-data; name="video"; filename="storia_carosello_giancani.mp4"\r\n')
    body.extend(b"Content-Type: video/mp4\r\n\r\n")
    
    with open(video_path, "rb") as vf:
        body.extend(vf.read())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("utf-8"))
    
    req = urllib.request.Request(
        url,
        data=bytes(body),
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            data = json.loads(resp.read().decode())
            if data.get("ok"):
                print("✅ Video Carosello Storie inviato con successo ad Antonio Giancani su Telegram!")
                return True
            else:
                print(f"❌ Risposta Telegram: {data}")
                return False
    except Exception as e:
        print(f"❌ Errore upload video Telegram: {e}", file=sys.stderr)
        return False

if __name__ == "__main__":
    invia_tg = "--telegram" in sys.argv
    genera_video_carosello(durata_per_slide=3.5, invia_telegram=invia_tg)
