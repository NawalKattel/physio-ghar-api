import { Therapist } from '../therapist.entity';

/** Therapist as returned by the API (spec: Schemas → Therapist). */
export class TherapistDto {
  id!: string;
  name!: string;
  email!: string;
  
  phone!: string;
 
  experienceYears!: number;
  specialization!: string;
  address!: string;

  isAvailable!: boolean;
  avatarUrl!: string | null;

  static from(t: Therapist): TherapistDto {
    return {
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      experienceYears: t.experienceYears,
      specialization: t.specialization,
      address: t.address,
      isAvailable: t.isAvailable,
      avatarUrl: t.avatarUrl,
    };
  }
}
