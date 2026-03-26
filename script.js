/**
 * script.js - Full Multi-Agent Natal & Synastry Engine
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

    return {
        placements: planets.map(p => {
            const totalDeg = getPos(p.speed);
            const signIndex = Math.floor(totalDeg / 30);
            return { 
                name: p.name, 
                symbol: p.symbol, 
                sign: SIGNS[signIndex], 
                element: ELEMENTS[SIGNS[signIndex]], 
                deg: totalDeg % 360, // Exact degree for aspects
                meaning: p.meaning 
            };
        }),
        rising: SIGNS[Math.floor(ascDeg / 30)],
        houses: HOUSE_THEMES.map((theme, i) => ({
            num: i + 1,
            theme: theme,
            sign: SIGNS[(Math.floor(ascDeg / 30) + i) % 12]
        }))
    };
}

// --- 2. UI: Adding Agent Cards ---
document.getElementById("add-agent-button").addEventListener("click", () => {
    const nameInput = document.getElementById("agent-name");
    const dateInput = document.getElementById("birth-date");
    const timeInput = document.getElementById("birth-time");
    const offset = document.getElementById("gmt-offset").value;

    if (!nameInput.value || !dateInput.value || !timeInput.value) {
        return alert("Please fill out all birth details!");
    }

    const chart = generateNatalData(dateInput.value, timeInput.value, offset);
    
    const div = document.createElement("div");
    div.className = "agent natal-card";
    // Store the raw data in the element so we can grab it for simulation
    div.dataset.chart = JSON.stringify(chart);
    div.dataset.name = nameInput.value;

    div.innerHTML = `
        <div class="card-header">
            <h3>${nameInput.value}</h3>
            <button class="remove-btn" style="background:#ff7f87; color:white; border-radius:50%; width:25px; height:25px; border:none; cursor:pointer;">×</button>
        </div>
        <div class="big-three">Rising: ${chart.rising}</div>
        <div class="planet-grid">
            ${chart.placements.map(p => `
                <div class="planet-item">
                    ${p.symbol} <strong>${p.name}:</strong> ${p.sign}
                </div>
            `).join('')}
        </div>
        <details>
            <summary>Life Areas (Houses)</summary>
            <div style="font-size:0.8rem; padding:10px;">
                ${chart.houses.map(h => `<p>H${h.num} ${h.theme}: <b>${h.sign}</b></p>`).join('')}
            </div>
        </details>
    `;

    document.getElementById("agents-container").appendChild(div);
    
    // Wire up the remove button
    div.querySelector(".remove-btn").addEventListener("click", () => div.remove());

    // Clear inputs for the next person
    nameInput.value = "";
});

// --- 3. Synastry Logic: Calculating Aspects & Comparison ---
document.getElementById("run-sim").addEventListener("click", () => {
    const cards = document.querySelectorAll(".natal-card");
    if (cards.length < 2) return alert("You need at least two people to compare charts!");

    const p1 = JSON.parse(cards[0].dataset.chart);
    const p2 = JSON.parse(cards[1].dataset.chart);
    const n1 = cards[0].dataset.name;
    const n2 = cards[1].dataset.name;

    let baseCompatibility = 0.5;
    let aspectsFound = [];

    // Compare each planet of Person 1 to each planet of Person 2
    p1.placements.forEach(plan1 => {
        p2.placements.forEach(plan2 => {
            const diff = Math.abs(plan1.deg - plan2.deg);
            const aspect = getAspect(diff);
            if (aspect) {
                aspectsFound.push(`${plan1.name} ${aspect.type} ${plan2.name}`);
                baseCompatibility += aspect.value;
            }
        });
    });

    // Generate 12-month trajectory
    let currentScore = Math.max(0.1, Math.min(0.95, baseCompatibility));
    let history = [];
    for (let i = 0; i < 12; i++) {
        currentScore += (Math.random() * 0.08) - 0.04; // Gentle monthly flux
        history.push(currentScore);
    }

    renderSimChart(history, n1, n2);
    
    document.getElementById("results").innerHTML = `
        <h3>Synastry: ${n1} & ${n2}</h3>
        <p><b>Key Interactions:</b> ${aspectsFound.slice(0, 5).join(", ") || "No major aspects found."}</p>
        <p><b>Final Compatibility Score:</b> ${(currentScore * 100).toFixed(1)}%</p>
    `;
});

function getAspect(diff) {
    // Standard Orbs (approx 5 degrees)
    if (diff < 5 || diff > 355) return { type: "Conjunction", value: 0.15 };
    if (Math.abs(diff - 120) < 5 || Math.abs(diff - 240) < 5) return { type: "Trine", value: 0.1 };
    if (Math.abs(diff - 90) < 5 || Math.abs(diff - 270) < 5) return { type: "Square", value: -0.1 };
    if (Math.abs(diff - 180) < 5) return { type: "Opposition", value: -0.05 };
    if (Math.abs(diff - 60) < 5 || Math.abs(diff - 300) < 5) return { type: "Sextile", value: 0.05 };
    return null;
}

function renderSimChart(data, n1, n2) {
    const ctx = document.getElementById("simChart").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: `Connection: ${n1} + ${n2}`,
                data: data,
                borderColor: '#ff7f87',
                backgroundColor: 'rgba(255, 127, 135, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { scales: { y: { min: 0, max: 1 } } }
    });
}