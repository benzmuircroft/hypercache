# 🕳🥊 hypercache 🧼
A large object state machine with a cached ram protection layer of a hyperbee/tinybee ( todo: add Gub bug mitigation layer) This is a single-writer, large object cache of folders/files that can prevent errors on a test copy cache

- single deligated writer (awarded by role change)
- bugs are pre-tested during multi value lock(s) on the large object and saved as bug detailed reports (where,what,when,who,why)
- if readable from a corestore then it becomes a db

Do not use for production yet. This will become fuller as time goes on ...

**A large object state machine with a cached ram protection layer that locks and replicates a tinybee's paused state. Errors only hit the replicated cache layer and are recorded as bug reports.**
