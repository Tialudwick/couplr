/**
 * script.js - Couplr Full Interactive (Static Version for GitHub Pages)
 * Includes: Monte Carlo Engine, Comparison Mode, and Custom Labeling.
 */

let comparisonData = null; 
let comparisonLabel = "Saved Comparison";
let myChart = null;

// ---------- Person Logic ----------
class Person {
    constructor(name, traits) {
        this.name = name;
        this.traits = traits;
        this.emotional_state = 0.5;
    }

    decideAction(currentScore, eventEffect = 0) {
        const traitValues = Object.values(this.traits);
        const base = traitValues.reduce((a, b) => a + b, 0) / traitValues.length;
        
        let variation = (Math.random() * 0.4) - 0.2; 
        if (currentScore < 0.4) variation -= 0.05;

        this.emotional_state = Math.max(0, Math.min(1, this.emotional_state + variation + eventEffect));
        return base + this.emotional_state;
    }
}

// ---------- Helper: Scrape UI ----------
function getTraitsFromUI() {
    const traits = {};
    const agentDivs = document.querySelectorAll("#agents-container .agent");
    agentDivs.forEach(div => {
        const name = div.querySelector("h3").innerText;
        traits[name] = {
            communication: parseFloat(div.querySelector(".comm").value),
            trust: parseFloat(div.querySelector(".trust").value),
            patience: parseFloat(div.querySelector(".patience").value)
        };
    });
    return traits;
}

// ---------- Simulation Engine ----------
function runInternalSimulation(traits, steps = 12, runs = 100) {
    const allRuns = [];
    const names = Object.keys(traits);

    for (let r = 0; r < runs; r++) {
        let agents = names.map(name => new Person(name, traits[name]));
        let score = 0.5;
        let history = [];

        for (let s = 0; s < steps; s++) {
            let eventEffect = 0;
            let eventLog = [];

            if (Math.random() < 0.2) {
                let effect = (Math.random() * 0.3) - 0.15;
                eventEffect += effect;
                eventLog.push(`Event: ${effect.toFixed(2)}`);
            }

            let sumActions = agents.reduce((sum, a) => sum + a.decideAction(score, eventEffect), 0);
            let change = (sumActions / agents.length) / 10; 
            
            score = Math.max(0, Math.min(1, score + (change - 0.05))); 
            history.push({ score: score, events: eventLog });
        }
        allRuns.push(history);
    }
    return allRuns;
}

// ---------- UI Handlers ----------

document.getElementById("add-agent-button").addEventListener("click", () => {
    const nameInput = document.getElementById("agent-name");
    const name = nameInput.value.trim();
    if (!name) return alert("Enter a name");

    const comm = document.getElementById("agent-comm").value;
    const trust = document.getElementById("agent-trust").value;
    const patience = document.getElementById("agent-patience").value;

    const div = document.createElement("div");
    div.className = "agent";
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>${name}</h3>
            <button class="remove-btn" style="background:#ddd; border:none; padding:2px 8px; border-radius:4px;">×</button>
        </div>
        <label>Communication: <input type="number" class="comm" min="0" max="1" step="0.01" value="${comm}"></label>
        <label>Trust: <input type="number" class="trust" min="0" max="1" step="0.01" value="${trust}"></label>
        <label>Patience: <input type="number" class="patience" min="0" max="1" step="0.01" value="${patience}"></label>
    `;
    document.getElementById("agents-container").appendChild(div);
    div.querySelector(".remove-btn").addEventListener("click", () => div.remove());
    nameInput.value = "";
});

document.getElementById("run-sim").addEventListener("click", () => {
    const traits = getTraitsFromUI();
    if (Object.keys(traits).length < 2) return alert("Add at least 2 people!");

    const results = runInternalSimulation(traits, 12, 100);
    const firstRunScores = results[0].map(r => r.score);
    
    const finalScore = (firstRunScores[firstRunScores.length - 1] * 100).toFixed(1);
    document.getElementById("results").innerHTML = `<strong>Current Run Health:</strong> ${finalScore}%`;
    
    renderChart(firstRunScores);
});

document.getElementById("save-compare").addEventListener("click", () => {
    if (!myChart) return alert("Run a simulation first!");
    
    const label = prompt("Enter a label for this comparison (e.g., 'Scenario A'):", "Scenario A");
    if (label) {
        comparisonData = myChart.data.datasets[0].data;
        comparisonLabel = label;
        alert(`Baseline saved as "${label}". Modify traits and run again!`);
    }
});

function renderChart(newData) {
    const ctx = document.getElementById("simChart").getContext("2d");
    
    const datasets = [{
        label: 'Current Simulation',
        data: newData,
        borderColor: '#ff7f87',
        backgroundColor: 'rgba(255, 127, 135, 0.2)',
        fill: true,
        tension: 0.4
    }];

    if (comparisonData) {
        datasets.push({
            label: `Comparison: ${comparisonLabel}`,
            data: comparisonData,
            borderColor: '#5eb5f7',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4
        });
    }

    if (myChart) myChart.destroy();

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: newData.length}, (_, i) => `Month ${i + 1}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: { y: { min: 0, max: 1 } }
        }
    });
}