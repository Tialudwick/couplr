/**
 * script.js - Astrology + Relationship Simulator
 */

let myChart = null;
const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

// --- 1. Astrology Math: Calculate Sun Sign ---
function getSunSign(date) {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return { sign: "Aries", element: "Fire", weight: 0.8 };
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return { sign: "Taurus", element: "Earth", weight: 0.6 };
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return { sign: "Gemini", element: "Air", weight: 0.7 };
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return { sign: "Cancer", element: "Water", weight: 0.5 };
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return { sign: "Leo", element: "Fire", weight: 0.9 };
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return { sign: "Virgo", element: "Earth", weight: 0.5 };
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return { sign: "Libra", element: "Air", weight: 0.7 };
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return { sign: "Scorpio", element: "Water", weight: 0.8 };
    if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) return { sign: "Sagittarius", element: "Fire", weight: 0.8 };
    if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) return { sign: "Capricorn", element: "Earth", weight: 0.6 };
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return { sign: "Aquarius", element: "Air", weight: 0.7 };
    return { sign: "Pisces", element: "Water", weight: 0.4 };
}

// --- 2. Relationship Simulation Logic ---
class AstroPerson {
    constructor(name, birthDate) {
        this.name = name;
        this.astro = getSunSign(new Date(birthDate));
        this.emotional_state = 0.5;
    }

    decideAction(compatibility) {
        // Base behavior influenced by Zodiac "weight" (fire=high energy, water=emotional)
        const variation = (Math.random() * 0.4) - 0.2;
        this.emotional_state = Math.max(0, Math.min(1, this.emotional_state + variation + (compatibility / 10)));
        return (this.astro.weight + this.emotional_state) / 2;
    }
}

// --- 3. UI Interactions ---
document.getElementById("add-agent-button").addEventListener("click", () => {
    const name = document.getElementById("agent-name").value;
    const date = document.getElementById("birth-date").value;
    if (!name || !date) return alert("Enter Name and Birth Date");

    const astro = getSunSign(new Date(date));
    const div = document.createElement("div");
    div.className = "agent";
    div.dataset.date = date; // Store for later
    div.innerHTML = `
        <h3>${name}</h3>
        <p><strong>Sign:</strong> ${astro.sign} (${astro.element})</p>
        <button onclick="this.parentElement.remove()" style="padding:2px 5px; background:#ccc;">Remove</button>
    `;
    document.getElementById("agents-container").appendChild(div);
});

document.getElementById("run-sim").addEventListener("click", () => {
    const agents = [];
    document.querySelectorAll(".agent").forEach(el => {
        agents.push(new AstroPerson(el.querySelector("h3").innerText, el.dataset.date));
    });

    if (agents.length < 2) return alert("Add 2 people for a relationship comparison!");

    // Compatibility Math (Based on Elements)
    let compatibility = 0;
    const e1 = agents[0].astro.element;
    const e2 = agents[1].astro.element;

    if (e1 === e2) compatibility = 0.2; // Same element = Good
    else if ((e1 === "Fire" && e2 === "Air") || (e1 === "Earth" && e2 === "Water")) compatibility = 0.15; // Complementary
    else compatibility = -0.1; // Challenging

    // Run 12-Month Sim
    let score = 0.5;
    let scores = [];
    for (let i = 0; i < 12; i++) {
        let avgAction = agents.reduce((sum, a) => sum + a.decideAction(compatibility), 0) / agents.length;
        score = Math.max(0, Math.min(1, score + (avgAction - 0.45))); 
        scores.push(score);
    }

    updateUI(agents, compatibility, scores);
});

function updateUI(agents, compatibility, scores) {
    const finalHealth = (scores[scores.length - 1] * 100).toFixed(1);
    document.getElementById("results").innerHTML = `
        <strong>Synastry Report:</strong> ${agents[0].name} & ${agents[1].name}<br>
        <strong>Element Match:</strong> ${compatibility > 0 ? "Harmonious" : "Challenging"}<br>
        <strong>12-Month Projected Health:</strong> ${finalHealth}%
    `;

    const ctx = document.getElementById("simChart").getContext("2d");
    if (myChart) myChart.destroy();
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            datasets: [{
                label: 'Relationship Trajectory',
                data: scores,
                borderColor: '#ff7f87',
                backgroundColor: 'rgba(255,127,135,0.2)',
                fill: true
            }]
        },
        options: { scales: { y: { min: 0, max: 1 } } }
    });
}