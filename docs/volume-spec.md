# Spec: Volume Setting for claude-chime

Status: IMPLEMENTED on branch `volume-setting-spec`. See `scripts/chime.mjs`.

## Implementation note (Windows pivot)

The original plan used `WMPlayer.OCX` for Windows volume. That was abandoned: in
a headless PowerShell the OCX hangs in playState `9` (Transitioning), never
plays, and never ends — verified during implementation. Replaced with the WPF
`System.Windows.Media.MediaPlayer` (`Volume` 0.0–1.0), run from a `-STA` shell
with a duration-poll then sleep. Plays and exits cleanly (~2.3s for a 2s clip),
well under the 8s watchdog. The default (100) path still uses the proven
`Media.SoundPlayer` one-liner.

## Goal

Let users control chime playback volume via a `CHIME_VOLUME` env var, without
adding non-builtin audio dependencies.

## Background

`scripts/chime.mjs` does not process audio. It resolves a sound-file path, then
hands it to an OS built-in player (`spawn(exe, args)`). Volume must therefore be
applied through each platform's player, not in Node.

Current players:

| platform | exe        | volume support |
|----------|------------|----------------|
| win32    | powershell / `Media.SoundPlayer` | none — plays at system mixer level |
| darwin   | afplay     | yes — `-v <0.0..1.0+>` |
| linux    | paplay     | yes — `--volume <0..65536>` (65536 = 100%) |

## Proposed interface

- New env var `CHIME_VOLUME` = integer `0`–`100` (percent). Unset = 100 (current
  behavior).
- Clamp out-of-range values to `[0, 100]`. Non-numeric = ignore, treat as 100.
- `0` = silent (skip playback entirely, cheaper than playing at zero gain).

## Per-platform mapping

- **macOS (afplay):** `afplay -v <pct/100> <file>`  (e.g. 50 -> `-v 0.5`).
- **Linux (paplay):** `paplay --volume=<round(pct/100 * 65536)> <file>`.
- **Windows:** `Media.SoundPlayer` has NO volume control. Options, cheapest→best:
  1. Swap to `WMPlayer.OCX` COM object:
     ```powershell
     $p = New-Object -ComObject WMPlayer.OCX
     $p.settings.volume = <pct>   # 0-100
     $p.URL = '<file>'
     $p.controls.play()
     # poll $p.playState until stopped (1), then release COM
     ```
     Cost: needs a playback-wait loop; more fragile than the current one-liner.
     Must preserve the non-blocking + watchdog guarantees in chime.mjs.
  2. Bundle a small player (ffplay/sox) — rejected: breaks "OS built-in only".

## Work checklist

- [x] Add `CHIME_VOLUME` parse + clamp helper in `scripts/chime.mjs`.
- [x] Insert volume flag into afplay / paplay arg arrays.
- [x] Rewrite win32 branch — WPF MediaPlayer (not WMPlayer); verified no-block.
- [x] Short-circuit playback when volume resolves to 0.
- [x] Update `CHIME_DRYRUN` output to include the volume flag/setting.
- [x] Document `CHIME_VOLUME` in README config section.
- [x] Windows tested at 0 / 50 / 100 (dry-run matrix + real play). **macOS/Linux
      arg mapping is written but UNTESTED — no access to those platforms here.**

## Effort estimate

- mac/Linux: trivial (~15 min, flag insertion).
- Windows: ~80% of the work — player rewrite is the only fragile part. Prototype
  the WMPlayer COM path first to confirm it never stalls a turn before committing.
