import "server-only";

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
} from "docx";

import type { LetterExportDocumentInput } from "@/lib/letters/export/types";

function formatExportDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(date);
}

function bodyParagraphs(body: string): Paragraph[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 180 },
        }),
    );
}

export async function buildLetterDocx(
  input: LetterExportDocumentInput,
): Promise<Buffer> {
  const recipientLines = [
    new Paragraph({
      children: [
        new TextRun({
          text: `To: ${input.recipientName}`,
          bold: true,
          size: 22,
        }),
      ],
      spacing: { after: 120 },
    }),
  ];

  if (input.recipientAddress) {
    recipientLines.push(
      new Paragraph({
        children: [new TextRun({ text: input.recipientAddress, size: 22 })],
        spacing: { after: 240 },
      }),
    );
  }

  const document = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Mina — Letter Generator",
                bold: true,
                size: 28,
                color: "0F172A",
              }),
            ],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: input.letterTypeLabel,
                italics: true,
                size: 20,
                color: "D4A017",
              }),
            ],
            spacing: { after: 160 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: formatExportDate(input.exportedAt),
                size: 20,
                color: "6B7280",
              }),
            ],
            spacing: { after: 240 },
          }),
          ...recipientLines,
          new Paragraph({
            children: [
              new TextRun({
                text: `Subject: ${input.subject}`,
                bold: true,
                size: 24,
              }),
            ],
            spacing: { after: 240 },
          }),
          new Paragraph({
            children: [new TextRun({ text: input.greeting, size: 22 })],
            spacing: { after: 240 },
          }),
          ...bodyParagraphs(input.body),
          ...bodyParagraphs(input.closing),
          new Paragraph({
            children: [
              new TextRun({
                text: input.disclaimer,
                italics: true,
                size: 18,
                color: "92400E",
              }),
            ],
            spacing: { before: 360 },
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(document);
}
