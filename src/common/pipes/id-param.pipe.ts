import { Injectable, PipeTransform } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { ApiException } from '../errors/api-exception';

/** IDs are opaque to clients; a malformed one is simply "not found". */
@Injectable()
export class IdParamPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!isUUID(value)) throw ApiException.notFound();
    return value;
  }
}
