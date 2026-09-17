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


@Entity('slots')
@Index('uq_slots_therapist_start', ['therapistId', 'startAt'], { unique:true })
export class Slot {
  @PrimaryGeneratedColumn('uuid')
  id!:string;

  @Column({ type:'uuid' })
  therapistId!:string;

  @ManyToOne(() => Therapist, { onDelete:'CASCADE' })
  @JoinColumn({ name:'therapist_id' })
  therapist?:Therapist;

  @Column({ type:'timestamptz' })
  startAt!:Date;

  @Column({ type:'smallint', default:60 })
  durationMinutes!:number;

  @Column({ type:'boolean', default:false })
  isBlocked!:boolean;

  @CreateDateColumn({ type:'timestamptz' })
  createdAt!:Date;
}
