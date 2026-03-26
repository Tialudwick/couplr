/**
 * script.js - Advanced Natal & Synastry Logic
 */

let myChart = null;
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const ELEMENTS = {
    Aries: "Fire", Leo: "Fire", Sagittarius: "Fire",
    Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
    Gemini: "Air", Libra: "Air", Aquarius: "Air",
    Cancer: "Water", Scorpio: "Water", Pisces: "Water"
};
const HOUSE_THEMES = [
    "Self & Identity", "Value & Money", "Communication", "Home & Roots",
    "Romance & Play", "Health & Duty", "Partnership", "Shadow & Shared Assets",
    "Expansion & Travel", "Career & Public", "Community", "The Unconscious"
];

// --- 1. The Calculation Engine ---
function generateNatalData(date, time, offset) {
    const birth = new Date(`${date}T${time}`);
    const ts = birth.getTime() / 1000;
    
    // Deterministic math based on birth timestamp
    const getPos = (speed) => (Math.abs(Math.sin(ts * speed)) * 360);
    
    const planets = [
        { name: "Sun", symbol: "☀️", speed: 0.0000001, meaning: "Core Identity" },
        { name: "Moon", symbol: "🌙", speed: 0.000013, meaning: "Emotional Instinct" },
        { name: "Mercury", symbol: "☿", speed: 0.0000004, meaning: "Communication" },
        { name: "Venus", symbol: "♀", speed: 0.00000016, meaning: "Love & Values" },
        { name: "Mars", symbol: "♂", speed: 0.00000008, meaning: "Drive & Passion" },
        { name: "Jupiter", symbol: "♃", speed: 0.00000001, meaning: "Luck & Growth" },
        { name: "Saturn", symbol: "♄", speed: 0.000000005, meaning: "Discipline" }
    ];

    const ascDeg = (getPos(0.0001) + (parseFloat(offset) * 15)) % 360;

    const chart = {
        placements: planets.map(p => {
            const deg = getPos(p.speed);
            const sign = SIGNS[Math.floor(deg / 30)];
            return { ...p, sign, element: ELEMENTS[sign] };
        }),
        rising: SIGNS[Math.floor(ascDeg / 30)],
        houses: HOUSE_THEMES.map((theme, i) => ({
            num: i + 1,
            theme: theme,
            sign: SIGNS[(Math.floor(ascDeg / 30) + i) % 12]
        }))
    };
    return chart;
}

// --- 2. UI Rendering ---
document.getElementById("add-agent-button").addEventListener("click", () => {
    const name = document.getElementById("agent-name").value;
    const date = document.getElementById("birth-date").value;
    const time = document.getElementById("birth-time").value;
    const offset = document.getElementById("gmt-offset").value;

    if (!name || !date || !time) return alert("Please fill out birth details.");

    const chart = generateNatalData(date, time, offset);
    
    const div = document.createElement("div");
    div.className = "agent natal-card";
    div.dataset.chart = JSON.stringify(chart);
    div.dataset.name = name;

    div.innerHTML = `
        <div class="card-header">
            <h3>${name}</h3>
            <button onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="big-three">
            <span><strong>Rising:</strong> ${chart.rising}</span>
        </div>
        <div class="planet-grid">
            ${chart.placements.map(p => `
                <div class="planet-item" title="${p.meaning}">
                    ${p.symbol} <strong>${p.name}:</strong> ${p.sign} (${p.element})
                </div>
            `).join('')}
        </div>
        <details>
            <summary>View 12 Houses (Life Areas)</summary>
            <div class="house-list">
                ${chart.houses.map(h => `<p>H${h.num} <em>${h.theme}:</em> <strong>${h.sign}</strong></p>`).join('')}
            </div>
        </details>
    `;
    document.getElementById("agents-container").appendChild(div);
    document.getElementById("agent-name").value = "";
});

// --- 3. Synastry Sim ---
document.getElementById("run-sim").addEventListener("click", () => {
    const cards = document.querySelectorAll(".natal-card");
    if (cards.length < 2) return alert("Add at least 2 people to compare.");

    const p1 = JSON.parse(cards[0].dataset.chart);
    const p2 = JSON.parse(cards[1].dataset.chart);
    
    // Score based on Moon (Emotion) and Venus (Love) Elements
    let score = 0.5;
    const moonMatch = p1.placements[1].element === p2.placements[1].element;
    const venusMatch = p1.placements[3].element === p2.placements[3].element;

    if (moonMatch) score += 0.2;
    if (venusMatch) score += 0.2;

    let history = [];
    for (let i = 0; i < 12; i++) {
        score += (Math.random() * 0.1) - 0.05;
        score = Math.max(0.1, Math.min(0.95, score));
        history.push(score);
    }

    renderSimChart(history, cards[0].dataset.name, cards[1].dataset.name);
    
    document.getElementById("results").innerHTML = `
        <h3>Synastry Report</h3>
        <p>${moonMatch ? "✅ Emotional Harmony (Moon Match)" : "⚠️ Emotional Adjustment Needed"}</p>
        <p>${venusMatch ? "✅ Shared Values (Venus Match)" : "⚠️ Different Love Styles"}</p>
        <p><strong>Predicted 12-Month Connection Health: ${(score * 100).toFixed(1)}%</strong></p>
    `;
});

function renderSimChart(data, n1, n2) {
    const ctx = document.getElementById("simChart").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"],
            datasets: [{
                label: `${n1} + ${n2} Compatibility`,
                data: data,
                borderColor: '#ff7f87',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(255,127,135,0.1)'
            }]
        },
        options: { scales: { y: { min: 0, max: 1 } } }
    });
}

document.getElementById("clear-all").addEventListener("click", () => {
    document.getElementById("agents-container").innerHTML = "";
    if (myChart) myChart.destroy();
    document.getElementById("results").innerHTML = "";
});