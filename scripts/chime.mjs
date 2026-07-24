#!/usr/bin/env node

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

try {
  // 1. Detect cue from process.argv[2]
  const cue = process.argv[2] === "ask" ? "ask" : "done";

  // 2. Check CHIME_MUTE first (wins over everything)
  if (process.env.CHIME_MUTE === "1") {
    process.exit(0);
  }

  // 2b. Mute flag file, toggled by the /chime command. CHIME_MUTE_FILE
  // overrides the default location so tests can isolate from the real flag.
  const muteFile = process.env.CHIME_MUTE_FILE || join(homedir(), ".claude", "chime-muted");
  if (existsSync(muteFile)) {
    process.exit(0);
  }

  // 3. Resolve sound file. CHIME_DONE_SOUND / CHIME_ASK_SOUND may hold a
  // single path or a ";"-separated list — a list means pick one at random.
  const pickSound = (value) => {
    const paths = value.split(";").map((p) => p.trim()).filter(Boolean);
    return paths[Math.floor(Math.random() * paths.length)];
  };

  let soundFile;
  const platform = process.platform;

  if (cue === "done") {
    soundFile =
      (process.env.CHIME_DONE_SOUND && pickSound(process.env.CHIME_DONE_SOUND)) ||
      (platform === "win32"
        ? "C:\\Windows\\Media\\chimes.wav"
        : platform === "darwin"
          ? "/System/Library/Sounds/Glass.aiff"
          : "/usr/share/sounds/freedesktop/stereo/complete.oga");
  } else {
    // cue === "ask"
    soundFile =
      (process.env.CHIME_ASK_SOUND && pickSound(process.env.CHIME_ASK_SOUND)) ||
      (platform === "win32"
        ? "C:\\Windows\\Media\\chord.wav"
        : platform === "darwin"
          ? "/System/Library/Sounds/Ping.aiff"
          : "/usr/share/sounds/freedesktop/stereo/dialog-information.oga");
  }

  // 4. Resolve volume. CHIME_VOLUME is a 0-100 percent; unset or non-numeric
  // means 100 (unchanged). 0 means silent — skip playback entirely.
  const parseVolume = () => {
    const raw = process.env.CHIME_VOLUME;
    if (raw === undefined || raw === "") return 100;
    const n = Number(raw);
    if (!Number.isFinite(n)) return 100;
    return Math.max(0, Math.min(100, Math.round(n)));
  };
  const volume = parseVolume();

  if (volume === 0) {
    if (process.env.CHIME_DRYRUN === "1") {
      console.log("(silent: CHIME_VOLUME=0)");
    }
    process.exit(0);
  }

  // 5. Determine player command per platform. afplay and paplay take a volume
  // flag natively. Media.SoundPlayer has none and WMPlayer.OCX never plays in a
  // headless shell (it hangs in "Transitioning"), so for a non-default volume
  // on Windows use the WPF MediaPlayer, which has a Volume property and plays
  // from a plain -STA shell. The default path keeps the proven SoundPlayer
  // one-liner (no assembly load, faster).
  let exe;
  let args;

  if (platform === "win32") {
    exe = "powershell";
    if (volume >= 100) {
      args = ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer '${soundFile}').PlaySync()`];
    } else {
      // MediaPlayer plays async. Poll up to ~1s for the media duration, then
      // sleep it out (fallback 3s if never reported). Worst case ~4.2s, well
      // under the 8s Node watchdog below so a hook can never stall.
      const mp =
        `Add-Type -AssemblyName presentationCore; ` +
        `$p = New-Object System.Windows.Media.MediaPlayer; ` +
        `$p.Volume = ${(volume / 100).toFixed(3)}; ` +
        `$p.Open([uri]'${soundFile}'); ` +
        `$p.Play(); ` +
        `$dur = 0; ` +
        `for ($i = 0; $i -lt 40; $i++) { if ($p.NaturalDuration.HasTimeSpan) { $dur = $p.NaturalDuration.TimeSpan.TotalMilliseconds; break }; Start-Sleep -Milliseconds 25 }; ` +
        `if ($dur -le 0) { $dur = 3000 }; ` +
        `Start-Sleep -Milliseconds ([int]$dur + 200); ` +
        `$p.Close()`;
      args = ["-NoProfile", "-STA", "-Command", mp];
    }
  } else if (platform === "darwin") {
    exe = "afplay";
    args = volume >= 100 ? [soundFile] : ["-v", String(volume / 100), soundFile];
  } else {
    exe = "paplay";
    const linear = Math.round((volume / 100) * 65536);
    args = volume >= 100 ? [soundFile] : ["--volume", String(linear), soundFile];
  }

  // 6. Check CHIME_DRYRUN
  if (process.env.CHIME_DRYRUN === "1") {
    // Print the resolved command as one line
    const command = [exe, ...args].join(" ");
    console.log(command);
    process.exit(0);
  }

  // 7. Play the sound. A detached spawn is silent on Windows (DETACHED_PROCESS
  // breaks SoundPlayer), so run the player attached and wait for it to exit;
  // the watchdog kills a hung player so a hook can never stall on us.
  const child = spawn(exe, args, { stdio: "ignore" });
  const watchdog = setTimeout(() => {
    try {
      child.kill();
    } catch {}
  }, 8000);
  child.on("error", () => {
    clearTimeout(watchdog);
    process.stderr.write("\u0007");
  });
  child.on("exit", () => {
    clearTimeout(watchdog);
  });
} catch {
  process.exit(0);
}
