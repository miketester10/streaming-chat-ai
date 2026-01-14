import { z } from 'zod';

// --- Response al frontend ---

export const ResponseMessageSchema = z.object({
  role: z.enum(['system', 'model', 'user']),
  content: z.string(),
  done: z.boolean(),
  error: z.string().optional(),
});

export type SuccessMessage = Omit<
  z.infer<typeof ResponseMessageSchema>,
  'error'
>;
export type ErrorMessage = SuccessMessage & { error: string };
