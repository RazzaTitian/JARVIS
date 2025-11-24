import dotenv from "dotenv";
import { fakeLLM } from "./fakeLLM.js";
import { logger } from "../logger.js";
import OpenAI from "openai";

dotenv.config();

export function createOpenAILLM() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn("No OPENAI_API_KEY found. Using fakeLLM (0 cost).");
    return fakeLLM;
  }

  logger.info("Using REAL OpenAI LLM.");

  const client = new OpenAI({ apiKey });
  const defaultModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  return {
    name: "openai",
    async generate({ systemPrompt, messages, model }) {
      const fullMessages = [];

      if (systemPrompt) {
        fullMessages.push({ role: "system", content: systemPrompt });
      }

      fullMessages.push(...messages);

      const chosenModel = model || defaultModel;

      const completion = await client.chat.completions.create({
        model: chosenModel,
        messages: fullMessages,
        temperature: 0.4,
        max_tokens: 512,
      });

      return completion.choices?.[0]?.message?.content?.trim() ?? "";
    },
  };
}
