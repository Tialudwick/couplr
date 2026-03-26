/**
 * script.js - Neo-Natal Space Engine
 */

let myChart = null;

// --- 1. Geocoding (City Search) ---
const locSearch = document.getElementById('location-search');
const locResults = document.getElementById('location-results');

locSearch.addEventListener('input', async (e) => {
    const query = e.target.value;
    if (query.length < 3) return locResults.style.display = 'none';

    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
        const data = await res.json();
        if (data.results) {
            locResults.innerHTML = data.results.map(city => `
                <div class="location-item" onclick="setLoc('${city.name}, ${city.country}', ${city.latitude}, ${city.longitude})">
                    ${city.name}, ${city.admin1 || city.country} (${city.latitude.toFixed(2)}, ${city.longitude.toFixed(2)})
                </div>
            `).join('');
            locResults.style.display = 'block';
        }
    } catch (err) { console.error("Geocoding failed", err); }
});

function setLoc(name, lat, lon) {
    locSearch.value = name;
    document.getElementById('lat').value = lat;
    document.getElementById('lon').value = lon;
    locResults.style.display = 'none';
}

// --- 2. Accurate Sign Logic ---
const ZODIAC = {
    "Aries": "Bold trailblazer. Fire element.", "Taurus": "Steady builder. Earth element.",
    "Gemini": "Curious explorer. Air element.", "Cancer": "Nurturing protector. Water element.",
    "Leo": "Radiant leader. Fire element.", "Virgo": "Analytical healer. Earth element.",
    "Libra": "Harmonious artist. Air element.", "Scorpio": "Intense alchemist. Water element.",
    "Sagittarius": "Wild philosopher. Fire element.", "Capricorn": "Disciplined master. Earth element.",
    "Aquarius": "Visionary rebel. Air element.", "Pisces": "Dreamy mystic. Water element."
};

function getSunSign(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    const mm = date.getUTCMonth() + 1;
    const dd = date.getUTCDate();

    if ((mm == 3 && dd >= 21) || (mm == 4 && dd <= 19)) return "Aries";
    if ((mm == 4 && dd >= 20) || (mm == 5 && dd <= 20)) return "Taurus";
    if ((mm == 5 && dd >= 21) || (mm == 6 && dd <= 20)) return "Gemini";
    if ((mm == 6 && dd >= 21) || (mm == 7 && dd <= 22)) return "Cancer";
    if ((mm == 7 && dd >= 23) || (mm == 8 && dd <= 22)) return "Leo";
    if ((mm == 8 && dd >= 23) || (mm == 9 && dd <= 22)) return "Virgo";
    if ((mm == 9 && dd >= 23) || (mm == 10 && dd <= 22)) return "Libra";
    if ((mm == 10 && dd >= 23) || (mm == 11 && dd <= 21)) return "Scorpio";
    if ((mm == 11 && dd >= 22) || (mm == 12 && dd <= 21)) return "Sagittarius";
    if ((mm == 12 && dd >= 22) || (mm == 1 && dd <= 19)) return "Capricorn";
    if ((mm == 1 && dd >= 20) || (mm == 2 && dd <= 18)) return "Aquarius";
    return "Pisces";
}

// --- 3. UI and Sim ---
document.getElementById('add-agent-button').addEventListener('click', () => {
    const name = document.getElementById('agent-name').value;
    const date = document.getElementById('birth-date').value;
    const lat = document.getElementById('lat').value;

    if (!name || !date || !lat) return alert("System Error: Identify Name, Date, and Coordinates.");

    const sun = getSunSign(date);
    const ts = new Date(date).getTime();
    const sigKeys = Object.keys(ZODIAC);
    const getS = (o) => sigKeys[Math.floor(Math.abs(Math.sin(ts + o)) * 12)];

    const data = { name, sun, moon: getS(7), venus: getS(13), mars: getS(21), lat };
    
    const div = document.createElement('div');
    div.className = 'agent natal-card';
    div.dataset.chart = JSON.stringify(data);
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between">
            <h3 style="margin:0; font-family:Orbitron;">${name} // ${sun}</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background:none; color:var(--neon-pink); border:none;">[DELETE]</button>
        </div>
        <p style="font-size:0.8rem; opacity:0.7">${ZODIAC[sun]}</p>
        <div class="planet-grid">
            <div class="planet-item">🌙 MOON: ${data.moon}</div>
            <div class="planet-item">♀ VENUS: ${data.venus}</div>
            <div class="planet-item">♂ MARS: ${data.mars}</div>
            <div class="planet-item">📍 LAT: ${parseFloat(lat).toFixed(2)}</div>
        </div>
    `;
    document.getElementById('agents-container').appendChild(div);
});

document.getElementById('run-sim').addEventListener('click', () => {
    const cards = document.querySelectorAll('.natal-card');
    if (cards.length < 2) return alert("Sync Failure: Minimum 2 biological signatures required.");

    const p1 = JSON.parse(cards[0].dataset.chart);
    const p2 = JSON.parse(cards[1].dataset.chart);

    let score = 0.5;
    if (p1.sun === p2.sun) score += 0.1;
    if (p1.venus === p2.mars) score += 0.2;

    let history = [];
    for (let i = 0; i < 12; i++) {
        score += (Math.random() * 0.1) - 0.05;
        history.push(Math.max(0.1, Math.min(0.95, score)));
    }

    renderChart(history, p1.name, p2.name);
    document.getElementById('results').innerHTML = `// SYNASTRY CALCULATION COMPLETE // COMPATIBILITY INDEX: ${(score*100).toFixed(1)}%`;
});

function renderChart(data, n1, n2) {
    const ctx = document.getElementById('simChart').getContext('2d');
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["M1","M2","M3","M4","M5","M6","M7","M8","M9","M10","M11","M12"],
            datasets: [{
                label: `NEURAL SYNC: ${n1} + ${n2}`,
                data: data,
                borderColor: '#00f3ff',
                backgroundColor: 'rgba(0, 243, 255, 0.1)',
                fill: true, tension: 0.4,
                pointBackgroundColor: '#ff007a'
            }]
        },
        options: { scales: { y: { min: 0, max: 1, grid: { color: 'rgba(255,255,255,0.05)' } } } }
    });
}