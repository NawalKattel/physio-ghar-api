import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { DataSource, IsNull, QueryFailedError, Repository } from 'typeorm';
import { ApiException, ErrorCode } from '../common/errors/api-exception';
import { normalizePhone } from '../common/validation/rules';
import { TherapistDto } from '../therapists/dto/therapist.dto';
import { Therapist } from '../therapists/therapist.entity';
import { AuthResponseDto, TokenPairDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AccessTokenPayload } from './jwt.strategy';
import { RefreshToken } from './refresh-token.entity';

const PG_UNIQUE_VIOLATION = '23505';

const invalidCredentials = () =>
  new ApiException(
    ErrorCode.INVALID_CREDENTIALS,
    HttpStatus.UNAUTHORIZED,
    'Incorrect email or password.',
  );

const invalidRefreshToken = () =>
  new ApiException(
    ErrorCode.UNAUTHORIZED,
    HttpStatus.UNAUTHORIZED,
    'Sign in again to continue.',
  );

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;
  private readonly accessTtl: number;
  private readonly refreshTtlDays: number;

  constructor(
    @InjectRepository(Therapist)
    private readonly therapists: Repository<Therapist>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessTtl = config.getOrThrow<number>('JWT_ACCESS_TTL');
    this.refreshTtlDays = config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS');
  }

  async onModuleInit(): Promise<void> {
    // Verified against when the email is unknown, so response time doesn't reveal which emails exist.
    this.dummyHash = await argon2.hash(randomBytes(16).toString('hex'));
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await argon2.hash(dto.password);
    let therapist: Therapist;
    try {
      therapist = await this.therapists.save(
        this.therapists.create({
          name: dto.name,
          email: dto.email,
          phone: normalizePhone(dto.phone),
          passwordHash,
        }),
      );
    } catch (e) {
      if (
        e instanceof QueryFailedError &&
        (e.driverError as { code?: string }).code === PG_UNIQUE_VIOLATION
      ) {
        throw new ApiException(
          ErrorCode.EMAIL_TAKEN,
          HttpStatus.CONFLICT,
          'That email already has an account.',
          { email: 'That email already has an account' },
        );
      }
      throw e;
    }
    return this.issue(therapist);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const therapist = await this.therapists
      .createQueryBuilder('t')
      .addSelect('t.passwordHash')
      .where('t.email = :email', { email: dto.email })
      .getOne();

    const ok = await argon2.verify(
      therapist?.passwordHash ?? this.dummyHash,
      dto.password,
    );
    if (!therapist || !ok) throw invalidCredentials();

    return this.issue(therapist);
  }

  /** Rotates the refresh token. Reusing a rotated token revokes all of the therapist's tokens. */
  async refresh(token: string): Promise<TokenPairDto> {
    return this.dataSource.transaction(async (m) => {
      const repo = m.getRepository(RefreshToken);
      const current = await repo.findOne({
        where: { tokenHash: hashToken(token) },
        lock: { mode: 'pessimistic_write' },
      });
      if (!current) throw invalidRefreshToken();

      const now = new Date();
      if (current.revokedAt) {
        if (current.replacedById) {
          // A rotated token came back: assume it leaked.
          await repo.update(
            { therapistId: current.therapistId, revokedAt: IsNull() },
            { revokedAt: now },
          );
        }
        throw invalidRefreshToken();
      }
      if (current.expiresAt <= now) throw invalidRefreshToken();

      const next = this.newRefreshToken(current.therapistId);
      const saved = await repo.save(next.entity);
      await repo.update(current.id, { revokedAt: now, replacedById: saved.id });

      return {
        accessToken: await this.signAccess(current.therapistId),
        refreshToken: next.token,
        expiresIn: this.accessTtl,
      };
    });
  }

  async logout(token: string): Promise<void> {
    await this.refreshTokens.update(
      { tokenHash: hashToken(token), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issue(therapist: Therapist): Promise<AuthResponseDto> {
    const next = this.newRefreshToken(therapist.id);
    await this.refreshTokens.save(next.entity);
    return {
      accessToken: await this.signAccess(therapist.id),
      refreshToken: next.token,
      expiresIn: this.accessTtl,
      therapist: TherapistDto.from(therapist),
    };
  }

  private signAccess(therapistId: string): Promise<string> {
    const payload: AccessTokenPayload = { sub: therapistId };
    return this.jwt.signAsync(payload);
  }

  private newRefreshToken(therapistId: string) {
    const token = `rt_${randomBytes(32).toString('base64url')}`;
    const entity = this.refreshTokens.create({
      therapistId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + this.refreshTtlDays * 24 * 60 * 60 * 1000),
      revokedAt: null,
      replacedById: null,
    });
    return { token, entity };
  }
}
