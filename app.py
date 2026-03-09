from flask import Flask, request, jsonify, render_template
import random, json, os

app = Flask(__name__, template_folder="templates", static_folder="static")

# ---------- Person / Agent ----------
class Person:
    def __init__(self, name, traits):
        self.name = name
        self.traits = traits
        self.emotional_state = 0.5

    def decide_action(self, score, event_effect=0):
        base = sum(self.traits.values()) / len(self.traits)
        variation = random.uniform(-0.2, 0.2)
        if score < 0.4: variation -= 0.05
        self.emotional_state = max(0, min(1, self.emotional_state + variation + event_effect))
        return base + self.emotional_state

# ---------- Relationship Simulator ----------
class Relationship:
    def __init__(self, agents, initial_score=0.5):
        self.agents = agents
        self.score = initial_score
        self.history = []

    def step(self):
        event_effect = 0
        event_log = []
        if random.random() < 0.2:
            effect = random.uniform(-0.15,0.15)
            event_effect += effect
            event_log.append(f"Life event impact: {effect:.2f}")
        change = sum(agent.decide_action(self.score, event_effect) for agent in self.agents)/len(self.agents)/10
        self.score = max(0, min(1, self.score + change))
        self.history.append({'score': self.score, 'events': event_log})

    def simulate(self, steps=12):
        for _ in range(steps):
            self.step()
        return self.history

def monte_carlo(agents, steps=12, runs=1000):
    results = []
    for _ in range(runs):
        rel = Relationship(agents)
        results.append(rel.simulate(steps))
    return results

# ---------- Storage ----------
DATA_FOLDER = "simulation_data"
os.makedirs(DATA_FOLDER, exist_ok=True)
DATA_FILE = os.path.join(DATA_FOLDER, "couplr_full.json")

def save_simulation(results):
    with open(DATA_FILE, "w") as f: json.dump(results, f, indent=2)

def load_simulation():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r") as f: return json.load(f)
    return []

# ---------- Routes ----------
@app.route("/")
def home(): return render_template("index.html", app_name="Couplr Full Interactive")

@app.route("/simulate", methods=["POST"])
def simulate():
    data = request.get_json()
    traits = data["traits"]
    steps = data.get("steps",12)
    runs = data.get("runs",1000)
    agents = [Person(name, t) for name,t in traits.items()]
    results = monte_carlo(agents, steps, runs)
    save_simulation(results)
    return jsonify({"results": results})

@app.route("/load", methods=["GET"])
def load(): return jsonify({"results": load_simulation()})

if __name__=="__main__":
    app.run(debug=True)