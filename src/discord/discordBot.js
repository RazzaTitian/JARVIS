import { Client, GatewayIntentBits, Partials } from "discord.js";
import dotenv from "dotenv";
import { JarvisAgent } from "../agent/jarvisAgent.js";
import { createOpenAILLM } from "../llm/openaiClient.js";
import { logger } from "../logger.js";

dotenv.config();

const token = process.env.DISCORD_BOT_TOKEN;
if (!token) {
  console.error("DISCORD_BOT_TOKEN not set in .env");
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const agent = new JarvisAgent({
  llm: createOpenAILLM(),
});

client.once("ready", () => {
  logger.info(`Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (message) => {
  try {
    if (message.author.bot) return;

    const content = message.content.trim();
    if (!content.toLowerCase().startsWith("!jarvis")) return;

    await message.channel.sendTyping();

    const reply = await agent.handle(content, message.author.id);
    await message.reply(reply);
  } catch (err) {
    logger.error("Error handling Discord message", { error: err.message });
    await message.reply("Ada error di sisi bot. Coba sebentar lagi.");
  }
});

client.login(token);
