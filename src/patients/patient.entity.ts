import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const PATIENT_GENDERS = ['Female', 'Male', 'Other'] as const;
export type PatientGender = (typeof PATIENT_GENDERS)[number];

/** Written by the patient app; read-only in the therapist API. */
@Entity('patients')
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Column({ type: 'smallint' })
  age: number;

  @Column({ type: 'varchar', length: 10 })
  gender: PatientGender;

  @Column({ type: 'varchar', length: 15 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 120 })
  condition: string;

  @Column({ type: 'text', default: '' })
  treatmentPlan: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
