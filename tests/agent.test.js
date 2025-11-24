import test from "node:test";
import assert from "node:assert";
import { JarvisAgent } from "../src/agent/jarvisAgent.js";
import { MemoryStore } from "../src/agent/memoryStore.js";

// In-memory store: override file saving
class InMemoryStore extends MemoryStore {
  constructor() {
    super(":memory:");
    this.state = { notesByUser: {} };
  }
  _save() {
    // ignore disk writes
  }
}

const fakeLLM = {
  async generate({ systemPrompt, messages }) {
    const last = messages[messages.length - 1].content;

    if (systemPrompt.includes("planning agent")) {
      return `PLAN:\n1. Analisis goal: ${last.slice(
        0,
        30
      )}...\n2. Langkah-langkah selanjutnya.`;
    }

    return `LLM_ECHO: ${last}`;
  },
};

function createTestAgent() {
  return new JarvisAgent({
    llm: fakeLLM,
    memoryStore: new InMemoryStore(),
    systemPrompt: "Test system prompt",
  });
}

test("chat: basic echo", async () => {
  const agent = createTestAgent();
  const res = await agent.handle("Halo apa kabar?", "u1");
  assert.ok(res.startsWith("LLM_ECHO:"), "Should echo via fake LLM");
});

test("note: add and list", async () => {
  const agent = createTestAgent();
  await agent.handle("!jarvis note add belajar Faraday", "u1");
  const list = await agent.handle("!jarvis note list", "u1");
  assert.match(list, /belajar Faraday/, "Note should appear in list");
});

test("note: clear", async () => {
  const agent = createTestAgent();
  await agent.handle("!jarvis note add test1", "u1");
  await agent.handle("!jarvis note clear", "u1");
  const list = await agent.handle("!jarvis note list", "u1");
  assert.match(list, /belum punya catatan/i, "Notes should be cleared");
});

test("help command", async () => {
  const agent = createTestAgent();
  const res = await agent.handle("!jarvis help", "u1");
  assert.match(res, /JARVIS Commands/, "Help text should be returned");
});

test("plan command uses planner mode", async () => {
  const agent = createTestAgent();
  const res = await agent.handle("!jarvis plan belajar Maxwell", "u1");
  assert.match(res, /PLAN:/, "Planner response should be returned");
});

test("prefixed question without subcommand still works", async () => {
  const agent = createTestAgent();
  const res = await agent.handle("!jarvis apa itu piezoelectric?", "u1");
  assert.ok(res.includes("piezoelectric"), "Question should be passed to LLM");
});
