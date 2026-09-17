export const SLOT_STATES = ['open', 'booked', 'blocked'] as const;
export type SlotState = (typeof SLOT_STATES)[number];

export class SlotSessionDto {
  id!:string;
  patientName!:string;
  treatment!:string;
}

export class SlotDto {
  id!:string;

  start!:string;
  durationMinutes!:number;

  state!:SlotState;

  session!:SlotSessionDto | null;
}

export class SlotCountsDto {
  open!:number;
  booked!:number;
  blocked!:number;
}

export class SlotDayDto {

  date!:string;
  counts!:SlotCountsDto;
  slots!:SlotDto[];
}

export class SlotDaysDto {
  days!:SlotDayDto[];
}
