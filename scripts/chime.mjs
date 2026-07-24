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

  // 4. Determine player command per platform
  let exe;
  let args;

  if (platform === "win32") {
    exe = "powershell";
    args = ["-NoProfile", "-Command", `(New-Object Media.SoundPlayer '${soundFile}').PlaySync()`];
  } else if (platform === "darwin") {
    exe = "afplay";
    args = [soundFile];
  } else {
    exe = "paplay";
    args = [soundFile];
  }

  // 5. Check CHIME_DRYRUN
  if (process.env.CHIME_DRYRUN === "1") {
    // Print the resolved command as one line
    const command = [exe, ...args].join(" ");
    console.log(command);
    process.exit(0);
  }

  // 6. Play the sound. A detached spawn is silent on Windows (DETACHED_PROCESS
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
