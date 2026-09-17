import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeController } from './me.controller';
import { Therapist } from './therapist.entity';
import { TherapistsService } from './therapists.service';

@Module({
  imports: [TypeOrmModule.forFeature([Therapist])],
  controllers: [MeController],
  providers: [TherapistsService],
  exports: [TypeOrmModule, TherapistsService],
})
export class TherapistsModule {}
