/**
 * script.js - Full Astrology Engine with Sign Descriptions
 */

let myChart = null;

// --- 1. The Astrology Database ---
const ZODIAC_DATA = {
    "Aries": { element: "Fire", traits: "Bold, energetic, trailblazing, and direct.", planet: "Mars" },
    "Taurus": { element: "Earth", traits: "Steady, loyal, sensual, and practical.", planet: "Venus" },
    "Gemini": { element: "Air", traits: "Curious, versatile, expressive, and social.", planet: "Mercury" },
    "Cancer": { element: "Water", traits: "Intuitive, nurturing, protective, and sentimental.", planet: "Moon" },
    "Leo": { element: "Fire", traits: "Radiant, confident, creative, and theatrical.", planet: "Sun" },
    "Virgo": { element: "Earth", traits: "Analytical, helpful, modest, and orderly.", planet: "Mercury" },
    "Libra": { element: "Air", traits: "Diplomatic, artistic, social, and fair-minded.", planet: "Venus" },
    "Scorpio": { element: "Water", traits: "Intense, passionate, private, and transformative.", planet: "Pluto" },
    "Sagittarius": { element: "Fire", traits: "Optimistic, adventurous, philosophical, and honest.", planet: "Jupiter" },
    "Capricorn": { element: "Earth", traits: "Ambitious, disciplined, patient, and grounded.", planet: "Saturn" },
    "Aquarius": { element: "Air", traits: "Innovative, independent, humanitarian, and unique.", planet: "Uranus" },
    "Pisces": { element: "Water", traits: "Dreamy, compassionate, artistic, and psychic.", planet: "Neptune" }
};

// --- 2. Accurate Sun Sign Calculation ---
function getSunSign(date) {
    const month = date.getUTCMonth() + 1; 
    const day = date.getUTCDate();

    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini";
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra";
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio";
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return "Sagittarius";
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return "Capricorn";
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius";
    return "Pisces";
}

// --- 3. The Natal Map Generator ---
function generateNatalData(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const birthDate = new Date(Date.UTC(year, month - 1, day));
    const sunSign = getSunSign(birthDate);
    const ts = birthDate.getTime();
    
    const SIGNS = Object.keys(ZODIAC_DATA);
    const getSign = (offset) => SIGNS[Math.floor(Math.abs(Math.sin(ts + offset)) * 12)];

    return {
        sun: sunSign,
        moon: getSign(500),
        rising: getSign(1000),
        venus: getSign(1500),
        mars: getSign(2000)
    };
}

// --- 4. UI Rendering ---
document.getElementById("add-agent-button").addEventListener("click", () => {
    const name = document.getElementById("agent-name").value;
    const date = document.getElementById("birth-date").value;

    if (!name || !date) return alert("Please enter name and date!");

    const data = generateNatalData(date);
    const sunInfo = ZODIAC_DATA[data.sun];
    
    const div = document.createElement("div");
    div.className = "agent natal-card";
    div.dataset.chart = JSON.stringify(data);
    div.dataset.name = name;

    div.innerHTML = `
        <div class="card-header">
            <h3>${name} (${data.sun})</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="border:none; background:none; cursor:pointer;">✕</button>
        </div>
        <div class="element-tag">${sunInfo.element} Element</div>
        <p style="font-size: 0.9rem; font-style: italic; margin-bottom: 15px;">"${sunInfo.traits}"</p>
        
        <div class="planet-grid">
            <div class="planet-item">🌙 <strong>Moon:</strong> ${data.moon}</div>
            <div class="planet-item">⬆️ <strong>Rising:</strong> ${data.rising}</div>
            <div class="planet-item">♀ <strong>Venus:</strong> ${data.venus}</div>
            <div class="planet-item">♂ <strong>Mars:</strong> ${data.mars}</div>
        </div>
    `;
    document.getElementById("agents-container").appendChild(div);
    document.getElementById("agent-name").value = "";
});

// --- 5. Synastry Sim ---
document.getElementById("run-sim").addEventListener("click", () => {
    const cards = document.querySelectorAll(".natal-card");
    if (cards.length < 2) return alert("Add two people to compare!");

    const p1 = JSON.parse(cards[0].dataset.chart);
    const p2 = JSON.parse(cards[1].dataset.chart);

    let score = 0.5;
    // Simple logic: Element matches boost the score
    if (ZODIAC_DATA[p1.sun].element === ZODIAC_DATA[p2.sun].element) score += 0.15;
    if (p1.venus === p2.mars || p2.venus === p1.mars) score += 0.2;

    let history = [];
    for (let i = 0; i < 12; i++) {
        score += (Math.random() * 0.08) - 0.04;
        history.push(score);
    }

    renderChart(history, cards[0].dataset.name, cards[1].dataset.name);
});

function renderChart(data, n1, n2) {
    const ctx = document.getElementById("simChart").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: `${n1} & ${n2} Compatibility`,
                data: data,
                borderColor: '#00f3ff', // Neon Cyan
                backgroundColor: 'rgba(0, 243, 255, 0.1)', // Subtle Glow
                pointBackgroundColor: '#ff007a', // Neon Pink points
                fill: true,
                tension: 0.4
            }]
        },
        options: { scales: { y: { min: 0, max: 1 } } }
    });
}