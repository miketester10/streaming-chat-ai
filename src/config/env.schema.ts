import { z } from 'zod';
import { config } from 'dotenv';
config();

const EnvSchema = z.object({
  GOOGLE_AI_API_KEY: z
    .string()
    .trim()
    .nonempty('GOOGLE_AI_API_KEY is required.'),
  GOOGLE_AI_MODEL: z.string().trim().nonempty('GOOGLE_AI_MODEL is required.'),
});

const envParsed = EnvSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error(
    '❌ Config validation error:',
    z.treeifyError(envParsed.error).properties,
  );
  throw new Error('Invalid environment variables');
}

type EnvType = z.infer<typeof EnvSchema>;
export const env: EnvType = envParsed.data;
