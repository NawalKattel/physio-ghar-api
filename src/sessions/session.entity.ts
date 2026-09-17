import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Therapist } from '../therapists/therapist.entity';

export const SESSION_STATUSES = [
  'request',
  'upcoming',
  'completed',
  'cancelled',
] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

/** Statuses that occupy a slot. */
export const BOOKED_STATUSES: SessionStatus[] = ['upcoming', 'completed'];

export const VISIT_TYPES = ['home', 'clinic'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

@Entity('sessions')
@Index('ix_sessions_therapist_status_start', ['therapistId', 'status', 'startAt'])
// One booking per therapist per start time; enforced by the database, not app code.
@Index('uq_sessions_booked_start', ['therapistId', 'startAt'], {
  unique: true,
  where: `status IN ('upcoming', 'completed')`,
})
export class Session {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  therapistId!: string;

  @ManyToOne(() => Therapist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: Therapist;

  @Index('ix_sessions_patient_id')
  @Column({ type: 'uuid' })
  patientId!: string;

  @ManyToOne(() => Patient, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'patient_id' })
  patient!: Patient;

  @Column({ type: 'timestamptz' })
  startAt!: Date;

  @Column({ type: 'smallint', default: 60 })
  durationMinutes!: number;

  @Column({ type: 'varchar', length: 120 })
  treatment!: string;

  @Column({ type: 'varchar', length: 10 })
  visitType!: VisitType;

  @Column({ type: 'varchar', length: 255 })
  location!: string;

  @Column({ type: 'varchar', length: 12, default: 'request' })
  status!: SessionStatus;

  @Column({ type: 'text', nullable: true })
  remarks!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  declineReason!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
