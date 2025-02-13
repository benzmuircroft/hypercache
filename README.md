# 🕳🥊 hypercache 🧼
A large object state machine with a cached ram protection layer of a hyperbee/tinybee ( todo: add Gub bug mitigation layer) This is a single-writer, large object cache of folders/files that can prevent errors on a test copy cache

- single deligated writer (awarded role change)
- bugs are pre-tested during multi value lock(s) on the large object
- if readable from a corestore then it becomes a db

Do not use for production yet. This will become fuller as time goes on ...
