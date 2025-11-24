import OpenAI from "openai";
import dotenv from "dotenv";
import { logger } from "../logger.js";

dotenv.config();

export function createOpenAILLM() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.warn("OPENAI_API_KEY not set. LLM calls will fail.");
  }

  const client = new OpenAI({
    apiKey,
  });

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

      logger.info("Calling OpenAI", { model: chosenModel });

      const completion = await client.chat.completions.create({
        model: chosenModel,
        messages: fullMessages,
        temperature: 0.4,
        max_tokens: 512,
      });

      const content = completion.choices?.[0]?.message?.content ?? "";
      return content.trim();
    },
  };
}
