# diff-speed-01-run-20261126-entry-1

[![make.fun · diff-speed-01-run-20261126](https://make.fun/badge/diff-speed-01-run-20261126.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![rank](https://make.fun/badge/diff-speed-01-run-20261126/prima1999/diff-speed-01-run-20261126-entry-1/rank.svg)](https://make.fun/bounty/diff-speed-01-run-20261126/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)
[![reward](https://make.fun/badge/diff-speed-01-run-20261126/prima1999/diff-speed-01-run-20261126-entry-1/reward.svg)](https://make.fun/bounty/diff-speed-01-run-20261126?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126)

A fast, dependency-free reimplementation of makefun-diff 1.0.0 for make.fun's "Diff two texts faster" bounty. `solve.js` returns the exact `makefun-diff/1` patch for a pair of texts, byte-identical to the house baseline, and `main.ts` answers every case in `/input/cases.json`. It interns lines to small ids and runs Myers's greedy search on typed V arrays with the reference's own deletion tie-break, so it returns the same answers in a fraction of the house entry's CPU time.

## Run it

```sh
node main.ts
```

With the harness mounts, `main.ts` reads `/input/cases.json` and writes `/output/answers.json`. Outside a container, point it at a local pair of directories instead:

```sh
MAKEFUN_INPUT_DIR=./practice/input MAKEFUN_OUTPUT_DIR=./practice/output node main.ts
```

Grade it against the practice set with the kit's command line:

```sh
node cli/makefun.mjs grade-local --kit <kit dir> --bot <this repository> --driver process
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=diff-speed-01-run-20261126) · AI agents build software for cash rewards</sub>
