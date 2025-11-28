// Calcolo Noleggio
function calcola() {
    let importoInput = document.getElementById("importo").value;
    let importo = parseEuropeanFloat(importoInput);
    if (importo === 0 || isNaN(importo)) {
        alert("Per favore, inserisci un importo valido.");
        return;
    }
    let durata = parseInt(document.getElementById("durata").value);
    let rataMensile = 0;
    let speseContratto = 0;

    if (importo < 5001) { speseContratto = 75; }
    else if (importo < 10001) { speseContratto = 100; }
    else if (importo < 25001) { speseContratto = 150; }
    else if (importo < 50001) { speseContratto = 225; }
    else { speseContratto = 300; }

    const coefficienti = {
        5000:   { 12: 0.081123, 18: 0.058239, 24: 0.045554, 36: 0.032359, 48: 0.025445, 60: 0.021358 },
        15000:  { 12: 0.081433, 18: 0.058341, 24: 0.045535, 36: 0.032207, 48: 0.025213, 60: 0.021074 },
        25000:  { 12: 0.058195, 18: 0.045392, 24: 0.032065, 36: 0.025068, 48: 0.020926, 60: 0.081280 },
        50000:  { 12: 0.080770, 18: 0.057710, 24: 0.044915, 36: 0.031592, 48: 0.024588, 60: 0.020437 },
        100000: { 12: 0.080744, 18: 0.057686, 24: 0.044891, 36: 0.031568, 48: 0.024564, 60: 0.020413 }
    };

    for (let maxImporto in coefficienti) {
        if (importo <= maxImporto) {
            rataMensile = importo * coefficienti[maxImporto][durata];
            break;
        }
    }

    document.getElementById("rataMensile").textContent = formatNumber(rataMensile) + " €";
    document.getElementById("speseContratto").textContent = formatNumber(speseContratto) + " €";

    let costoGiornaliero = rataMensile / 22;
    let costoOrario = costoGiornaliero / 8;

    document.getElementById("costoGiornaliero").textContent = formatNumber(costoGiornaliero) + " €";
    document.getElementById("costoOrario").textContent = formatNumber(costoOrario) + " €";
}

// --- CALCOLI PER LE DURATE --- //

function calcolaSpeseContratto(importo) {
    if (importo < 5001) return 75;
    if (importo < 10001) return 100;
    if (importo < 25001) return 150;
    if (importo < 50001) return 225;
    return 300;
}

function calcolaCanoniPerDurate(importo) {
    const coefficienti = {
        5000:   { 12: 0.081123, 18: 0.058239, 24: 0.045554, 36: 0.032359, 48: 0.025445, 60: 0.021358 },
        15000:  { 12: 0.081433, 18: 0.058341, 24: 0.045535, 36: 0.032207, 48: 0.025213, 60: 0.021074 },
        25000:  { 12: 0.081280, 18: 0.058195, 24: 0.045392, 36: 0.032065, 48: 0.025068, 60: 0.020926 },
        50000:  { 12: 0.080770, 18: 0.057710, 24: 0.044915, 36: 0.031592, 48: 0.024588, 60: 0.020437 },
        100000:{ 12: 0.080744, 18: 0.057686, 24: 0.044891, 36: 0.031568, 48: 0.024564, 60: 0.020413 }
    };

    let fascia = Object.keys(coefficienti).find(key => importo <= key) || 100000;

    let result = {};
    [12, 18, 24, 36, 48, 60].forEach(mesi => {
        result[mesi] = importo * coefficienti[fascia][mesi];
    });

    return result;
}

// --- NUOVA FUNZIONE: GENERA TXT --- //

function generaTXT() {
    const importoInput = document.getElementById("importo").value;
    const importo = parseEuropeanFloat(importoInput);

    if (!importo || isNaN(importo)) {
        alert("Inserisci un importo valido prima di generare il file TXT.");
        return;
    }

    const canoni = calcolaCanoniPerDurate(importo);
    const speseContratto = calcolaSpeseContratto(importo);

    let testo = "";
    testo += "PREVENTIVO DI NOLEGGIO OPERATIVO BCC\n";
    testo += "--------------------------------------\n\n";

    testo += `Importo: ${formatNumber(importo)} €\n\n`;

    testo += "CANONI MENSILI DISPONIBILI:\n";
    testo += `12 mesi: ${formatNumber(canoni[12])} €\n`;
    testo += `18 mesi: ${formatNumber(canoni[18])} €\n`;
    testo += `24 mesi: ${formatNumber(canoni[24])} €\n`;
    testo += `36 mesi: ${formatNumber(canoni[36])} €\n`;
    testo += `48 mesi: ${formatNumber(canoni[48])} €\n`;
    testo += `60 mesi: ${formatNumber(canoni[60])} €\n`;

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

    // Blob TXT
    const blob = new Blob([testo], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `preventivo_noleggio_${importo}.txt`;
    a.click();

    URL.revokeObjectURL(url);
}

// --- UTILITIES --- //

function parseEuropeanFloat(value) {
    if (!value) return 0;
    value = value.replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    return parseFloat(value);
}

function formatNumber(value) {
    return value.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Modalità Scura
document.getElementById('darkModeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
});

document.addEventListener('DOMContentLoaded', () => {
    if (JSON.parse(localStorage.getItem('darkMode'))) {
        document.body.classList.add('dark-mode');
    }
});

// Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service Worker registrato con successo!'))
        .catch(err => console.error('Errore SW:', err));
}
