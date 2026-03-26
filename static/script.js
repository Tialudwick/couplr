/**
 * script.js - Interactive Relationship Simulator with Comparison Mode
 */

let comparisonData = null; // Stores the "baseline" simulation for comparison
let myChart = null;

// --- 1. Helper: Scrape Agent Data from the DOM ---
function getTraits() {
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

// --- 2. Logic to Add a New Agent Card ---
document.getElementById("add-agent-button").addEventListener("click", () => {
    const nameInput = document.getElementById("agent-name");
    const name = nameInput.value.trim();
    
    if (!name) {
        alert("Please enter a name first.");
        return;
    }

    // Grab current values from the top form to initialize the card
    const comm = document.getElementById("agent-comm").value;
    const trust = document.getElementById("agent-trust").value;
    const patience = document.getElementById("agent-patience").value;

    const div = document.createElement("div");
    div.className = "agent";
    div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
            <h3>${name}</h3>
            <button class="remove-btn" style="background:#ddd; color:#333; padding:2px 8px; border-radius:4px;">×</button>
        </div>
        <label>Communication: <input type="number" class="comm" min="0" max="1" step="0.01" value="${comm}"></label>
        <label>Trust: <input type="number" class="trust" min="0" max="1" step="0.01" value="${trust}"></label>
        <label>Patience: <input type="number" class="patience" min="0" max="1" step="0.01" value="${patience}"></label>
    `;
    
    document.getElementById("agents-container").appendChild(div);

    // Allow user to remove the agent
    div.querySelector(".remove-btn").addEventListener("click", () => div.remove());

    // Reset top form
    nameInput.value = "";
});

// --- 3. Run Simulation Logic ---
async function runSimulation() {
    const traits = getTraits();
    if (Object.keys(traits).length < 2) {
        alert("A relationship simulation requires at least 2 agents!");
        return;
    }

    try {
        const response = await fetch("/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                traits: traits, 
                steps: 12, 
                runs: 100 
            })
        });

        const data = await response.json();
        if (data.results && data.results.length > 0) {
            displayResults(data.results);
        }
    } catch (error) {
        console.error("Simulation failed:", error);
        alert("Server error. Make sure your Flask app is running.");
    }
}

// --- 4. Display Results & Update Chart ---
function displayResults(results) {
    const firstRun = results[0]; // Visualize the first run of the Monte Carlo batch
    const scores = firstRun.map(r => r.score);
    
    // Summary Text
    const finalScore = (scores[scores.length - 1] * 100).toFixed(1);
    const eventLog = firstRun
        .map((r, i) => r.events.length > 0 ? `Month ${i+1}: ${r.events.join(", ")}` : null)
        .filter(e => e !== null);

    document.getElementById("results").innerHTML = `
        <strong>Latest Run Health:</strong> ${finalScore}%<br>
        <small>${eventLog.length > 0 ? eventLog.join(" | ") : "No major disruptions occurred."}</small>
    `;

    renderChart(scores);
}

// --- 5. Chart Rendering with Comparison Support ---
function renderChart(newData) {
    const ctx = document.getElementById("simChart").getContext("2d");
    
    const datasets = [{
        label: 'Current Setup',
        data: newData,
        borderColor: '#ff7f87',
        backgroundColor: 'rgba(255, 127, 135, 0.2)',
        fill: true,
        tension: 0.4,
        borderWidth: 3
    }];

    // If a baseline was saved, overlay it as a blue dashed line
    if (comparisonData) {
        datasets.push({
            label: 'Comparison (Saved)',
            data: comparisonData,
            borderColor: '#5eb5f7',
            backgroundColor: 'transparent',
            borderDash: [5, 5], 
            fill: false,
            tension: 0.4,
            borderWidth: 2
        });
    }

    if (myChart) myChart.destroy();
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: newData.map((_, i) => `Month ${i + 1}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            scales: {
                y: { min: 0, max: 1, title: { display: true, text: 'Relationship Health' } }
            }
        }
    });
}

// --- 6. Event Listeners ---

// Run the simulation
document.getElementById("run-sim").addEventListener("click", runSimulation);

// Save current line as a "Ghost" line to compare against future runs
document.getElementById("save-compare")?.addEventListener("click", () => {
    if (!myChart) {
        alert("Run a simulation first!");
        return;
    }
    comparisonData = myChart.data.datasets[0].data;
    alert("Baseline saved! Change your agent traits and run again to see the difference.");
});

// Load the last simulation saved on the server
document.getElementById("load-sim").addEventListener("click", async () => {
    const response = await fetch("/load");
    const data = await response.json();
    if (data.results && data.results.length > 0) {
        displayResults(data.results);
    } else {
        alert("No saved simulations found on server.");
    }
});