# claude-chime

An audible cue that plays when Claude Code finishes responding or needs your input, letting you stay focused on other work without constantly checking the screen. Perfect for multitasking workflows.

## Install

From GitHub (any machine):

```text
/plugin marketplace add SCoureFoure/claude-chime
/plugin install claude-chime@claude-chime-marketplace
/reload-plugins
```

From a local clone, use the clone's path in the first command instead:

```text
/plugin marketplace add /path/to/claude-chime
```

## Sounds

| event | hook | default sound (Windows) | default sound (macOS) | default (Linux) |
| --- | --- | --- | --- | --- |
| turn finished | Stop | chimes.wav | Glass.aiff | complete.oga |
| needs input | Notification | chord.wav | Ping.aiff | dialog-information.oga |

## Configuration

Set environment variables to customize sound behavior:

- `CHIME_DONE_SOUND` — absolute path to a sound file, overrides default "turn finished" sound. Pass a `;`-separated list of paths to have one picked at random each time.
- `CHIME_ASK_SOUND` — absolute path to a sound file, overrides default "needs input" sound. Pass a `;`-separated list of paths to have one picked at random each time.
- `CHIME_VOLUME` — playback volume as a percent, `0`–`100` (default `100`). `0` is silent; out-of-range and non-numeric values fall back to `100`. On Windows a non-default volume uses the WPF MediaPlayer instead of the default SoundPlayer.
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

## Recipes

### Use your own sounds

Point `CHIME_DONE_SOUND` (and/or `CHIME_ASK_SOUND`) at an absolute path. Windows
plays `.wav`; macOS plays `.aiff`/`.wav`; Linux plays what `paplay` supports
(`.wav`/`.ogg`).

Give a `;`-separated list to have one chosen at random on each chime — handy for
variety:

```powershell
$env:CHIME_DONE_SOUND="C:\sounds\done-a.wav;C:\sounds\done-b.wav"
```

```sh
export CHIME_DONE_SOUND="$HOME/sounds/done-a.wav;$HOME/sounds/done-b.aiff"
```

### Adjust the volume

Set `CHIME_VOLUME` to a percent, `0`–`100`:

```powershell
$env:CHIME_VOLUME="50"
```

```sh
export CHIME_VOLUME=50
```

### Make it stick for the hooks

The chimes fire from Claude Code hooks, which read the environment Claude Code
was launched with. To apply your settings to the real chimes (not just a manual
`node scripts/chime.mjs` run), add them to the `env` block of a Claude Code
`settings.json` and reload:

```json
{
  "env": {
    "CHIME_VOLUME": "50",
    "CHIME_DONE_SOUND": "C:\\sounds\\done-a.wav;C:\\sounds\\done-b.wav"
  }
}
```

Changes to `env` take effect on the next session (or after a reload) — a session
already running keeps the values it started with.

## Requirements

- Node.js version 18 or higher on PATH.
- Windows, macOS, or Linux terminal with support for OS built-in audio players (PowerShell SoundPlayer on Windows, afplay on macOS, paplay on Linux).
