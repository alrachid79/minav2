import { z } from "zod";

import { DOCUMENT_TYPES } from "@/lib/documents/intelligence/types";

const confirmFieldSchema = z.object({
  value: z.string(),
  unknown: z.boolean(),
});

export const documentConfirmPayloadSchema = z.object({
  documentId: z.string().uuid(),
  documentType: z.enum(DOCUMENT_TYPES),
  collectorName: confirmFieldSchema,
  creditorName: confirmFieldSchema,
  balanceAmount: confirmFieldSchema,
  documentDate: confirmFieldSchema,
  responseDeadline: confirmFieldSchema,
  courtDate: confirmFieldSchema,
});

export type DocumentConfirmPayload = z.infer<typeof documentConfirmPayloadSchema>;
