import { Module } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { env } from '@/config/env.schema';

export const GOOGLE_AI_CLIENT = 'GOOGLE_AI_CLIENT';

const GoogleAiProvider = {
  provide: GOOGLE_AI_CLIENT,
  useFactory: () => {
    return new GoogleGenAI({ apiKey: env.GOOGLE_AI_API_KEY });
  },
};

@Module({
  providers: [GoogleAiProvider],
  exports: [GoogleAiProvider],
})
export class AiModule {}
