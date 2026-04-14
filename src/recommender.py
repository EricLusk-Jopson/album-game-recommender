#!/usr/bin/env python3

# Eulerian circuit through the complete directed graph K_N.
#
# Usage:
#   python recommender.py [options]
#
# Options:
#   --players   "Alice,Bob,Carol,Dave"   comma-separated, quoted
#   --start     "Eric L"                starting player (must be in players)
#   --date      2025-04-01              start date (YYYY-MM-DD); omit for numbered-rounds mode
#   --frequency 14                      days between turns (default: 7, only used with --date)
#
# Examples:
#   python recommender.py                                              ← numbered rounds
#   python recommender.py --date 2025-04-01                           ← dated turns, weekly
#   python recommender.py --date 2025-04-01 --frequency 14            ← dated turns, fortnightly
#   python recommender.py --start "Eric T" --date 2025-06-01 --frequency 7
#   python recommender.py --players "Alice,Bob,Carol,Dave" --start "Alice" --date 2025-01-01

import sys
import random
import argparse
from datetime import date, timedelta

# ─── Parse args ───────────────────────────────────────────────────────────────

parser = argparse.ArgumentParser(description='Eulerian circuit scheduler')
parser.add_argument('--players',   type=str, default=None,
                    help='Comma-separated player names e.g. "Alice,Bob,Carol"')
parser.add_argument('--start',     type=str, default=None,
                    help='Starting player name')
parser.add_argument('--date',      type=str, default=None,
                    help='Start date in YYYY-MM-DD format')
parser.add_argument('--frequency', type=int, default=7,
                    help='Days between turns (default: 7)')
args = parser.parse_args()

DEFAULT_PLAYERS = ['Eric L', 'Holly', 'Eric T', 'Akshay', 'Michael', 'Colm']

players      = [p.strip() for p in args.players.split(',')] if args.players else DEFAULT_PLAYERS
start_player = args.start if args.start else players[0]
frequency    = args.frequency
start_date   = date.fromisoformat(args.date) if args.date else None

if start_player not in players:
    print(f'Error: start player "{start_player}" is not in the players list.')
    print(f'Players: {", ".join(players)}')
    sys.exit(1)

if frequency < 1:
    print('Error: --frequency must be a positive integer.')
    sys.exit(1)

# ─── Eulerian circuit ─────────────────────────────────────────────────────────

N = len(players)
if N < 2:
    print('Need at least 2 players.')
    sys.exit(1)


def eulerian_circuit(start):
    adj = {p: random.sample([q for q in players if q != p], N - 1)
           for p in players}
    stack = [start]
    circuit = []
    prev = None

    while stack:
        v = stack[-1]
        if not adj[v]:
            circuit.append(stack.pop())
            prev = circuit[-2] if len(circuit) >= 2 else None
        else:
            candidates = [i for i, u in enumerate(adj[v]) if u != prev]
            i = candidates[0] if candidates else 0
            u = adj[v].pop(i)
            prev = v
            stack.append(u)

    circuit.reverse()
    return circuit


def count_aba(circuit):
    return sum(
        1 for i in range(len(circuit) - 2)
        if circuit[i] == circuit[i + 2]
    )


MAX_ATTEMPTS = 500
best, best_aba = None, float('inf')

for _ in range(MAX_ATTEMPTS):
    circuit = eulerian_circuit(start_player)
    if len(circuit) != N * (N - 1) + 1:
        continue
    aba = count_aba(circuit)
    if aba < best_aba:
        best_aba, best = aba, circuit
    if aba == 0:
        break

if best is None:
    print('No circuit found.')
    sys.exit(1)

# ─── Print ────────────────────────────────────────────────────────────────────

print(f'\nEulerian circuit — {N} players, {N * (N-1)} turns')
print(f'Starting player: {start_player}')
if start_date:
    freq_label = f'every {frequency} day{"" if frequency == 1 else "s"}'
    print(f'Start date:      {start_date.strftime("%a, %d %b %Y")}')
    print(f'Frequency:       {freq_label}')
print()

pad = max(len(p) for p in players)

for i in range(len(best) - 1):
    aba    = '  ⚠ ABA' if i + 2 < len(best) and best[i] == best[i + 2] else ''
    frm    = best[i].ljust(pad)
    to     = best[i + 1].ljust(pad)
    dt_str = f'  {(start_date + timedelta(days=i * frequency)).strftime("%a, %d %b %Y")}' if start_date else ''
    print(f'  Turn {i+1:02d}:{dt_str}  {frm} -> {to}{aba}')

print(f'\n  Returns to: {best[-1]}')
print(f'  ABA violations: {best_aba}')

# ─── Coverage matrix ──────────────────────────────────────────────────────────

mat = {a: {b: 0 for b in players} for a in players}
for i in range(len(best) - 1):
    mat[best[i]][best[i + 1]] = i + 1

cp = pad + 2
print('\nCoverage matrix (turn# when row->col occurs):\n')
print(' ' * (cp + 2) + ''.join(p.ljust(cp) for p in players))
for a in players:
    row = ''.join('-'.ljust(cp) if a == b else str(mat[a][b]).ljust(cp) for b in players)
    print(f'{a.ljust(cp)}[ {row}]')

all_covered = all(mat[a][b] > 0 for a in players for b in players if a != b)
print(f'\n{"✓" if all_covered else "✗"} All {N * (N-1)} pairs covered')
print(f'{"✓" if best_aba == 0 else "✗"} ABA violations: {best_aba}\n')