# 🕳🥊 hypercache 🧼

## Warning
Do not use, this is yet to be recreated from a centeralized version.

## TODO
- This is sudo code so, upload the current version
- rebuild the GUB bug reverser and reporter

## Explanation
**A large object state machine with a cached ram protection layer that locks/replicates a tinybee's paused state. Errors only hit the replicated cache layer and are recorded as bug reports. (WIP)**

- single deligated writer (awarded by role change)
- bugs are pre-tested during multi value lock(s) on the large object and saved as bug detailed reports (where,what,when,who,why)
- if readable from a corestore then it becomes a db

Do not use for production yet. This will become fuller as time goes on ...
