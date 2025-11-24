import { logger } from "../logger.js";
import { MemoryStore } from "./memoryStore.js";

export class JarvisAgent {
  constructor(opts) {
    this.llm = opts.llm;
    this.memory = opts.memoryStore ?? new MemoryStore();
    this.systemPrompt =
      opts.systemPrompt ||
      process.env.JARVIS_SYSTEM_PROMPT ||
      "You are JARVIS, a helpful assistant.";
  }

  async handle(rawInput, userId = "anonymous") {
    const text = rawInput.trim();
    if (!text) return "Kasih aku teks dulu dong.";

    const tokens = text.split(/\s+/);
    let isPrefixed = false;
    let command = null;
    let args = "";

    if (tokens[0].toLowerCase() === "!jarvis") {
      isPrefixed = true;
      if (tokens.length === 1) {
        return this._helpText();
      }
      command = tokens[1].toLowerCase();
      args = tokens.slice(2).join(" ");
    } else {
      command = "chat";
      args = text;
    }

    logger.info("Handling command", { userId, command, isPrefixed });

    switch (command) {
      case "help":
        return this._helpText();
      case "note":
        return this._handleNoteCommand(args, userId);
      case "plan":
        return this._handlePlan(args, userId);
      case "chat":
      default:
        if (
          isPrefixed &&
          command !== "note" &&
          command !== "plan" &&
          command !== "help"
        ) {
          const question = [command, args].filter(Boolean).join(" ");
          return this._handleChat(question, userId);
        }
        return this._handleChat(args, userId);
    }
  }

  _helpText() {
    return [
      "**JARVIS Commands**",
      "`!jarvis help`              → Show this help",
      "`!jarvis <pertanyaan>`      → Tanya apa aja ke LLM",
      "`!jarvis note add <teks>`   → Simpan catatan pribadi",
      "`!jarvis note list`         → Lihat semua catatan",
      "`!jarvis note clear`        → Hapus semua catatan",
      "`!jarvis plan <goal>`       → Bikin rencana langkah demi langkah",
      "",
      "Contoh: `!jarvis plan belajar Faraday Law buat ujian besok`",
    ].join("\n");
  }

  async _handleNoteCommand(args, userId) {
    const tokens = args.trim().split(/\s+/);
    const sub = tokens[0]?.toLowerCase() || "";

    if (sub === "add") {
      const noteText = tokens.slice(1).join(" ");
      if (!noteText) return "Isi catatannya mana? `!jarvis note add <teks>`";

      this.memory.addNote(userId, noteText);
      return "✅ Catatan disimpan.";
    }

    if (sub === "list") {
      const notes = this.memory.listNotes(userId);
      if (!notes.length) return "Kamu belum punya catatan, boss.";

      const lines = notes.map(
        (n, idx) =>
          `${idx + 1}. ${n.text} (_${new Date(n.createdAt).toLocaleString()}_)`
      );
      return ["**Catatanmu:**", ...lines].join("\n");
    }

    if (sub === "clear") {
      this.memory.clearNotes(userId);
      return "🧹 Semua catatanmu sudah dihapus.";
    }

    return "Command `note` yang valid: `add`, `list`, `clear`.";
  }

  async _handlePlan(goal, userId) {
    const cleanGoal = goal.trim();
    if (!cleanGoal) return "Goal apa yang mau direncanakan?";

    const notes = this.memory.listNotes(userId);
    const notesSummary = notes.length
      ? notes.map((n, i) => `${i + 1}. ${n.text}`).join("\n")
      : "Tidak ada catatan khusus.";

    const systemPrompt =
      this.systemPrompt +
      "\n\nYou are now a planning agent. Buat rencana langkah demi langkah yang realistis.";

    const userMessage = [
      `Goal: ${cleanGoal}`,
      "",
      "Catatan user (kalau ada):",
      notesSummary,
    ].join("\n");

    const answer = await this.llm.generate({
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    return answer || "Gagal bikin rencana, coba lagi.";
  }

  async _handleChat(question, userId) {
    const q = question.trim();
    if (!q) return "Mau nanya apa?";

    const notes = this.memory.listNotes(userId);
    const notesSummary = notes.length
      ? notes.map((n, i) => `${i + 1}. ${n.text}`).join("\n")
      : "Tidak ada catatan.";

    const systemPrompt =
      this.systemPrompt +
      "\n\nCatatan user yang boleh dipakai kalau relevan:\n" +
      notesSummary;

    const answer = await this.llm.generate({
      systemPrompt,
      messages: [{ role: "user", content: q }],
    });

    return answer || "Aku nggak yakin jawabannya, coba tanya dengan cara lain.";
  }
}
