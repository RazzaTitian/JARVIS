import readline from "node:readline";
import dotenv from "dotenv";
import { JarvisAgent } from "./agent/jarvisAgent.js";
import { createOpenAILLM } from "./llm/openaiClient.js";
import { logger } from "./logger.js";

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "JARVIS> ",
});

const agent = new JarvisAgent({
  llm: createOpenAILLM(),
});

console.log('JARVIS CLI ready. Ketik saja pertanyaanmu atau "!jarvis help".');
rl.prompt();

rl.on("line", async (line) => {
  try {
    const response = await agent.handle(line, "cli-user");
    console.log(response);
  } catch (err) {
    logger.error("Error in CLI", { error: err.message });
    console.log("Oops, ada error. Coba lagi.");
  }
  rl.prompt();
});

rl.on("close", () => {
  console.log("\nBye.");
  process.exit(0);
});
