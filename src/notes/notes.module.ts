import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientsModule } from '../patients/patients.module';
import { TherapistsModule } from '../therapists/therapists.module';
import { Note } from './note.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), PatientsModule, TherapistsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
