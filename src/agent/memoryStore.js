import fs from "node:fs";
import path from "node:path";

export class MemoryStore {
  constructor(filePath = path.join(process.cwd(), "memory.json")) {
    this.filePath = filePath;
    this.state = {
      notesByUser: {},
    };

    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        this.state = JSON.parse(raw);
      }
    } catch (err) {
      console.error("[MemoryStore] Failed to load memory.json:", err.message);
      this.state = { notesByUser: {} };
    }
  }

  _save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2));
    } catch (err) {
      console.error("[MemoryStore] Failed to save memory.json:", err.message);
    }
  }

  addNote(userId, text) {
    if (!this.state.notesByUser[userId]) {
      this.state.notesByUser[userId] = [];
    }
    this.state.notesByUser[userId].push({
      text,
      createdAt: new Date().toISOString(),
    });
    this._save();
  }

  listNotes(userId) {
    return this.state.notesByUser[userId] ?? [];
  }

  clearNotes(userId) {
    this.state.notesByUser[userId] = [];
    this._save();
  }
}
