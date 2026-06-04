import "server-only";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { LetterExportDocumentInput } from "@/lib/letters/export/types";

const MINA_NAVY = rgb(15 / 255, 23 / 255, 42 / 255);
const MINA_GOLD = rgb(212 / 255, 160 / 255, 23 / 255);
const MINA_TEXT = rgb(17 / 255, 24 / 255, 39 / 255);
const MINA_MUTED = rgb(107 / 255, 114 / 255, 128 / 255);
const MINA_AMBER = rgb(146 / 255, 64 / 255, 14 / 255);

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const CONTENT_TOP = 700;
const LINE_HEIGHT = 16;
const HEADER_HEIGHT = 48;

function formatExportDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(date);
}

function wrapText(text: string, maxWidth: number, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);

    if (width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
    }

    currentLine = word;
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

function drawWrappedParagraph(input: {
  page: ReturnType<PDFDocument["addPage"]>;
  text: string;
  x: number;
  y: number;
  maxWidth: number;
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>;
  size: number;
  color: ReturnType<typeof rgb>;
  lineHeight?: number;
}): number {
  const lineHeight = input.lineHeight ?? LINE_HEIGHT;
  let cursorY = input.y;
  const paragraphs = input.text.split("\n");

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    if (!trimmed) {
      cursorY -= lineHeight;
      continue;
    }

    const lines = wrapText(trimmed, input.maxWidth, input.font, input.size);

    for (const line of lines) {
      input.page.drawText(line, {
        x: input.x,
        y: cursorY,
        size: input.size,
        font: input.font,
        color: input.color,
      });
      cursorY -= lineHeight;
    }

    cursorY -= 6;
  }

  return cursorY;
}

export async function buildLetterPdf(
  input: LetterExportDocumentInput,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const italic = await pdf.embedFont(StandardFonts.HelveticaOblique);

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const contentWidth = PAGE_WIDTH - MARGIN_X * 2;

  page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: HEADER_HEIGHT,
    color: MINA_NAVY,
  });

  page.drawText("Mina", {
    x: MARGIN_X,
    y: PAGE_HEIGHT - 32,
    size: 18,
    font: bold,
    color: rgb(1, 1, 1),
  });

  page.drawText("Letter Generator", {
    x: MARGIN_X + 52,
    y: PAGE_HEIGHT - 31,
    size: 10,
    font: regular,
    color: MINA_GOLD,
  });

  page.drawLine({
    start: { x: 0, y: PAGE_HEIGHT - HEADER_HEIGHT },
    end: { x: PAGE_WIDTH, y: PAGE_HEIGHT - HEADER_HEIGHT },
    thickness: 2,
    color: MINA_GOLD,
  });

  let cursorY = CONTENT_TOP;

  page.drawText(formatExportDate(input.exportedAt), {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: regular,
    color: MINA_MUTED,
  });
  cursorY -= 28;

  page.drawText(`To: ${input.recipientName}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 11,
    font: bold,
    color: MINA_TEXT,
  });
  cursorY -= LINE_HEIGHT;

  if (input.recipientAddress) {
    cursorY = drawWrappedParagraph({
      page,
      text: input.recipientAddress,
      x: MARGIN_X,
      y: cursorY,
      maxWidth: contentWidth,
      font: regular,
      size: 11,
      color: MINA_TEXT,
    });
  }

  cursorY -= 10;

  page.drawText(`Subject: ${input.subject}`, {
    x: MARGIN_X,
    y: cursorY,
    size: 12,
    font: bold,
    color: MINA_TEXT,
  });
  cursorY -= 24;

  page.drawText(input.greeting, {
    x: MARGIN_X,
    y: cursorY,
    size: 11,
    font: regular,
    color: MINA_TEXT,
  });
  cursorY -= 24;

  cursorY = drawWrappedParagraph({
    page,
    text: input.body,
    x: MARGIN_X,
    y: cursorY,
    maxWidth: contentWidth,
    font: regular,
    size: 11,
    color: MINA_TEXT,
  });

  cursorY -= 8;

  cursorY = drawWrappedParagraph({
    page,
    text: input.closing,
    x: MARGIN_X,
    y: cursorY,
    maxWidth: contentWidth,
    font: regular,
    size: 11,
    color: MINA_TEXT,
  });

  cursorY -= 24;

  if (cursorY < 140) {
    page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    cursorY = CONTENT_TOP;
  }

  page.drawRectangle({
    x: MARGIN_X,
    y: Math.max(72, cursorY - 72),
    width: contentWidth,
    height: 84,
    borderColor: MINA_GOLD,
    borderWidth: 1,
    color: rgb(1, 0.98, 0.94),
  });

  drawWrappedParagraph({
    page,
    text: input.disclaimer,
    x: MARGIN_X + 12,
    y: Math.max(132, cursorY - 18),
    maxWidth: contentWidth - 24,
    font: italic,
    size: 9,
    color: MINA_AMBER,
    lineHeight: 13,
  });

  page.drawText(input.letterTypeLabel, {
    x: MARGIN_X,
    y: 42,
    size: 8,
    font: regular,
    color: MINA_MUTED,
  });

  return pdf.save();
}
