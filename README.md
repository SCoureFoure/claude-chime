# claude-chime

An audible cue that plays when Claude Code finishes responding or needs your input, letting you stay focused on other work without constantly checking the screen. Perfect for multitasking workflows.

## Install

```
/plugin marketplace add C:\Users\SCora\Documents\Repositories\claude-chime
/plugin install claude-chime@claude-chime-marketplace
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

To test without playing sound, use the dry-run command:

```
CHIME_DRYRUN=1 node scripts/chime.mjs done
```

This prints the player command instead of executing it.

## Requirements

- Node.js version 18 or higher on PATH.
- Windows, macOS, or Linux terminal with support for OS built-in audio players (PowerShell SoundPlayer on Windows, afplay on macOS, paplay on Linux).
