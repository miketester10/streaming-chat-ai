import { z } from 'zod';

// Messaggio inviato dal frontend
export const UserMessageSchema = z.object({
  message: z.string().min(1),
});

export type UserMessageDto = z.infer<typeof UserMessageSchema>;

// Messaggio inviato al frontend
const AiMessageSchema = z.object({
  role: z.enum(['system', 'model', 'user']),
  content: z.string(),
  done: z.boolean(),
  error: z.string().optional(),
});

export type SuccessMessage = Omit<z.infer<typeof AiMessageSchema>, 'error'>;
export type ErrorMessage = SuccessMessage & {
  error: string;
};
