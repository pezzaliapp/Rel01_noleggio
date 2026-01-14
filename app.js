/* ============================
   Rel01_noleggio — app.js
   Simulatore Canoni Locazione (BCC)
   ============================ */

// --- COEFFICIENTI BCC (canone = imponibile * coeff) ---
const BCC_COEFFICIENTS = {
  5000:   { 12: 0.081123, 18: 0.058239, 24: 0.045554, 36: 0.032359, 48: 0.025445, 60: 0.021358 },
  15000:  { 12: 0.081433, 18: 0.058341, 24: 0.045535, 36: 0.032207, 48: 0.025213, 60: 0.021074 },
  25000:  { 12: 0.081280, 18: 0.058195, 24: 0.045392, 36: 0.032065, 48: 0.025068, 60: 0.020926 }, // ✅ corretta
  50000:  { 12: 0.080770, 18: 0.057710, 24: 0.044915, 36: 0.031592, 48: 0.024588, 60: 0.020437 },
  100000: { 12: 0.080744, 18: 0.057686, 24: 0.044891, 36: 0.031568, 48: 0.024564, 60: 0.020413 }
};

const BCC_BANDS = Object.keys(BCC_COEFFICIENTS).map(Number).sort((a, b) => a - b);
const VALID_DURATIONS = [12, 18, 24, 36, 48, 60];

// ---------- UI helpers ----------
function $(id){ return document.getElementById(id); }
function setText(id, text){ const el = $(id); if (el) el.textContent = text; }
function round2(x){
  const n = (typeof x === "number") ? x : parseFloat(x);
  if (isNaN(n)) return 0;
  return Math.round(n * 100) / 100;
}

// ---------- parsing / formatting ----------
function parseEuropeanFloat(value) {
  if (value == null) return 0;

  // accetta: "18.381,00", "18381,00 €", "18381", "18 381,00"
  let s = String(value)
    .replace(/€/g, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const parsed = parseFloat(s);
  return isNaN(parsed) ? 0 : parsed;
}

function formatNumber(value) {
  const num = (typeof value === "number") ? value : parseFloat(value);
  const safe = isNaN(num) ? 0 : num;
  return safe.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ---------- logica BCC ----------
function calcolaSpeseContratto(importo) {
  importo = parseEuropeanFloat(importo);
  if (importo < 5001) return 75;
  if (importo < 10001) return 100;
  if (importo < 25001) return 150;
  if (importo < 50001) return 225;
  return 300;
}

function getFascia(importo) {
  importo = parseEuropeanFloat(importo);
  for (const maxImporto of BCC_BANDS) {
    if (importo <= maxImporto) return maxImporto;
  }
  return BCC_BANDS[BCC_BANDS.length - 1]; // 100000
}

function calcolaCanoniPerDurate(importo) {
  importo = parseEuropeanFloat(importo);
  const fascia = getFascia(importo);

  const result = {};
  for (const mesi of VALID_DURATIONS) {
    result[mesi] = round2(importo * BCC_COEFFICIENTS[fascia][mesi]);
  }
  return result;
}

// ---------- calcolo principale (bottone + auto) ----------
function calcola() {
  const importoEl = $("importo");
  const durataEl = $("durata");
  if (!importoEl || !durataEl) return;

  const importo = parseEuropeanFloat(importoEl.value);
  const durata = parseInt(durataEl.value, 10);

  if (!importo || isNaN(importo)) {
    alert("Per favore, inserisci un importo valido.");
    return;
  }
  if (!VALID_DURATIONS.includes(durata)) {
    alert("Durata non valida.");
    return;
  }

  const fascia = getFascia(importo);
  let rataMensile = importo * BCC_COEFFICIENTS[fascia][durata];
  rataMensile = round2(rataMensile);

  const speseContratto = calcolaSpeseContratto(importo);

  setText("rataMensile", formatNumber(rataMensile) + " €");
  setText("speseContratto", formatNumber(speseContratto) + " €");

  const costoGiornaliero = round2(rataMensile / 22);
  const costoOrario = round2(costoGiornaliero / 8);

  setText("costoGiornaliero", formatNumber(costoGiornaliero) + " €");
  setText("costoOrario", formatNumber(costoOrario) + " €");
}

// ---------- TXT ----------
function generaTXT() {
  const importoEl = $("importo");
  if (!importoEl) return;

  const importo = parseEuropeanFloat(importoEl.value);
  if (!importo || isNaN(importo)) {
    alert("Inserisci un importo valido prima di generare il file TXT.");
    return;
  }

  const canoni = calcolaCanoniPerDurate(importo);
  const speseContratto = calcolaSpeseContratto(importo);

  let testo = "";
  testo += "PREVENTIVO DI NOLEGGIO OPERATIVO BCC\n";
  testo += "--------------------------------------\n\n";
  testo += `Importo (imponibile): ${formatNumber(importo)} €\n\n`;

  testo += "CANONI MENSILI DISPONIBILI:\n";
  for (const mesi of VALID_DURATIONS) {
    testo += `${mesi} mesi: ${formatNumber(canoni[mesi])} €\n`;
  }

  testo += "\n\nDETTAGLI CONTRATTUALI:\n";
  testo += `Spese di contratto: ${formatNumber(speseContratto)} €\n`;
  testo += "Spese incasso RID: 4,00 € al mese\n\n";

  testo += "BENEFICI FISCALI:\n";
  testo += "- Canone interamente deducibile.\n";
  testo += "- Il bene non entra nei cespiti.\n";
  testo += "- Nessuna incidenza su IRAP.\n\n";

  testo += "BENEFICI FINANZIARI:\n";
  testo += "- Non è un finanziamento.\n";
  testo += "- Non impegna le linee di credito.\n";
  testo += "- Non è un bene da ammortizzare.\n\n";

  const blob = new Blob([testo], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `preventivo_noleggio_${Math.round(importo)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

// ---------- Dark mode + auto-calc ----------
document.addEventListener("DOMContentLoaded", () => {
  // Dark mode restore
  const saved = localStorage.getItem("darkMode");
  if (saved && JSON.parse(saved) === true) {
    document.body.classList.add("dark-mode");
  }

  // Dark mode toggle (safe)
  const toggle = $("darkModeToggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("darkMode", JSON.stringify(document.body.classList.contains("dark-mode")));
    });
  }

  // Auto-calc: quando cambi durata o quando scrivi importo (con debounce)
  const importoEl = $("importo");
  const durataEl = $("durata");

  const debounce = (fn, ms) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  if (durataEl) durataEl.addEventListener("change", () => calcola());
  if (importoEl) importoEl.addEventListener("input", debounce(() => {
    // calcola solo se c’è un numero valido
    const v = parseEuropeanFloat(importoEl.value);
    if (v > 0) calcola();
  }, 250));
});

// ---------- Service Worker (una sola volta) ----------
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./service-worker.js")
    .then(() => console.log("Service Worker registrato con successo!"))
    .catch(err => console.error("Errore SW:", err));
}
