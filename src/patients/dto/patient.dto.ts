import { Patient, PatientGender } from '../patient.entity';

export class PatientDto {
  id: string;
  name: string;
  age: number;

  gender: PatientGender;
  phone: string;
  address: string;

  condition: string;
  treatmentPlan: string;

  static from(p: Patient): PatientDto {
    return {
      id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      address: p.address,
      condition: p.condition,
      treatmentPlan: p.treatmentPlan,
    };
  }
}
