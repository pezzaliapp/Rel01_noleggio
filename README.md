# Rel01_noleggio  
### Simulatore di Noleggio Operativo – allineato a BCC

**Rel01_noleggio** è una Progressive Web App (PWA) per il calcolo dei canoni di **noleggio operativo**, progettata per essere **coerente con il simulatore ufficiale BCC** e utilizzabile come strumento rapido di preventivazione commerciale.

L’app è pensata per l’uso professionale (commerciali, rivenditori, consulenti), con logica trasparente, coefficienti espliciti e output immediato.

---

## 🔧 Funzionalità principali

- Inserimento **imponibile fornitura**
- Selezione **durata contrattuale** (12 / 18 / 24 / 36 / 48 / 60 mesi)
- Calcolo automatico di:
  - Rata mensile
  - Spese di contratto
  - Costo giornaliero
  - Costo orario
- Applicazione automatica:
  - **Fascia di importo BCC**
  - **Valore di riacquisto (VR)** in funzione della durata
  - **Importo finanziato**
- Visualizzazione esplicita dei parametri utilizzati
- Esportazione **preventivo TXT**
- Modalità **Dark Mode**
- Funzionamento **offline** (PWA)

---

## 📐 Logica di calcolo

- I coefficienti sono applicati secondo:
  - **fasce di importo (fino a)**  
    5.000 / 15.000 / 25.000 / 50.000 / 100.000 / 999.999 €
  - **durata contrattuale**
- Il **valore di riacquisto (VR)** è calcolato in percentuale sull’imponibile:
  - 12 mesi → 10%
  - 18 mesi → 5%
  - 24 mesi → 3%
  - 36 / 48 / 60 mesi → 1%
- L’**importo finanziato** è:
  imponibile – VR
  > ⚠️ Nota tecnica  
> **Calcolo allineato al simulatore BCC**.  
> Eventuali scostamenti minimi sono dovuti esclusivamente agli **arrotondamenti interni di Excel**.

---

## 🧾 Output TXT

Il file TXT generato include:

- Dati di input
- Rata e costi
- Fascia applicata
- VR e importo finanziato
- Canoni disponibili per tutte le durate
- Nota tecnica finale

**Tutti gli importi sono IVA esclusa.**

---

## 📱 Progressive Web App (PWA)

- Installabile su desktop e mobile
- Cache intelligente con Service Worker
- Aggiornamento automatico a ogni nuova release
- Funzionamento offline

---

## 🗂 Struttura del progetto
```
/
├── index.html
├── style.css
├── app.js
├── service-worker.js
├── manifest.json
├── libs/
│   └── jspdf.umd.min.js
└── icons/
├── icons_crm-192x192.png
└── icons_crm-512x512.png
```
---

## 🧠 Filosofia del progetto

Rel01_noleggio **non è un gestionale** e **non sostituisce un’offerta ufficiale**.  
È uno strumento:

- rapido
- leggibile
- trasparente
- coerente con la logica bancaria

pensato per supportare il lavoro commerciale quotidiano.

---

## 📦 Versione

**Release 01 · Gennaio 2026**

---

## 👤 Autore

**Alessandro Pezzali**  
© 2025 – Tutti i diritti riservati

---

## ⚖️ Disclaimer

I risultati forniti sono a scopo **simulativo**.  
Condizioni finali, tassi e approvazioni dipendono dall’ente finanziatore e dall’istruttoria.
