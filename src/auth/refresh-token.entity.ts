import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Therapist } from '../therapists/therapist.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('ix_refresh_tokens_therapist_id')
  @Column({ type: 'uuid' })
  therapistId: string;

  @ManyToOne(() => Therapist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: Therapist;

  /** SHA-256 of the token; the token itself is never stored. */
  @Index('uq_refresh_tokens_token_hash', { unique: true })
  @Column({ type: 'char', length: 64 })
  tokenHash: string;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt: Date | null;

  /** Set when rotated, so reuse of an old token can be detected. */
  @Column({ type: 'uuid', nullable: true })
  replacedById: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
