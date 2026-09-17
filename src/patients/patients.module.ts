import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Note } from '../notes/note.entity';
import { Session } from '../sessions/session.entity';
import { SessionsModule } from '../sessions/sessions.module';
import { TherapistsModule } from '../therapists/therapists.module';
import { Patient } from './patient.entity';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Patient, Session, Note]),
    SessionsModule,
    TherapistsModule,
  ],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
