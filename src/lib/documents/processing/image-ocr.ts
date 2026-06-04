import "server-only";

import { createWorker } from "tesseract.js";

export async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker("eng", 1, {
    logger: () => {},
  });

  try {
    const {
      data: { text },
    } = await worker.recognize(buffer);

    return text.replace(/\s+/g, " ").trim();
  } finally {
    await worker.terminate();
  }
}
