#!/usr/bin/env python3
"""
===============================================================================
MOTORE GRAFICO SOCIAL — IMMOBILIARE GIANCANI
Generatore di Card Grafiche ad Alta Risoluzione (1080x1080) per Social & Telegram
===============================================================================
"""

import os
import math
import urllib.request
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont, ImageFilter

FONT_BOLD_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_REG_PATH  = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"

def get_font(size, bold=False):
    path = FONT_BOLD_PATH if bold else FONT_REG_PATH
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()

def draw_phone_icon(draw, x, y, size=18, color=(255, 255, 255, 255)):
    draw.rounded_rectangle([(x, y), (x + size*0.65, y + size)], radius=3, outline=color, width=2)
    draw.line([(x + size*0.2, y + size*0.82), (x + size*0.45, y + size*0.82)], fill=color, width=2)

def draw_mail_icon(draw, x, y, size=18, color=(255, 255, 255, 255)):
    w, h = size * 1.1, size * 0.75
    draw.rectangle([(x, y), (x + w, y + h)], outline=color, width=2)
    draw.line([(x, y), (x + w/2, y + h*0.55)], fill=color, width=2)
    draw.line([(x + w, y), (x + w/2, y + h*0.55)], fill=color, width=2)

def draw_pin_icon(draw, x, y, size=18, color=(255, 255, 255, 255), inner_color=(0, 104, 55, 255)):
    r = size * 0.4
    cx, cy = x + r, y + r
    draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=color)
    draw.polygon([(cx - r*0.85, cy + r*0.3), (cx + r*0.85, cy + r*0.3), (cx, cy + size)], fill=color)
    draw.ellipse([(cx - r*0.4, cy - r*0.4), (cx + r*0.4, cy + r*0.4)], fill=inner_color)

def scarica_o_apri_immagine(foto_url, W=1080, H=1080):
    """Carica immagine da URL o path locale e fa cover crop a WxH"""
    try:
        if foto_url.startswith("http"):
            req = urllib.request.Request(foto_url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=12) as resp:
                data = resp.read()
                im = Image.open(BytesIO(data)).convert("RGB")
        else:
            im = Image.open(foto_url).convert("RGB")
            
        scale = max(W / im.width, H / im.height)
        nw, nh = int(im.width * scale), int(im.height * scale)
        im = im.resize((nw, nh), Image.Resampling.LANCZOS)
        x_off = (nw - W) // 2
        y_off = (nh - H) // 2
        return im.crop((x_off, y_off, x_off + W, y_off + H))
    except Exception as e:
        print(f"⚠️ Errore caricamento immagine '{foto_url}': {e}")
        # Immagine di fallback sfumata elegante
        im = Image.new("RGB", (W, H), (15, 23, 42))
        return im

# =============================================================================
# STILE 1: GIANCANI GREEN WAVE (STILE TECNOCASA ADATTATO 100% GIANCANI)
# =============================================================================
def render_giancani_green_wave(foto_url, titolo, prezzo, mq, luogo, categoria="APPARTAMENTO"):
    W, H = 1080, 1080
    base_im = scarica_o_apri_immagine(foto_url, W, H)
    
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    # 1. Top-left white arch con curva
    points = [(0, 0), (540, 0)]
    for t in range(0, 101, 5):
        t_f = t / 100.0
        bx = (1-t_f)**2 * 540 + 2*(1-t_f)*t_f * 460 + t_f**2 * 0
        by = (1-t_f)**2 * 0 + 2*(1-t_f)*t_f * 170 + t_f**2 * 200
        points.append((bx, by))
    points.append((0, 200))
    
    # Ombra arch
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    s_points = [(p[0] + 4, p[1] + 4) for p in points]
    sdraw.polygon(s_points, fill=(0, 0, 0, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    overlay = Image.alpha_composite(shadow, overlay)
    draw = ImageDraw.Draw(overlay)
    
    # Arco bianco
    draw.polygon(points, fill=(255, 255, 255, 255))
    
    # Logo Immobiliare Giancani
    logo_path = "/home/antigravity/CONTROLLORE_META_TELEGRAM/assets/logo_giancani_trasparente.png"
    if os.path.exists(logo_path):
        logo = Image.open(logo_path).convert("RGBA")
        lw = 360
        lh = int(logo.height * (lw / logo.width))
        logo = logo.resize((lw, lh), Image.Resampling.LANCZOS)
        overlay.paste(logo, (35, 30), logo)
    else:
        f_logo = get_font(26, bold=True)
        draw.text((45, 45), "IMMOBILIARE GIANCANI", fill=(0, 104, 55, 255), font=f_logo)
        
    f_sub = get_font(14, bold=True)
    draw.text((45, 150), "SERVIZI IMMOBILIARI & CONSULENZA", fill=(0, 104, 55, 255), font=f_sub)
    
    # 2. Badge VENDITA Verde Smeraldo
    v_box = (35, 360, 360, 435)
    draw.rounded_rectangle([(v_box[0]+3, v_box[1]+3), (v_box[2]+3, v_box[3]+3)], radius=12, fill=(0, 0, 0, 60))
    draw.rounded_rectangle([(v_box[0], v_box[1]), (v_box[2], v_box[3])], radius=12, fill=(0, 104, 55, 255))
    f_vendita = get_font(42, bold=True)
    draw.text((60, 372), "VENDITA", fill=(255, 255, 255, 255), font=f_vendita)
    
    # 3. Pill Categoria (es. PIANO TERRA / VILLA / APPARTAMENTO)
    cat_text = categoria.upper() if categoria else "APPARTAMENTO"
    f_cat = get_font(24, bold=True)
    t_box = (45, 445, 360, 495)
    draw.rounded_rectangle([(t_box[0]+2, t_box[1]+2), (t_box[2]+2, t_box[3]+2)], radius=8, fill=(0, 0, 0, 50))
    draw.rounded_rectangle([(t_box[0], t_box[1]), (t_box[2], t_box[3])], radius=8, fill=(255, 255, 255, 255))
    draw.text((60, 453), cat_text, fill=(15, 23, 42, 255), font=f_cat)
    
    # 4. Schede Spec Bar (3 box verticali con icona circolare verde)
    specs = [
        ("house", f"{mq}", None),
        ("pin", f"{luogo}", "Zona"),
        ("euro", f"{prezzo}", None)
    ]
    
    s_y = 515
    card_w = 330
    card_h = 60
    f_spec_val = get_font(23, bold=True)
    f_spec_lbl = get_font(13, bold=False)
    
    for icon_type, val, lbl in specs:
        draw.rounded_rectangle([(48, s_y + 3), (45 + card_w + 3, s_y + card_h + 3)], radius=12, fill=(0, 0, 0, 45))
        draw.rounded_rectangle([(45, s_y), (45 + card_w, s_y + card_h)], radius=12, fill=(255, 255, 255, 255))
        
        # Cerchio verde
        cx, cy, cr = 78, s_y + 30, 20
        draw.ellipse([(cx - cr, cy - cr), (cx + cr, cy + cr)], fill=(0, 104, 55, 255))
        
        if icon_type == "house":
            draw.polygon([(cx, cy - 9), (cx + 9, cy), (cx - 9, cy)], fill=(255, 255, 255, 255))
            draw.rectangle([(cx - 6, cy), (cx + 6, cy + 8)], fill=(255, 255, 255, 255))
        elif icon_type == "pin":
            draw_pin_icon(draw, cx - 7, cy - 10, size=18, color=(255, 255, 255, 255), inner_color=(0, 104, 55, 255))
        elif icon_type == "euro":
            f_e = get_font(22, bold=True)
            draw.text((cx - 8, cy - 13), "€", fill=(255, 255, 255, 255), font=f_e)
            
        # Testo
        val_clean = str(val)[:24]
        if lbl:
            draw.text((112, s_y + 10), lbl, fill=(100, 116, 139, 255), font=f_spec_lbl)
            draw.text((112, s_y + 27), val_clean, fill=(15, 23, 42, 255), font=f_spec_val)
        else:
            col = (0, 104, 55, 255) if icon_type == "euro" else (15, 23, 42, 255)
            draw.text((112, s_y + 16), val_clean, fill=col, font=f_spec_val)
            
        s_y += card_h + 14
        
    # 5. Onda Verde Smeraldo Footer
    f_points = [(0, H), (W, H), (W, 930)]
    for t in range(100, -1, -5):
        t_f = t / 100.0
        bx = (1-t_f)**3 * 0 + 3*(1-t_f)**2*t_f * 350 + 3*(1-t_f)*t_f**2 * 750 + t_f**3 * 1080
        by = (1-t_f)**3 * 930 + 3*(1-t_f)**2*t_f * 960 + 3*(1-t_f)*t_f**2 * 900 + t_f**3 * 930
        f_points.append((bx, by))
    f_points.append((0, 930))
    
    draw.polygon(f_points, fill=(0, 104, 55, 255))
    
    # Separatori verticali
    draw.line([(390, 965), (390, 1050)], fill=(255, 255, 255, 100), width=2)
    draw.line([(760, 965), (760, 1050)], fill=(255, 255, 255, 100), width=2)
    
    f_fbold = get_font(19, bold=True)
    f_fsub = get_font(15, bold=False)
    
    # Colonna 1: Agenzia
    draw_pin_icon(draw, 45, 975, size=18, color=(255, 255, 255, 255), inner_color=(0, 104, 55, 255))
    draw.text((70, 975), "Immobiliare Giancani", fill=(255, 255, 255, 255), font=f_fbold)
    draw.text((70, 1008), "Agrigento e Favara (AG)", fill=(240, 253, 244, 255), font=f_fsub)
    
    # Colonna 2: Contatti
    draw_phone_icon(draw, 415, 977, size=18, color=(255, 255, 255, 255))
    draw.text((440, 975), "320 166 7156", fill=(255, 255, 255, 255), font=f_fbold)
    draw_mail_icon(draw, 415, 1010, size=18, color=(255, 255, 255, 255))
    draw.text((440, 1008), "giancaniimmobiliare@gmail.com", fill=(240, 253, 244, 255), font=f_fsub)
    
    # Colonna 3: Badge Social
    socials = [("f", (24, 119, 242)), ("📷", (225, 48, 108)), ("✆", (37, 211, 102))]
    sx = 800
    f_soc = get_font(20, bold=True)
    for sicon, scol in socials:
        draw.ellipse([(sx, 980), (sx + 45, 1025)], fill=scol)
        draw.text((sx + 13, 990), sicon, fill=(255, 255, 255, 255), font=f_soc)
        sx += 60
        
    final_img = Image.alpha_composite(base_im.convert("RGBA"), overlay)
    return final_img.convert("RGB")

# =============================================================================
# STILE 2: PROVENZANO & PROTO EXECUTIVE (FOTO REALE ANTONIO GIANCANI)
# =============================================================================
def render_provenzano_executive(foto_url, titolo, prezzo, mq, luogo, categoria="APPARTAMENTO"):
    W, H = 1080, 1080
    base_im = scarica_o_apri_immagine(foto_url, W, H)
    
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    
    footer_h = 175
    # Gradiente scuro sopra foto
    for y in range(int(H * 0.4), H - footer_h + 30):
        factor = (y - H * 0.4) / (H - footer_h + 30 - H * 0.4)
        alpha = int(factor * 240)
        draw.line([(0, y), (W, y)], fill=(20, 16, 48, alpha))
        
    # Header Indigo (#1e1948)
    draw.rectangle([(0, 0), (460, 195)], fill=(30, 25, 72, 255))
    draw.line([(35, 195), (35, H - footer_h - 220)], fill=(255, 255, 255, 255), width=2)
    
    f_site = get_font(14, bold=True)
    draw.text((35, 35), "giancani-immobiliare.it  ●  f  in", fill=(255, 255, 255, 200), font=f_site)
    f_brand = get_font(22, bold=True)
    draw.text((35, 75), "IMMOBILIARE GIANCANI", fill=(255, 255, 255, 255), font=f_brand)
    f_sub = get_font(13, bold=True)
    draw.text((35, 115), "LA CERTEZZA DELLA COMPETENZA", fill=(255, 255, 255, 200), font=f_sub)
    draw.text((35, 145), "SERVIZI IMMOBILIARI ESCLUSIVI • FAVARA (AG)", fill=(255, 210, 0, 255), font=f_sub)
    
    # Badge Agente in Alto a Destra (FOTO REALE ANTONIO GIANCANI!)
    ag_cx, ag_cy, ag_r = W - 135, 120, 75
    # Cerchio oro
    draw.ellipse([(ag_cx - ag_r - 4, ag_cy - ag_r - 4), (ag_cx + ag_r + 4, ag_cy + ag_r + 4)], fill=(255, 210, 0, 255))
    
    # Carica ritratto reale di Antonio Giancani
    ag_path = "/home/antigravity/CONTROLLORE_META_TELEGRAM/assets/agente_antonio_giancani.png"
    if os.path.exists(ag_path):
        ag_img = Image.open(ag_path).convert("RGBA").resize((ag_r*2, ag_r*2), Image.Resampling.LANCZOS)
        # Maschera circolare
        mask = Image.new("L", (ag_r*2, ag_r*2), 0)
        mdraw = ImageDraw.Draw(mask)
        mdraw.ellipse([(0, 0), (ag_r*2, ag_r*2)], fill=255)
        overlay.paste(ag_img, (ag_cx - ag_r, ag_cy - ag_r), mask)
        
    # Pillola Nome Agente
    draw.rounded_rectangle([(ag_cx - 100, ag_cy + ag_r - 15), (ag_cx + 100, ag_cy + ag_r + 25)], radius=20, fill=(30, 25, 72, 255), outline=(255, 255, 255, 255), width=2)
    f_name = get_font(16, bold=True)
    draw.text((ag_cx - 68, ag_cy + ag_r - 5), "Antonio Giancani", fill=(255, 255, 255, 255), font=f_name)
    
    # Testi principali
    spec_y = H - footer_h - 70
    f_cat = get_font(26, bold=True)
    draw.text((35, spec_y - 75), (categoria or "APPARTAMENTO").upper(), fill=(255, 255, 255, 255), font=f_cat)
    f_invend = get_font(38, bold=True)
    draw.text((35, spec_y - 45), "IN VENDITA", fill=(255, 210, 0, 255), font=f_invend)
    
    # Spec bar 4 colonne
    bar_y = spec_y
    bar_h = 52
    draw.rounded_rectangle([(35, bar_y), (W - 35, bar_y + bar_h)], radius=12, fill=(30, 25, 72, 240), outline=(255, 210, 0, 255), width=2)
    
    col_w = (W - 70) // 4
    cols = [
        f"📍 {luogo[:15]}",
        f"📐 {mq}",
        f"🚗 Garage/Box",
        f"💰 {prezzo}"
    ]
    f_col = get_font(15, bold=True)
    for i, ctext in enumerate(cols):
        cx = 45 + i * col_w
        draw.text((cx, bar_y + 16), ctext, fill=(255, 255, 255, 255), font=f_col)
        if i < 3:
            draw.line([(35 + (i+1)*col_w, bar_y + 8), (35 + (i+1)*col_w, bar_y + bar_h - 8)], fill=(255, 210, 0, 180), width=1)
            
    # Footer Grigio Chiaro
    draw.rectangle([(0, H - footer_h), (W, H)], fill=(243, 244, 248, 255))
    
    # Testo Footer
    f_fhead = get_font(18, bold=True)
    f_fdesc = get_font(14, bold=False)
    draw.text((40, H - footer_h + 20), f"{titolo[:40]}", fill=(30, 25, 72, 255), font=f_fhead)
    draw.text((40, H - footer_h + 55), f"✨ Ottima esposizione • Ampia metratura • Assistenza completa", fill=(71, 85, 105, 255), font=f_fdesc)
    
    # Pulsante Contattaci
    btn_x, btn_y = W - 320, H - footer_h + 35
    draw.rounded_rectangle([(btn_x, btn_y), (W - 40, btn_y + 55)], radius=27, fill=(30, 25, 72, 255))
    draw.rounded_rectangle([(btn_x, btn_y), (btn_x + 130, btn_y + 55)], radius=27, fill=(255, 210, 0, 255))
    f_btn = get_font(14, bold=True)
    draw.text((btn_x + 15, btn_y + 18), "CONTATTACI", fill=(30, 25, 72, 255), font=f_btn)
    draw.text((btn_x + 145, btn_y + 18), "320 166 7156", fill=(255, 255, 255, 255), font=f_btn)
    
    final_img = Image.alpha_composite(base_im.convert("RGBA"), overlay)
    return final_img.convert("RGB")

def render_grafica_per_stile(stile, foto_url, titolo, prezzo, mq, luogo, categoria="APPARTAMENTO"):
    """Seleziona lo stile specificato o alterna"""
    if stile == "giancani_green_wave":
        return render_giancani_green_wave(foto_url, titolo, prezzo, mq, luogo, categoria)
    else:
        # Default provenzeno executive o fallback green wave
        return render_provenzano_executive(foto_url, titolo, prezzo, mq, luogo, categoria)
