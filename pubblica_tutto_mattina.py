#!/usr/bin/env python3
"""
===============================================================================
CONDIVISIONE MATTUTINA AUTOMATICA — IMMOBILIARE GIANCANI
Invia ogni mattina tutti i contenuti su Telegram e canali collegati,
preservando la sicurezza Anti-Ban Meta (chiamate dirette isolate).
===============================================================================
"""

import os
import sys
import time
from datetime import datetime

import invia_social_giornaliero
import genera_video_storia_carosello

def main():
    print("=" * 65)
    print("🌅 AVVIO CONDIVISIONE MATTUTINA AUTOMATICA GIANCANI")
    print(f"⏰ Data e Ora: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("🛡️ Canali: Telegram + WhatsApp / Condivisione Manuale (Meta API Bloccate)")
    print("=" * 65)
    
    # 1. Invio singoli post con foto e grafica del giorno su Telegram
    print("\n[FASE 1/2] 📸 Invio singoli post immobili con foto casuale e testi Sheet...")
    try:
        immobili = invia_social_giornaliero.carica_immobili()
        successi = 0
        for imm in immobili:
            try:
                ok = invia_social_giornaliero.genera_e_invia_singolo(imm)
                if ok:
                    successi += 1
                time.sleep(1.5)
            except Exception as e:
                print(f"⚠️ Errore invio immobile #{imm.get('id')}: {e}")
        print(f"✅ Completata Fase 1: {successi}/{len(immobili)} post inviati con successo!")
    except Exception as e:
        print(f"❌ Errore generale Fase 1: {e}")
        
    # 2. Generazione e invio Video Carosello Storie (9:16) con tutti gli immobili in ordine random
    print("\n[FASE 2/2] 🎬 Generazione Video Carosello Storie 9:16 (Royalty-Free Music)...")
    try:
        video_mp4 = genera_video_storia_carosello.genera_video_carosello(durata_per_slide=3.5, invia_telegram=True)
        if video_mp4 and os.path.exists(video_mp4):
            print(f"✅ Completata Fase 2: Video Carosello inviato ad Antonio Giancani su Telegram!")
        else:
            print("⚠️ Errore o video non generato.")
    except Exception as e:
        print(f"❌ Errore generale Fase 2: {e}")
        
    print("\n" + "=" * 65)
    print("🎉 CONDIVISIONE MATTUTINA TERMINATA CON SUCCESSO!")
    print("=" * 65)

if __name__ == "__main__":
    main()
