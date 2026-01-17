import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ZodObject } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodObject) {}

  transform(value: unknown, metadata: ArgumentMetadata) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        path: e.path,
        message: e.message,
      }));
      throw new WsException({
        type: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors,
      });
    }

    return result.data;
  }
}
