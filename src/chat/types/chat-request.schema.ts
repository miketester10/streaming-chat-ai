import { z } from 'zod';

// --- History (messaggi passati) ---

// Una singola parte di testo all'interno di un messaggio
export const TextPartSchema = z.object({
  text: z.string().trim().nonempty('Text is required.'),
});

// Un singolo messaggio nella history
export const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  parts: z.array(TextPartSchema).min(1),
});

// History di massimo 6 messaggi
export const HistorySchema = z.array(MessageSchema).min(1).max(6);

// --- Request dal frontend ---

export const ChatRequestSchema = z
  .object({
    history: HistorySchema,
    newMessage: z.string().trim().nonempty('New message is required.'),
  })
  .strict();

export type ChatRequestDto = z.infer<typeof ChatRequestSchema>;
