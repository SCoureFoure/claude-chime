---
description: Toggle claude-chime sounds on or off
---

Toggle the claude-chime mute flag. The flag is an empty file at `~/.claude/chime-muted` (resolve `~` as `$HOME` on macOS/Linux, `$env:USERPROFILE` on Windows). The chime script goes silent whenever this file exists.

1. Check whether the flag file exists.
2. If it exists: delete it, then reply exactly: `🔔 Chimes ON`
3. If it does not exist: create it empty, then reply exactly: `🔇 Chimes OFF`

Do nothing else — no other files, no explanation beyond the reply line.
