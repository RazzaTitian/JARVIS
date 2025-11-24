import fs from "node:fs";
import path from "node:path";

const logDir = path.join(process.cwd(), "logs");
const logFile = path.join(logDir, "jarvis.log");

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function write(level, message, meta) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    meta: meta ?? null,
  };

  const line = JSON.stringify(entry) + "\n";

  fs.appendFile(logFile, line, (err) => {
    if (err) {
      console.error("[LOGGER][FAIL]", err.message);
    }
  });

  console.log(`[${entry.ts}] [${level}] ${message}`);
}

export const logger = {
  info: (msg, meta) => write("INFO", msg, meta),
  warn: (msg, meta) => write("WARN", msg, meta),
  error: (msg, meta) => write("ERROR", msg, meta),
};
