import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { ApiException, ErrorCode } from '../common/errors/api-exception';

/** Global guard: every route needs a bearer token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<T>(err: unknown, user: T, info: unknown): T {
    if ((info as Error | undefined)?.name === 'TokenExpiredError') {
      throw new ApiException(
        ErrorCode.TOKEN_EXPIRED,
        HttpStatus.UNAUTHORIZED,
        'Your session has expired.',
      );
    }
    if (err || !user) {
      throw new ApiException(
        ErrorCode.UNAUTHORIZED,
        HttpStatus.UNAUTHORIZED,
        'Sign in to continue.',
      );
    }
    return user;
  }
}
