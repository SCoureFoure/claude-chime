#!/usr/bin/env node

import { spawn } from "node:child_process";

try {
  // 1. Detect cue from process.argv[2]
  const cue = process.argv[2] === "ask" ? "ask" : "done";

  // 2. Check CHIME_MUTE first (wins over everything)
  if (process.env.CHIME_MUTE === "1") {
    process.exit(0);
  }

  // 3. Resolve sound file
  let soundFile;
  const platform = process.platform;

  if (cue === "done") {
    soundFile =
      process.env.CHIME_DONE_SOUND ||
      (platform === "win32"
        ? "C:\\Windows\\Media\\chimes.wav"
        : platform === "darwin"
          ? "/System/Library/Sounds/Glass.aiff"
          : "/usr/share/sounds/freedesktop/stereo/complete.oga");
  } else {
    // cue === "ask"
    soundFile =
      process.env.CHIME_ASK_SOUND ||
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

  // 6. Play the sound
  const child = spawn(exe, args, { detached: true, stdio: "ignore" });
  child.unref();

  // Attach error handler for fallback
  child.on("error", () => {
    process.stderr.write("\u0007");
  });

  process.exit(0);
} catch {
  process.exit(0);
}
