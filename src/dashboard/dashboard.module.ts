import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../sessions/session.entity';
import { TherapistsModule } from '../therapists/therapists.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), TherapistsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
