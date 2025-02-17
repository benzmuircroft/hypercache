# 🕳🥊 hypercache 🧼

## Explanation
**A large object state machine with a cached ram protection layer that locks/replicates a tinybee's paused state. Errors only hit the replicated cache layer and are recorded as bug reports; so it always stays clean. (WIP)**

- Single deligated writer (awarded by role change)
- Bugs are pre-tested during multi value lock(s) on the large object and saved as detailed bug reports (where,what,when,who,why)
- If readable from a corestore then it can merge visually with other parallel-formatted hypercache's and users will see it as a db

## 🚧 Warning
Do not use, this is yet to be recreated from a centeralized version.

## TODO
- This is sudo code so, upload the current version
- rebuild the GUB bug reverser and reporter
