import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';
import { Session } from '../sessions/session.entity';
import { Therapist } from '../therapists/therapist.entity';

@Entity('notes')
@Index('ix_notes_patient_created', ['patientId', 'createdAt'])
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Author. */
  @Column({ type: 'uuid' })
  therapistId: string;

  @ManyToOne(() => Therapist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'therapist_id' })
  therapist?: Therapist;

  @Column({ type: 'uuid' })
  patientId: string;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient?: Patient;

  @Column({ type: 'varchar', length: 80 })
  title: string;

  @Column({ type: 'varchar', length: 2000 })
  body: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /** Null until edited. */
  @Column({ type: 'timestamptz', nullable: true })
  updatedAt: Date | null;

  /** Set when the note was created from session remarks. */
  @Index('uq_notes_session_id', { unique: true })
  @Column({ type: 'uuid', nullable: true })
  sessionId: string | null;

  @ManyToOne(() => Session, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'session_id' })
  session?: Session;
}
