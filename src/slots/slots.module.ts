import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TherapistsModule } from '../therapists/therapists.module';
import { Slot } from './slot.entity';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

@Module({
  imports: [TypeOrmModule.forFeature([Slot]), TherapistsModule],
  controllers: [SlotsController],
  providers: [SlotsService],
})
export class SlotsModule {}
