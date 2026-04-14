#!/usr/bin/env node

// Eulerian circuit through the complete directed graph K_N.
//
// Usage:
//   node recommender.js [options]
//
// Options:
//   --players   "Alice,Bob,Carol,Dave"   comma-separated, quoted
//   --start     "Eric L"                starting player (must be in players)
//   --date      2025-04-01              start date (YYYY-MM-DD); omit for numbered-rounds mode
//   --frequency 14                      days between turns (default: 7, only used with --date)
//
// Examples:
//   node recommender.js                                              ← numbered rounds
//   node recommender.js --date 2025-04-01                           ← dated turns, weekly
//   node recommender.js --date 2025-04-01 --frequency 14            ← dated turns, fortnightly
//   node recommender.js --start "Eric T" --date 2025-06-01 --frequency 7
//   node recommender.js --players "Alice,Bob,Carol,Dave" --start "Alice" --date 2025-01-01

// ─── Parse args ───────────────────────────────────────────────────────────────

function getArg(flag) {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : null;
}

const DEFAULT_PLAYERS = [
  "Eric L",
  "Holly",
  "Eric T",
  "Akshay",
  "Micheal",
  "Colm",
];

const players = getArg("--players")
  ? getArg("--players")
      .split(",")
      .map((p) => p.trim())
  : DEFAULT_PLAYERS;

const startPlayer = getArg("--start") ?? players[0];
const dateArg = getArg("--date") ?? null;
const frequency = parseInt(getArg("--frequency") ?? "7", 10);

if (!players.includes(startPlayer)) {
  console.error(
    `Error: start player "${startPlayer}" is not in the players list.`,
  );
  console.error(`Players: ${players.join(", ")}`);
  process.exit(1);
}

if (isNaN(frequency) || frequency < 1) {
  console.error("Error: --frequency must be a positive integer.");
  process.exit(1);
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function formatDate(date) {
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const startDate = dateArg ? parseDate(dateArg) : null;

// ─── Eulerian circuit ─────────────────────────────────────────────────────────

const N = players.length;
if (N < 2) {
  console.error("Need at least 2 players.");
  process.exit(1);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function eulerianCircuit(start) {
  const adj = {};
  for (const p of players) adj[p] = shuffle(players.filter((q) => q !== p));

  const stack = [start];
  const circuit = [];
  let prev = null;

  while (stack.length > 0) {
    const v = stack[stack.length - 1];
    if (adj[v].length === 0) {
      circuit.push(stack.pop());
      prev = circuit.length >= 2 ? circuit[circuit.length - 2] : null;
    } else {
      let i = prev !== null ? adj[v].findIndex((u) => u !== prev) : 0;
      if (i === -1) i = 0;
      const u = adj[v].splice(i, 1)[0];
      prev = v;
      stack.push(u);
    }
  }

  circuit.reverse();
  return circuit;
}

function countABA(circuit) {
  let n = 0;
  for (let i = 0; i < circuit.length - 2; i++)
    if (circuit[i] === circuit[i + 2]) n++;
  return n;
}

const MAX_ATTEMPTS = 500;
let best = null,
  bestABA = Infinity;

for (let i = 0; i < MAX_ATTEMPTS; i++) {
  const circuit = eulerianCircuit(startPlayer);
  if (circuit.length !== N * (N - 1) + 1) continue;
  const aba = countABA(circuit);
  if (aba < bestABA) {
    bestABA = aba;
    best = circuit;
  }
  if (aba === 0) break;
}

if (!best) {
  console.error("No circuit found.");
  process.exit(1);
}

// ─── Print ────────────────────────────────────────────────────────────────────

console.log(`\nEulerian circuit — ${N} players, ${N * (N - 1)} turns`);
console.log(`Starting player: ${startPlayer}`);
if (startDate) {
  console.log(`Start date:      ${formatDate(startDate)}`);
  console.log(`Frequency:       every ${frequency} day${frequency === 1 ? "" : "s"}`);
}
console.log();

const pad = Math.max(...players.map((p) => p.length));

for (let i = 0; i < best.length - 1; i++) {
  const aba = best[i] === best[i + 2] ? "  ⚠ ABA" : "";
  const from = best[i].padEnd(pad);
  const to = best[i + 1].padEnd(pad);
  const date = startDate
    ? `  ${formatDate(addDays(startDate, i * frequency))}`
    : "";
  console.log(
    `  Turn ${String(i + 1).padStart(2, "0")}:${date}  ${from} -> ${to}${aba}`,
  );
}

console.log(`\n  Returns to: ${best[best.length - 1]}`);
console.log(`  ABA violations: ${bestABA}`);

// ─── Coverage matrix ──────────────────────────────────────────────────────────

const mat = {};
for (const a of players) {
  mat[a] = {};
  for (const b of players) mat[a][b] = 0;
}
for (let i = 0; i < best.length - 1; i++) mat[best[i]][best[i + 1]] = i + 1;

const cp = pad + 2;
console.log("\nCoverage matrix (turn# when row->col occurs):\n");
console.log(" ".repeat(cp + 2) + players.map((p) => p.padEnd(cp)).join(""));
for (const a of players) {
  const row = players.map((b) =>
    a === b ? "-".padEnd(cp) : String(mat[a][b]).padEnd(cp),
  );
  console.log(`${a.padEnd(cp)}[ ${row.join("")}]`);
}

const allCovered = players.every((a) =>
  players.every((b) => a === b || mat[a][b] > 0),
);
console.log(`\n${allCovered ? "✓" : "✗"} All ${N * (N - 1)} pairs covered`);
console.log(`${bestABA === 0 ? "✓" : "✗"} ABA violations: ${bestABA}\n`);
