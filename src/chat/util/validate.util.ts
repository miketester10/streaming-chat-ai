import {
  ChatRequestDto,
  ChatRequestSchema,
} from '@/chat/types/chat-request.schema';
import z from 'zod';

export const validate = (payload: unknown): ChatRequestDto => {
  // Parse payload
  payload = typeof payload === 'string' ? JSON.parse(payload) : payload;

  // Validazione con Zod
  const parsed = ChatRequestSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(
      `Invalid payload: ${JSON.stringify(z.treeifyError(parsed.error).properties, null, 2)}`,
    );
  }
  return parsed.data;
};
