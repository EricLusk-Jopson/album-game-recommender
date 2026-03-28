# Eulerian Recommendation Scheduler

Generates a scheduled order of handoffs for a the album game, or any round-based recommendation game where every participant recommends to, and receives from, every other participant exactly once.

## How it works

Each participant is a node in a complete directed graph (K_N). Every directed edge A → B represents a handoff from A to B. The scripts find an **Eulerian circuit** through this graph: a single continuous path that traverses all N(N−1) edges exactly once and returns to the starting node.

This means:

- Over the course of a round, every participant hands off to every other participant exactly once
- Every participant receives from every other participant exactly once
- Each turn follows directly from the previous — wherever the last handoff ended, the next one begins from there
- No immediate back-and-forth: A → B will never be immediately followed by B → A

For 6 participants this produces 30 turns. With the default frequency of 7 days, a full round takes just under 7 months.

## Repo structure

```
.
├── README.md
└── src/
    ├── eulerian.js
    └── eulerian.py
```

## Requirements

**Node.js version:**

- Node.js 14 or higher (no dependencies, no `npm install` needed)

**Python version:**

- Python 3.7 or higher (standard library only, no `pip install` needed)

## Usage

Both scripts accept the same four optional flags.

| Flag          | Description                                                    | Default                                        |
| ------------- | -------------------------------------------------------------- | ---------------------------------------------- |
| `--players`   | Comma-separated list of participant names, quoted              | `Eric L, Holly, Eric T, Akshay, Micheal, Colm` |
| `--start`     | Name of the starting participant (must be in the players list) | First player in the list                       |
| `--date`      | Start date in `YYYY-MM-DD` format                              | No dates printed                               |
| `--frequency` | Days between turns                                             | `7`                                            |

### Node.js

```bash
# Run with defaults
node src/eulerian.js

# With a start date
node src/eulerian.js --date 2025-04-01

# Fortnightly cadence
node src/eulerian.js --date 2025-04-01 --frequency 14

# With a custom starting player
node src/eulerian.js --start "Eric T" --date 2025-04-01 --frequency 7

# With a fully custom group
node src/eulerian.js --players "Alice,Bob,Carol,Dave" --start "Alice" --date 2025-01-01
```

### Python

```bash
# Run with defaults
python src/eulerian.py

# With a start date
python src/eulerian.py --date 2025-04-01

# Fortnightly cadence
python src/eulerian.py --date 2025-04-01 --frequency 14

# With a custom starting player
python src/eulerian.py --start "Eric T" --date 2025-04-01 --frequency 7

# With a fully custom group
python src/eulerian.py --players "Alice,Bob,Carol,Dave" --start "Alice" --date 2025-01-01
```

## Example output

```
Eulerian circuit — 6 players, 30 turns
Starting player: Eric L
Start date:      Tue, 01 Apr 2025
Frequency:       every 7 days

  Turn 01:  Tue, 01 Apr 2025  Eric L   -> Holly
  Turn 02:  Tue, 08 Apr 2025  Holly    -> Akshay
  Turn 03:  Tue, 15 Apr 2025  Akshay   -> Eric T
  Turn 04:  Tue, 22 Apr 2025  Eric T   -> Colm
  ...
  Turn 30:  Tue, 28 Oct 2025  Micheal  -> Eric L

  Returns to: Eric L
  ABA violations: 0

Coverage matrix (turn# when row->col occurs):

              Eric L  Holly   Eric T  Akshay  Micheal  Colm
Eric L      [  -       1       8      15      22       27  ]
Holly       [  6       -       2       9      16       23  ]
...

✓ All 30 directed pairs covered
✓ ABA violations: 0
```

## Notes

- The circuit is randomised on each run. the schedule will differ every time, though it always satisfies the coverage and ABA constraints
- The algorithm makes up to 500 attempts to find a circuit with zero ABA violations; this succeeds reliably for groups up to at least 10 participants
- If `--date` is omitted, turns are printed without dates
- Turn dates are zero-indexed from the start date: turn 1 falls on the start date, turn 2 one frequency-interval later, and so on
