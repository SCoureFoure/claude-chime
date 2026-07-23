# claude-chime

An audible cue that plays when Claude Code finishes responding or needs your input, letting you stay focused on other work without constantly checking the screen. Perfect for multitasking workflows.

## Install

From GitHub (any machine):

```
/plugin marketplace add SCoureFoure/claude-chime
/plugin install claude-chime@claude-chime-marketplace
/reload-plugins
```

From a local clone, use the clone's path in the first command instead:

```
/plugin marketplace add /path/to/claude-chime
```

## Sounds

| event | hook | default sound (Windows) | default sound (macOS) | default (Linux) |
|-------|------|------------------------|----------------------|-----------------|
| turn finished | Stop | chimes.wav | Glass.aiff | complete.oga |
| needs input | Notification | chord.wav | Ping.aiff | dialog-information.oga |

## Configuration

Set environment variables to customize sound behavior:

- `CHIME_DONE_SOUND` — absolute path to a sound file, overrides default "turn finished" sound.
- `CHIME_ASK_SOUND` — absolute path to a sound file, overrides default "needs input" sound.
- `CHIME_MUTE=1` — silences all sound notifications.
- `CHIME_MUTE_FILE` — path of the mute flag file (default `~/.claude/chime-muted`); sounds are silenced while it exists.

Or just run the `/chime` slash command in Claude Code to toggle sounds on/off — it creates or removes the mute flag file for you.

To test without playing sound, use the dry-run command (macOS/Linux, then PowerShell):

```sh
CHIME_DRYRUN=1 node scripts/chime.mjs done
```

```powershell
$env:CHIME_DRYRUN="1"; node scripts/chime.mjs done
```

This prints the player command instead of executing it.

## Requirements

- Node.js version 18 or higher on PATH.
- Windows, macOS, or Linux terminal with support for OS built-in audio players (PowerShell SoundPlayer on Windows, afplay on macOS, paplay on Linux).
