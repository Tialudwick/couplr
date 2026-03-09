function getTraits() {
    const traits = {};
    document.querySelectorAll("#agents-container .agent").forEach(div=>{
        const name = div.querySelector("h3").innerText;
        traits[name]={communication:parseFloat(div.querySelector(".comm").value),
                       trust:parseFloat(div.querySelector(".trust").value),
                       patience:parseFloat(div.querySelector(".patience").value)};
    });
    return traits;
}

document.getElementById("add-agent-button").addEventListener("click", ()=>{
    const name=document.getElementById("agent-name").value.trim();
    if(!name) return alert("Enter a name");
    const comm=parseFloat(document.getElementById("agent-comm").value);
    const trust=parseFloat(document.getElementById("agent-trust").value);
    const patience=parseFloat(document.getElementById("agent-patience").value);

    const div=document.createElement("div");
    div.className="agent";
    div.innerHTML=`<h3>${name}</h3>
        <label>Communication: <input type="number" class="comm" min="0" max="1" step="0.01" value="${comm}"></label>
        <label>Trust: <input type="number" class="trust" min="0" max="1" step="0.01" value="${trust}"></label>
        <label>Patience: <input type="number" class="patience" min="0" max="1" step="0.01" value="${patience}"></label>`;
    document.getElementById("agents-container").appendChild(div);

    document.getElementById("agent-name").value="";
    document.getElementById("agent-comm").value=0.5;
    document.getElementById("agent-trust").value=0.5;
    document.getElementById("agent-patience").value=0.5;
});

async function runSimulation(){
    const traits=getTraits();
    const response=await fetch("/simulate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({traits,steps:12,runs:1000})});
    const data=await response.json();
    displayResults(data.results);
}

async function loadSimulation(){
    const response=await fetch("/load");
    const data=await response.json();
    if(data.results.length>0) displayResults(data.results);
    else document.getElementById("results").innerText="No saved simulations found.";
}

function displayResults(results){
    const firstRun=results[0].map(r=>r.score.toFixed(2));
    const eventsLog=results[0].map(r=>r.events.join(", ") || "No events");
    document.getElementById("results").innerText=`First run scores:\n${firstRun}\n\nEvents:\n${eventsLog.join("\n")}`;
    const ctx=document.getElementById("simChart").getContext("2d");
    if(window.simChart) window.simChart.destroy();
    window.simChart=new Chart(ctx,{type:'line',data:{labels:firstRun.map((_,i)=>`Step ${i+1}`),datasets:[{label:'Relationship Score',data:firstRun,borderColor:'#ff7f87',backgroundColor:'rgba(255,127,135,0.2)',fill:true,tension:0.3}]},options:{scales:{y:{min:0,max:1}}}});
}

document.getElementById("run-sim").addEventListener("click", runSimulation);
document.getElementById("load-sim").addEventListener("click", loadSimulation);