import { HttpStatus } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { ApiException, ErrorCode } from '../errors/api-exception';

export class PageQueryDto {
  /** Page size (default 50, max 200). */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be between 1 and 200' })
  @Max(200, { message: 'limit must be between 1 and 200' })
  limit?: number;

  /** `nextCursor` from the previous page. */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  cursor?: string;
}

export const DEFAULT_PAGE_SIZE = 50;

export function encodeCursor(values: string[]): string {
  return Buffer.from(JSON.stringify(values)).toString('base64url');
}

export function decodeCursor(cursor: string, size: number): string[] {
  try {
    const values: unknown = JSON.parse(
      Buffer.from(cursor, 'base64url').toString('utf8'),
    );
    if (
      Array.isArray(values) &&
      values.length === size &&
      values.every((v) => typeof v === 'string')
    ) {
      return values as string[];
    }
  } catch {
    // fall through
  }
  throw new ApiException(
    ErrorCode.VALIDATION_FAILED,
    HttpStatus.UNPROCESSABLE_ENTITY,
    'Invalid cursor.',
    { cursor: 'Invalid cursor' },
  );
}

/**
 * Keyset pagination on (sortColumn, idColumn). Both are ordered in `direction`,
 * so a single row comparison selects the rows after the cursor.
 */
export function applyKeyset<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  opts: {
    sortColumn: string;
    idColumn: string;
    direction: 'ASC' | 'DESC';
    page: PageQueryDto;
    /** SQL cast for the sort value, e.g. 'timestamptz'. */
    sortCast?: string;
  },
): SelectQueryBuilder<T> {
  const { sortColumn, idColumn, direction, page, sortCast = 'text' } = opts;
  if (page.cursor) {
    const [sortValue, id] = decodeCursor(page.cursor, 2);
    const op = direction === 'ASC' ? '>' : '<';
    qb.andWhere(
      `(${sortColumn}, ${idColumn}) ${op} (CAST(:cursorSort AS ${sortCast}), CAST(:cursorId AS uuid))`,
      { cursorSort: sortValue, cursorId: id },
    );
  }
  return qb
    .orderBy(sortColumn, direction)
    .addOrderBy(idColumn, direction)
    .take((page.limit ?? DEFAULT_PAGE_SIZE) + 1);
}

/** Trims the look-ahead row and builds nextCursor from the last item kept. */
export function toPage<T>(
  rows: T[],
  page: PageQueryDto,
  cursorOf: (row: T) => string[],
): { items: T[]; nextCursor: string | null } {
  const limit = page.limit ?? DEFAULT_PAGE_SIZE;
  if (rows.length <= limit) return { items: rows, nextCursor: null };
  const items = rows.slice(0, limit);
  return { items, nextCursor: encodeCursor(cursorOf(items[items.length - 1])) };
}
