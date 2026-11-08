// ==========================================

// 🎬 INVIA REELS OFF-MARKET CON PULSANTE NATIVO CTA
function inviaPulsanteReels(numero) {
  let numPulito = String(numero).replace(/\D/g, '');
  let urlMeta = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  let linkReels = CONFIG.MASTER_WEBAPP_URL + "?reels=1";

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numPulito,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      header: {
        type: 'text',
        text: '🍿 VETRINA REELS OFF-MARKET'
      },
      body: {
        text: 'La tua selezione esclusiva in formato video è pronta! Scopri gli immobili in anteprima con lo scorrimento verticale in stile TikTok.'
      },
      footer: {
        text: 'Giancani Immobiliare • Favara'
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: 'Guarda i Reels 🎬',
          url: linkReels
        }
      }
    }
  };

  let opzioni = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(urlMeta, opzioni);
}

// 🏦 INVIA SIMULATORE MUTUO CON PULSANTE NATIVO CTA
function inviaPulsanteMutuo(numero) {
  let numPulito = String(numero).replace(/\D/g, '');
  let urlMeta = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';
  let linkMutuo = CONFIG.MASTER_WEBAPP_URL + "?mutuo=1";

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numPulito,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      header: {
        type: 'text',
        text: '🏦 CALCOLO MUTUO INTERATTIVO'
      },
      body: {
        text: 'Accedi al nostro simulatore finanziario per calcolare la rata mensile ideale e l\'ammortamento della tua ipoteca in tempo reale.'
      },
      footer: {
        text: 'Giancani Immobiliare • Favara'
      },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: 'Simula Rata 📊',
          url: linkMutuo
        }
      }
    }
  };

  let opzioni = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(urlMeta, opzioni);
}


// 🏡 INVIA ELENCO CASE CON MENU A SELEZIONE NATIVA
function inviaMenuProprieta(numero) {
  let numPulito = String(numero).replace(/\D/g, '');
  let urlMeta = 'https://graph.facebook.com/v18.0/' + CONFIG.META_PHONE_ID + '/messages';

  let payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: numPulito,
    type: 'interactive',
    interactive: {
      type: 'list',
      header: { type: 'text', text: '🏡 CATALOGO IMMOBILIARE' },
      body: { text: 'Ecco le nostre ultime proposte esclusive. Clicca sul pulsante sotto per scegliere la tipologia di proprietà che desideri esplorare:' },
      footer: { text: 'Seleziona per vedere i dettagli' },
      action: {
        button: 'Vedi Proprietà 🔍',
        sections: [
          {
            title: '✨ Soluzioni in Evidenza',
            rows: [
              { id: 'prop_liberty', title: 'Villa Liberty', description: 'Favara • 5 vani • 250mq • Giardino' },
              { id: 'prop_mare', title: 'Appartamento Vista Mare', description: 'Agrigento • 3 vani • 120mq • Centro' }
            ]
          },
          {
            title: '💎 Moderne & Rustici',
            rows: [
              { id: 'prop_moderna', title: 'Casa Moderna con Piscina', description: 'P. Empedocle • 4 vani • 200mq' },
              { id: 'prop_rustico', title: 'Villa Rustica con Terreno', description: 'Raffadali • 6 vani • 300mq • 5000mq terra' }
            ]
          }
        ]
      }
    }
  };

  let opzioni = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': 'Bearer ' + CONFIG.WHATSAPP_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  UrlFetchApp.fetch(urlMeta, opzioni);
}

