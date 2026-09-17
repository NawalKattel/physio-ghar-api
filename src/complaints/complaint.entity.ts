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

export const COMPLAINT_CATEGORIES = [
  'patient',
  'booking',
  'payment',
  'technical',
  'other',
] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const COMPLAINT_STATUSES = ['submitted', 'in_review', 'resolved'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

@Entity('complaints')
@Index('ix_complaints_therapist_submitted', ['therapistId', 'submittedAt'])
export class Complaint {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  therapistId: string;

  @ManyToOne(() => Therapist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: Therapist;

  /** PG-C-0002; assigned by a database sequence default. */
  @Index('uq_complaints_reference', { unique: true })
  @Column({ type: 'varchar', length: 20, insert: false, update: false })
  reference: string;

  @Column({ type: 'varchar', length: 20 })
  category: ComplaintCategory;

  @Column({ type: 'varchar', length: 80 })
  subject: string;

  @Column({ type: 'varchar', length: 1000 })
  description: string;

  @Column({ type: 'varchar', length: 12, default: 'submitted' })
  status: ComplaintStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  submittedAt: Date;
}
