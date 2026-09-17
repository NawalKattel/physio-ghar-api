import { ValidationError, ValidationPipe } from '@nestjs/common';
import { ApiException } from '../errors/api-exception';

function collectFields(
  errors: ValidationError[],
  fields: Record<string, string>,
  prefix = '',
): Record<string, string> {
  for (const err of errors) {
    const path = prefix ? `${prefix}.${err.property}` : err.property;
    const messages = Object.values(err.constraints ?? {});
    // Keep one message per field, the one the app shows under the input.
    if (messages.length && !fields[path]) fields[path] = messages[0];
    if (err.children?.length) collectFields(err.children, fields, path);
  }
  return fields;
}

export const apiValidationPipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  stopAtFirstError: true,
  exceptionFactory: (errors) => ApiException.validation(collectFields(errors, {})),
});
