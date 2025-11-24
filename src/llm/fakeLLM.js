export const fakeLLM = {
  async generate({ systemPrompt, messages }) {
    const last = messages[messages.length - 1].content;
    if (systemPrompt && systemPrompt.toLowerCase().includes("planning")) {
      return (
        "FAKE PLAN:\n" +
        "1. Analisis tujuan: " +
        last.slice(0, 40) +
        "...\n" +
        "2. Breakdown langkah-langkah.\n" +
        "3. Eksekusi dan revisi.\n" +
        "4. Evaluasi hasil.\n"
      );
    }
    return "FAKE_LLM_RESPONSE: " + last;
  },
};
