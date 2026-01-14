/* =========================================================
   Rel01_noleggio — app.js (pulito / variabili rinominate)
   - Calcolo allineato a simulatore BCC (tabella coefficienti + fasce)
   - UI: fascia applicata, VR (valore riacquisto), importo finanziato, badge
   - Nota tecnica in UI + in TXT:
     “Calcolo allineato al simulatore BCC (scostamenti minimi dovuti ad arrotondamenti Excel)”
   ========================================================= */

(function () {
  "use strict";

  // ---------- COSTANTI BCC ----------
  const DURATE_MESI = [12, 18, 24, 36, 48, 60];

  // VR% per durata (come tua tabella: 10,5,3,1,1,1)
  const VR_PERCENT_BY_DURATION = {
    12: 10,
    18: 5,
    24: 3,
    36: 1,
    48: 1,
    60: 1
  };

  // Coefficienti BCC (percentuali convertite in decimali)
  // Fasce IMPORTI (fino a): 5k, 15k, 25k, 50k, 100k, 999999
  const BCC_COEFFICIENTS_BY_BAND = {
    5000:   { 12: 0.08112, 18: 0.05824, 24: 0.04555, 36: 0.03236, 48: 0.02544, 60: 0.02136 },
    15000:  { 12: 0.08143, 18: 0.05834, 24: 0.04554, 36: 0.03221, 48: 0.02521, 60: 0.02107 },
    25000:  { 12: 0.08128, 18: 0.05820, 24: 0.04539, 36: 0.03206, 48: 0.02507, 60: 0.02093 },
    50000:  { 12: 0.08077, 18: 0.05771, 24: 0.04492, 36: 0.03159, 48: 0.02459, 60: 0.02044 },
    100000: { 12: 0.08074, 18: 0.05769, 24: 0.04489, 36: 0.03157, 48: 0.02456, 60: 0.02041 },
    999999: { 12: 0.07978, 18: 0.05696, 24: 0.04430, 36: 0.03111, 48: 0.02418, 60: 0.02007 }
  };

  const STORAGE_KEY_DARKMODE = "darkMode";

  // Nota tecnica richiesta (UI + TXT)
  const NOTA_BCC = "Calcolo allineato al simulatore BCC (scostamenti minimi dovuti ad arrotondamenti Excel)";

  // ---------- UTILS ----------
  function $(id) {
    return document.getElementById(id);
  }

  function round2(value) {
    const n = Number(value);
    return Math.round(n * 100) / 100;
  }

  // "18.381,00 €" -> 18381
  function parseEuropeanFloat(raw) {
    if (!raw) return 0;
    let v = String(raw)
      .replace(/€/g, "")
      .replace(/\s/g, "")
      .replace(/\./g, "")   // separatore migliaia
      .replace(",", ".");   // virgola -> punto decimale
    const parsed = parseFloat(v);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatEUR(value) {
    const n = Number(value) || 0;
    try {
      return n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch (e) {
      return String(round2(n)).replace(".", ",");
    }
  }

  function safeFileNumber(value) {
    // per nome file (niente virgole/spazi)
    const n = Math.round(Number(value) || 0);
    return String(n);
  }

  function getSpeseContratto(importo) {
    if (importo < 5001) return 75;
    if (importo < 10001) return 100;
    if (importo < 25001) return 150;
    if (importo < 50001) return 225;
    return 300;
  }

  function getBandLimitForImporto(importo) {
    // prende la prima fascia "fino a" >= importo
    const bands = Object.keys(BCC_COEFFICIENTS_BY_BAND)
      .map(Number)
      .sort((a, b) => a - b);

    for (let i = 0; i < bands.length; i++) {
      if (importo <= bands[i]) return bands[i];
    }
    return bands[bands.length - 1];
  }

  function getRataMensile(importo, durataMesi) {
    const bandLimit = getBandLimitForImporto(importo);
    const coeff = BCC_COEFFICIENTS_BY_BAND[bandLimit] && BCC_COEFFICIENTS_BY_BAND[bandLimit][durataMesi];
    const rata = coeff ? (importo * coeff) : 0;
    return { rata: round2(rata), bandLimit: bandLimit, coeff: coeff || 0 };
  }

  function getVR(importo, durataMesi) {
    const perc = VR_PERCENT_BY_DURATION[durataMesi] || 0;
    const valore = round2(importo * (perc / 100));
    return { perc: perc, valore: valore };
  }

  function ensureExtraUI() {
    // Se non esiste già, aggiunge un blocco sotto ".results"
    const resultsBox = document.querySelector(".results");
    if (!resultsBox) return;

    if ($("bccBadge")) return; // già creato

    const wrap = document.createElement("div");
    wrap.style.marginTop = "12px";
    wrap.style.padding = "10px";
    wrap.style.border = "1px solid rgba(0,0,0,.12)";
    wrap.style.borderRadius = "10px";
    wrap.style.background = "rgba(0,0,0,.03)";

    wrap.innerHTML = `
      <p style="margin:0 0 8px 0;">
        <b id="bccBadge">✅ ${NOTA_BCC}</b>
      </p>
      <p style="margin:0;">Fascia applicata: <b><span id="fasciaApplicata">—</span></b></p>
      <p style="margin:0;">Valore di riacquisto (VR): <b><span id="vrPerc">—</span>%</b> — <b><span id="vrEuro">—</span> €</b></p>
      <p style="margin:0;">Importo finanziato: <b><span id="importoFinanziato">—</span> €</b></p>
    `;

    resultsBox.appendChild(wrap);
  }

  function updateExtraUI(params) {
    // params: { bandLimit, vrPerc, vrEuro, importoFinanziato }
    if ($("fasciaApplicata")) $("fasciaApplicata").textContent = formatEUR(params.bandLimit);
    if ($("vrPerc")) $("vrPerc").textContent = formatEUR(params.vrPerc);
    if ($("vrEuro")) $("vrEuro").textContent = formatEUR(params.vrEuro);
    if ($("importoFinanziato")) $("importoFinanziato").textContent = formatEUR(params.importoFinanziato);
  }

  // ---------- AZIONI UI ----------
  function calcola() {
    ensureExtraUI();

    const importoRaw = $("importo") ? $("importo").value : "";
    const imponibile = parseEuropeanFloat(importoRaw);

    if (!imponibile || imponibile <= 0) {
      alert("Per favore, inserisci un importo valido.");
      return;
    }

    const durataMesi = parseInt($("durata") ? $("durata").value : "24", 10) || 24;

    // Validazione durata
    if (DURATE_MESI.indexOf(durataMesi) === -1) {
      alert("Durata non valida.");
      return;
    }

    const speseContratto = getSpeseContratto(imponibile);

    const rataInfo = getRataMensile(imponibile, durataMesi);
    const rataMensile = rataInfo.rata;

    const costoGiornaliero = round2(rataMensile / 22);
    const costoOrario = round2(costoGiornaliero / 8);

    // VR e importo finanziato
    const vr = getVR(imponibile, durataMesi);
    const importoFinanziato = round2(imponibile - vr.valore);

    // Scrivi risultati base
    if ($("rataMensile")) $("rataMensile").textContent = formatEUR(rataMensile) + " €";
    if ($("speseContratto")) $("speseContratto").textContent = formatEUR(speseContratto) + " €";
    if ($("costoGiornaliero")) $("costoGiornaliero").textContent = formatEUR(costoGiornaliero) + " €";
    if ($("costoOrario")) $("costoOrario").textContent = formatEUR(costoOrario) + " €";

    // Scrivi blocco extra
    updateExtraUI({
      bandLimit: rataInfo.bandLimit,
      vrPerc: vr.perc,
      vrEuro: vr.valore,
      importoFinanziato: importoFinanziato
    });
  }

  function calcolaCanoniPerDurate(imponibile) {
    const bandLimit = getBandLimitForImporto(imponibile);
    const coeffBand = BCC_COEFFICIENTS_BY_BAND[bandLimit];

    const result = {};
    DURATE_MESI.forEach((mesi) => {
      result[mesi] = round2(imponibile * (coeffBand[mesi] || 0));
    });

    return { canoni: result, bandLimit: bandLimit };
  }

  function generaTXT() {
    ensureExtraUI();

    const importoRaw = $("importo") ? $("importo").value : "";
    const imponibile = parseEuropeanFloat(importoRaw);

    if (!imponibile || imponibile <= 0) {
      alert("Inserisci un importo valido prima di generare il file TXT.");
      return;
    }

    const durataMesi = parseInt($("durata") ? $("durata").value : "24", 10) || 24;
    const speseContratto = getSpeseContratto(imponibile);

    const { canoni, bandLimit } = calcolaCanoniPerDurate(imponibile);

    const rataInfo = getRataMensile(imponibile, durataMesi);
    const rataMensile = rataInfo.rata;
    const costoGiornaliero = round2(rataMensile / 22);
    const costoOrario = round2(costoGiornaliero / 8);

    const vr = getVR(imponibile, durataMesi);
    const importoFinanziato = round2(imponibile - vr.valore);

    let testo = "";
    testo += "PREVENTIVO DI NOLEGGIO OPERATIVO BCC (simulazione)\n";
    testo += "---------------------------------------------------\n\n";

    testo += `${NOTA_BCC}\n\n`;

    testo += `Imponibile fornitura: ${formatEUR(imponibile)} €\n`;
    testo += `Fascia applicata (fino a): ${formatEUR(bandLimit)} €\n\n`;

    testo += `Durata selezionata: ${durataMesi} mesi\n`;
    testo += `Rata mensile: ${formatEUR(rataMensile)} €\n`;
    testo += `Spese di contratto: ${formatEUR(speseContratto)} €\n`;
    testo += `Costo giornaliero: ${formatEUR(costoGiornaliero)} €\n`;
    testo += `Costo orario: ${formatEUR(costoOrario)} €\n\n`;

    testo += `Valore di riacquisto (VR): ${formatEUR(vr.perc)}% = ${formatEUR(vr.valore)} €\n`;
    testo += `Importo finanziato (imponibile - VR): ${formatEUR(importoFinanziato)} €\n\n`;

    testo += "CANONI MENSILI DISPONIBILI:\n";
    DURATE_MESI.forEach((mesi) => {
      testo += `${mesi} mesi: ${formatEUR(canoni[mesi])} €\n`;
    });

    testo += "DETTAGLI CONTRATTUALI:\n";
   testo += "Spese incasso RID: 4,00 € al mese\n\n";

   testo += "NOTE TECNICHE:\n";
   testo += "- " + NOTA_BCC + "\n";
   testo += "- Tutti gli importi indicati sono da intendersi IVA esclusa.\n\n";

    const blob = new Blob([testo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `preventivo_noleggio_${safeFileNumber(imponibile)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  }

  // ---------- DARK MODE ----------
  function bindDarkMode() {
    const btn = $("darkModeToggle");
    if (!btn) return;

    btn.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem(STORAGE_KEY_DARKMODE, String(document.body.classList.contains("dark-mode")));
    });

    const saved = localStorage.getItem(STORAGE_KEY_DARKMODE);
    if (saved === "true") document.body.classList.add("dark-mode");
  }

  // ---------- SERVICE WORKER ----------
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("./service-worker.js")
      .then(() => console.log("Service Worker registrato con successo!"))
      .catch((err) => console.error("Errore nella registrazione del Service Worker:", err));
  }

  // ---------- BOOT ----------
  document.addEventListener("DOMContentLoaded", () => {
    bindDarkMode();
    ensureExtraUI();
    registerServiceWorker();
  });

  // Esporta funzioni per onclick HTML
  window.calcola = calcola;
  window.generaTXT = generaTXT;

})();
