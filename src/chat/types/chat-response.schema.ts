import { z } from 'zod';

// --- Response al frontend ---

export const ResponseMessageSchema = z.object({
  role: z.enum(['system', 'model', 'user']),
  content: z.string(),
  done: z.boolean(),
});

export type SuccessMessage = z.infer<typeof ResponseMessageSchema>;
export type ErrorMessage = z.infer<typeof ResponseMessageSchema> & {
  error: string;
};
