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
        25000:  { 12: 0.081280, 18: 0.058195, 24: 0.045392, 36: 0.032065, 48: 0.025068, 60: 0.020926 },
        50000:  { 12: 0.080770, 18: 0.057710, 24: 0.044915, 36: 0.031592, 48: 0.024588, 60: 0.020437 },
        100000:{ 12: 0.080744, 18: 0.057686, 24: 0.044891, 36: 0.031568, 48: 0.024564, 60: 0.020413 }
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

// --- NUOVE FUNZIONI PER PDF --- //

// Calcola le spese di contratto con la stessa logica di calcola()
function calcolaSpeseContratto(importo) {
    let speseContratto = 0;
    if (importo < 5001) { speseContratto = 75; }
    else if (importo < 10001) { speseContratto = 100; }
    else if (importo < 25001) { speseContratto = 150; }
    else if (importo < 50001) { speseContratto = 225; }
    else { speseContratto = 300; }
    return speseContratto;
}

// Calcola tutti i canoni (12, 18, 24, 36, 48, 60) con gli stessi coefficienti
function calcolaCanoniPerDurate(importo) {
    const coefficienti = {
        5000:   { 12: 0.081123, 18: 0.058239, 24: 0.045554, 36: 0.032359, 48: 0.025445, 60: 0.021358 },
        15000:  { 12: 0.081433, 18: 0.058341, 24: 0.045535, 36: 0.032207, 48: 0.025213, 60: 0.021074 },
        25000:  { 12: 0.081280, 18: 0.058195, 24: 0.045392, 36: 0.032065, 48: 0.025068, 60: 0.020926 },
        50000:  { 12: 0.080770, 18: 0.057710, 24: 0.044915, 36: 0.031592, 48: 0.024588, 60: 0.020437 },
        100000:{ 12: 0.080744, 18: 0.057686, 24: 0.044891, 36: 0.031568, 48: 0.024564, 60: 0.020413 }
    };

    let fascia = null;
    for (let maxImporto in coefficienti) {
        if (importo <= maxImporto) {
            fascia = maxImporto;
            break;
        }
    }

    // sicurezza: se oltre 100000, uso l’ultima fascia
    if (!fascia) fascia = 100000;

    const result = {};
    const durate = [12, 18, 24, 36, 48, 60];

    durate.forEach(d => {
        result[d] = importo * coefficienti[fascia][d];
    });

    return result;
}

// Genera il PDF "PREVENTIVO DI NOLEGGIO" con tutti i canoni
function generaPDF() {
    const importoInput = document.getElementById("importo").value;
    const importo = parseEuropeanFloat(importoInput);

    if (importo === 0 || isNaN(importo)) {
        alert("Per favore, inserisci un importo valido prima di generare il PDF.");
        return;
    }

    // Controllo che jsPDF sia caricato
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("Impossibile generare il PDF.\nLa libreria jsPDF non è stata caricata.\n\nControlla la connessione internet e ricarica la pagina (CTRL+F5).");
        return;
    }

    const canoni = calcolaCanoniPerDurate(importo);
    const speseContratto = calcolaSpeseContratto(importo);

    // Creazione istanza jsPDF dall'UMD
    const doc = new window.jspdf.jsPDF();

    let y = 10;

    doc.setFontSize(14);
    doc.text("PREVENTIVO DI NOLEGGIO", 105, y, { align: "center" });
    y += 10;

    doc.setFontSize(11);
    doc.text("Canone mensile", 10, y);
    y += 8;

    doc.setFontSize(10);
    doc.text("PUOI SCEGLIERE TRA", 10, y);
    y += 8;

    // Tabella canoni
    const righe = [
        ["12 canoni da", formatNumber(canoni[12]) + " €"],
        ["18 canoni da", formatNumber(canoni[18]) + " €"],
        ["24 canoni da", formatNumber(canoni[24]) + " €"],
        ["36 canoni da", formatNumber(canoni[36]) + " €"],
        ["48 canoni da", formatNumber(canoni[48]) + " €"],
        ["60 canoni da", formatNumber(canoni[60]) + " €"]
    ];

    righe.forEach(riga => {
        doc.text(riga[0], 20, y);
        doc.text(riga[1], 120, y);
        y += 6;
    });

    y += 4;

    // Testo descrittivo BCC
    const testo1 = "Canoni al netto di IVA, fissi e comprensivi di polizza assicurativa All-Risk.";
    const testo2 = "Addebito 1° canone posticipato il primo giorno del mese susseguente alla ricezione della dichiarazione dei beni attestante l'avvenuta consegna.";
    const testo3 = "Al primo canone vengono aggiunte le spese di contratto pari ad € " + formatNumber(speseContratto) + ".";
    const testo4 = "Spese incasso RID € 4 al mese.";
    const testo5 = "BENEFICI FISCALI: Il canone è interamente deducibile nell’esercizio fiscale in cui è sostenuto. "
        + "Il bene non entra nei cespiti, non è vincolato alle aliquote di ammortamento, "
        + "non crea imponibile per la tassazione IRAP.";
    const testo6 = "BENEFICI FINANZIARI: Non influisce sulle linee di credito bancarie, perché non è un finanziamento. "
        + "Bilancio leggero - Il bene non è registrato come immobilizzazione in quanto i canoni di noleggio sono considerati servizi. "
        + "Le attrezzature non impattano sugli studi di settore.";

    const maxWidth = 180;

    function scriviBlocco(testo) {
        const lines = doc.splitTextToSize(testo, maxWidth);
        doc.text(lines, 10, y);
        y += lines.length * 6;
        y += 2;
    }

    scriviBlocco(testo1);
    scriviBlocco(testo2);
    scriviBlocco(testo3);
    scriviBlocco(testo4);
    scriviBlocco(testo5);
    scriviBlocco(testo6);

    // Nome file con importo
    const importoSanitized = formatNumber(importo).replace(/\./g, "_").replace(/,/g, "_");
    doc.save("preventivo_noleggio_" + importoSanitized + ".pdf");
}

// Funzione per convertire un numero europeo in float
function parseEuropeanFloat(value) {
    if (!value) return 0;
    value = value.replace(/€/g, '').replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
}

// Funzione per formattare un numero
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

// Registrazione del Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js')
        .then(() => console.log('Service Worker registrato con successo!'))
        .catch(err => console.error('Errore nella registrazione del Service Worker:', err));
}
