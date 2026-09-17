import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

// A class rather than an interface: it appears in decorated parameters, which emit metadata.
export class AuthenticatedTherapist {
  id: string;
}

/** The signed-in therapist, taken from the access token — never from the client. */
export const CurrentTherapist = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedTherapist =>
    ctx.switchToHttp().getRequest<Request>().user as AuthenticatedTherapist,
);
