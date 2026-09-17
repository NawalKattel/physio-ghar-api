import { formatInZone } from '../../common/time/time';
import { PatientDto } from '../../patients/dto/patient.dto';
import { Session, SessionStatus, VisitType } from '../session.entity';

export class SessionDto {
  id!:string;

  patient!:PatientDto;

  start!:string;
  durationMinutes!:number;
  treatment!:string;
  visitType!:VisitType;

  location!:string;
  status!:SessionStatus;

  remarks!:string | null;

  createdAt!:string;

  
  static from(s:Session, tz:string):SessionDto {
    return {
      id:s.id,
      patient:PatientDto.from(s.patient),
      start:formatInZone(s.startAt, tz),
      durationMinutes:s.durationMinutes,
      treatment:s.treatment,
      visitType:s.visitType,
      location:s.location,
      status:s.status,
      remarks:s.remarks,
      createdAt:formatInZone(s.createdAt, tz),
    };
  }
}

export class SessionListDto {
  sessions!:SessionDto[];
  nextCursor!:string | null;
}
