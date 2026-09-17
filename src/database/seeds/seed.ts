/**
 * Development data. Patients and booking requests come from the patient app in
 * production; this script stands in for it.
 *
 *   pnpm seed          → sign in as aarati.joshi@example.com / physio123
 *
 * A second therapist (suman.lama@example.com) owns separate patients and
 * sessions, so you can check that nothing leaks between accounts.
 */
import * as argon2 from 'argon2';
import { fromZonedTime } from 'date-fns-tz';
import { EntityManager } from 'typeorm';
import { addDays, localDate } from '../../common/time/time';
import { Complaint, ComplaintCategory, ComplaintStatus } from '../../complaints/complaint.entity';
import { Note } from '../../notes/note.entity';
import { Patient, PatientGender } from '../../patients/patient.entity';
import { Session, SessionStatus } from '../../sessions/session.entity';
import { Slot } from '../../slots/slot.entity';
import { Therapist } from '../../therapists/therapist.entity';
import dataSource from '../data-source';

const TZ = 'Asia/Kathmandu';
const PASSWORD = 'physio123';
const PRIMARY_EMAIL = 'aarati.joshi@example.com';

const WORK_HOURS = [9, 10, 11, 12, 14, 15, 16, 17];
const LUNCH_HOUR = 13;
/** Saturday. */
const DAY_OFF = 6;
const HISTORY_DAYS = 28;
const FUTURE_DAYS = 14;

const at = (day: string, hour: number) =>
  fromZonedTime(`${day}T${String(hour).padStart(2, '0')}:00:00`, TZ);

const isDayOff = (day: string) =>
  new Date(`${day}T00:00:00Z`).getUTCDay() === DAY_OFF;

/** Deterministic pseudo-random, so repeated seeds of a fresh database match. */
function random(seed: number) {
  let state = seed;
  return {
    next: () => (state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31,
    pick: <T>(items: readonly T[]): T =>
      items[Math.floor(((state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31) * items.length)],
  };
}

interface PatientSeed {
  name: string;
  age: number;
  gender: PatientGender;
  phone: string;
  address: string;
  condition: string;
  treatment: string;
  treatmentPlan: string;
}

const PRIMARY_PATIENTS: PatientSeed[] = [
  {
    name: 'Sita Sharma', age: 42, gender: 'Female', phone: '9801234567',
    address: 'Baneshwor, Kathmandu', condition: 'Lower Back Pain', treatment: 'Back Pain',
    treatmentPlan: 'Core stabilisation, McKenzie extensions, posture education.',
  },
  {
    name: 'Ram Thapa', age: 58, gender: 'Male', phone: '9812345678',
    address: 'Pulchowk, Lalitpur', condition: 'Knee Osteoarthritis', treatment: 'Knee Rehab',
    treatmentPlan: 'Quadriceps strengthening, range of motion, gait training.',
  },
  {
    name: 'Anjali Gurung', age: 29, gender: 'Female', phone: '9823456789',
    address: 'Jawalakhel, Lalitpur', condition: 'ACL Reconstruction Rehab', treatment: 'ACL Rehab',
    treatmentPlan: 'Post-op week 8: closed-chain strengthening, balance work.',
  },
  {
    name: 'Bikash Rai', age: 35, gender: 'Male', phone: '9845678901',
    address: 'Kalanki, Kathmandu', condition: 'Frozen Shoulder', treatment: 'Shoulder Mobility',
    treatmentPlan: 'Joint mobilisation, pendulum and wall-climb exercises.',
  },
  {
    name: 'Kamala Shrestha', age: 64, gender: 'Female', phone: '9856789012',
    address: 'Chabahil, Kathmandu', condition: 'Post-Stroke Hemiparesis', treatment: 'Neuro Rehab',
    treatmentPlan: 'Task-specific training for left arm, sit-to-stand practice.',
  },
  {
    name: 'Prakash Adhikari', age: 47, gender: 'Male', phone: '9867890123',
    address: 'Koteshwor, Kathmandu', condition: 'Cervical Spondylosis', treatment: 'Neck Pain',
    treatmentPlan: 'Isometric neck strengthening, traction, workstation advice.',
  },
  {
    name: 'Nisha Maharjan', age: 31, gender: 'Female', phone: '9878901234',
    address: 'Kirtipur, Kathmandu', condition: 'Postnatal Pelvic Floor Weakness', treatment: 'Postnatal Rehab',
    treatmentPlan: 'Pelvic floor retraining, diastasis recti management.',
  },
  {
    name: 'Deepak Tamang', age: 24, gender: 'Male', phone: '9889012345',
    address: 'Thimi, Bhaktapur', condition: 'Ankle Sprain (Grade II)', treatment: 'Ankle Rehab',
    treatmentPlan: 'Proprioception drills, calf strengthening, return-to-sport plan.',
  },
  {
    name: 'Sunita Karki', age: 52, gender: 'Female', phone: '9790123456',
    address: 'Maharajgunj, Kathmandu', condition: 'Adhesive Capsulitis', treatment: 'Shoulder Mobility',
    treatmentPlan: 'Capsular stretching, scapular control, heat before exercise.',
  },
  {
    name: 'Hari Bahadur Basnet', age: 71, gender: 'Male', phone: '9801112233',
    address: 'Bhaktapur Durbar Square', condition: 'Balance Impairment (Falls Risk)', treatment: 'Balance Training',
    treatmentPlan: 'Otago programme, home hazard review, walking aid assessment.',
  },
  {
    name: 'Rekha Poudel', age: 38, gender: 'Female', phone: '9812223344',
    address: 'Sanepa, Lalitpur', condition: 'Plantar Fasciitis', treatment: 'Foot Pain',
    treatmentPlan: 'Plantar fascia stretching, night splint, footwear review.',
  },
  {
    name: 'Milan Shakya', age: 45, gender: 'Male', phone: '9823334455',
    address: 'Patan Dhoka, Lalitpur', condition: 'Lumbar Disc Herniation', treatment: 'Back Pain',
    treatmentPlan: 'Neural mobilisation, graded activity, lifting technique.',
  },
];

const SECONDARY_PATIENTS: PatientSeed[] = [
  {
    name: 'Gita Lama', age: 33, gender: 'Female', phone: '9834445566',
    address: 'Boudha, Kathmandu', condition: 'Tennis Elbow', treatment: 'Elbow Rehab',
    treatmentPlan: 'Eccentric wrist extensor loading, activity modification.',
  },
  {
    name: 'Suresh Bhandari', age: 61, gender: 'Male', phone: '9845556677',
    address: 'Gongabu, Kathmandu', condition: 'COPD Deconditioning', treatment: 'Pulmonary Rehab',
    treatmentPlan: 'Breathing control, interval walking, energy conservation.',
  },
];

const REMARKS = [
  'Pain reduced from 6/10 to 4/10. Continue the home exercise programme.',
  'Flexion improved to 100°. Progress to resisted strengthening next visit.',
  'Tolerated 20 minutes of gait training without support. Encouraged daily walks.',
  'Single-leg balance held 30 seconds. Added lunges to the programme.',
  'Mild soreness after last session; reduced load and added heat before exercise.',
  'Good adherence to home exercises. Range of motion now near full.',
  'Swelling settled. Cleared for light jogging on even ground.',
  'Reviewed workstation setup; advised hourly breaks and monitor height change.',
];

const EXTRA_NOTES: { title: string; body: string }[] = [
  { title: 'Ergonomics', body: 'Advised a lumbar roll for the office chair and hourly standing breaks.' },
  { title: 'Home programme', body: 'Printed the exercise sheet: 3 sets of 10, twice daily, stop if sharp pain.' },
  { title: 'Referral', body: 'Suggested an orthopaedic review if night pain persists beyond two weeks.' },
  { title: 'Progress review', body: 'Four sessions in: function improved, pain down, continue fortnightly.' },
  { title: 'Footwear', body: 'Recommended cushioned shoes with arch support for daily wear.' },
];

const COMPLAINTS: {
  category: ComplaintCategory;
  subject: string;
  description: string;
  status: ComplaintStatus;
}[] = [
  {
    category: 'booking', subject: 'Duplicate booking request', status: 'in_review',
    description: 'The same patient sent two requests for the same time slot on Sunday morning.',
  },
  {
    category: 'technical', subject: 'App froze on schedule', status: 'submitted',
    description: 'The schedule screen stopped responding when I added a slot for next week.',
  },
  {
    category: 'payment', subject: 'Payout missing for last week', status: 'resolved',
    description: 'Payout for the week of home visits has not arrived; four sessions were completed.',
  },
  {
    category: 'patient', subject: 'Repeated no-shows', status: 'submitted',
    description: 'One patient has missed three booked sessions without cancelling in advance.',
  },
  {
    category: 'other', subject: 'Request for clinic parking pass', status: 'submitted',
    description: 'Parking near the Jhamsikhel clinic is difficult before morning appointments.',
  },
];

async function seedTherapist(
  m: EntityManager,
  therapist: Therapist,
  patientSeeds: PatientSeed[],
  rand: ReturnType<typeof random>,
): Promise<{ slots: number; sessions: number; notes: number }> {
  const patients = await m.save(
    m.create(
      Patient,
      patientSeeds.map((p) => ({
        name: p.name, age: p.age, gender: p.gender, phone: p.phone,
        address: p.address, condition: p.condition, treatmentPlan: p.treatmentPlan,
      })),
    ),
  );
  const treatmentOf = new Map(patients.map((p, i) => [p.id, patientSeeds[i].treatment]));
  const today = localDate(new Date(), TZ);

  // Slots across the whole window, minus the day off. Lunch is blocked from today on.
  const slots: Partial<Slot>[] = [];
  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const day = addDays(today, offset);
    if (isDayOff(day)) continue;
    for (const hour of [...WORK_HOURS, LUNCH_HOUR]) {
      slots.push({
        therapistId: therapist.id,
        startAt: at(day, hour),
        durationMinutes: 60,
        isBlocked: hour === LUNCH_HOUR && offset >= 0,
      });
    }
  }
  await m.save(m.create(Slot, slots));

  const sessions: Partial<Session>[] = [];
  const addSession = (
    patient: Patient,
    day: string,
    hour: number,
    status: SessionStatus,
    extra: Partial<Session> = {},
  ) => {
    const home = hour < 12;
    sessions.push({
      therapistId: therapist.id,
      patientId: patient.id,
      startAt: at(day, hour),
      durationMinutes: 60,
      treatment: treatmentOf.get(patient.id)!,
      visitType: home ? 'home' : 'clinic',
      location: home ? patient.address : 'PhysioGhar Clinic, Jhamsikhel',
      status,
      remarks: null,
      declineReason: null,
      ...extra,
    });
  };

  for (let offset = -HISTORY_DAYS; offset <= FUTURE_DAYS; offset++) {
    const day = addDays(today, offset);
    if (isDayOff(day)) continue;

    // Two to four bookings a day, each on its own hour.
    const hours = [...WORK_HOURS].filter(() => rand.next() > 0.55).slice(0, 4);
    for (const hour of hours.length >= 2 ? hours : WORK_HOURS.slice(0, 3)) {
      const patient = rand.pick(patients);
      if (offset < 0) {
        // Past: mostly completed, with the occasional cancellation.
        const cancelled = rand.next() > 0.85;
        addSession(patient, day, hour, cancelled ? 'cancelled' : 'completed', {
          remarks: cancelled ? null : rand.pick(REMARKS),
          declineReason: cancelled ? 'Patient rescheduled by phone' : null,
        });
      } else if (offset === 0) {
        // Today: earlier hours done, later hours still to come.
        addSession(patient, day, hour, hour <= 11 ? 'completed' : 'upcoming', {
          remarks: hour <= 11 ? rand.pick(REMARKS) : null,
        });
      } else {
        addSession(patient, day, hour, 'upcoming');
      }
    }
  }

  // Pending requests: future times with no session yet, so accept works on them.
  const booked = new Set(sessions.map((s) => (s.startAt as Date).getTime()));
  let requests = 0;
  for (let offset = 1; offset <= FUTURE_DAYS && requests < 6; offset++) {
    const day = addDays(today, offset);
    if (isDayOff(day)) continue;
    for (const hour of WORK_HOURS) {
      if (requests >= 6) break;
      if (booked.has(at(day, hour).getTime())) continue;
      addSession(rand.pick(patients), day, hour, 'request');
      booked.add(at(day, hour).getTime());
      requests++;
      break; // at most one request per day
    }
  }

  const saved = await m.save(m.create(Session, sessions));

  // Every completed session carries the note that /sessions/{id}/complete would write.
  const notes = await m.save(
    m.create(
      Note,
      saved
        .filter((s) => s.status === 'completed')
        .map((s) => ({
          therapistId: therapist.id,
          patientId: s.patientId,
          sessionId: s.id,
          title: 'Session Note',
          body: s.remarks!,
          updatedAt: null,
        })),
    ),
  );

  // A few standalone notes, as the app's "add note" screen would create.
  const standalone = await m.save(
    m.create(
      Note,
      EXTRA_NOTES.slice(0, Math.min(EXTRA_NOTES.length, patients.length)).map((n, i) => ({
        therapistId: therapist.id,
        patientId: patients[i].id,
        sessionId: null,
        title: n.title,
        body: n.body,
        updatedAt: i === 0 ? new Date() : null,
      })),
    ),
  );

  return {
    slots: slots.length,
    sessions: saved.length,
    notes: notes.length + standalone.length,
  };
}

async function seed(m: EntityManager): Promise<void> {
  if (await m.existsBy(Therapist, { email: PRIMARY_EMAIL })) {
    console.log(`Already seeded (${PRIMARY_EMAIL} exists). Nothing to do.`);
    return;
  }

  const passwordHash = await argon2.hash(PASSWORD);
  const [aarati, suman] = await m.save(
    m.create(Therapist, [
      {
        name: 'Dr. Aarati Joshi', email: PRIMARY_EMAIL, phone: '9841234567', passwordHash,
        experienceYears: 7, specialization: 'Orthopaedic & Sports Rehabilitation',
        address: 'Jhamsikhel, Lalitpur', isAvailable: true, timeZone: TZ,
      },
      {
        name: 'Dr. Suman Lama', email: 'suman.lama@example.com', phone: '9851112233', passwordHash,
        experienceYears: 12, specialization: 'Neurological & Cardiopulmonary Rehabilitation',
        address: 'Baluwatar, Kathmandu', isAvailable: false, timeZone: TZ,
      },
    ]),
  );

  const primary = await seedTherapist(m, aarati, PRIMARY_PATIENTS, random(20260916));
  const secondary = await seedTherapist(m, suman, SECONDARY_PATIENTS, random(99));

  await m.save(
    m.create(
      Complaint,
      COMPLAINTS.map((c) => ({ therapistId: aarati.id, ...c })),
    ),
  );

  console.log(
    [
      `Seeded ${PRIMARY_PATIENTS.length} patients, ${primary.slots} slots, ` +
        `${primary.sessions} sessions and ${primary.notes} notes for ${aarati.name}.`,
      `Plus a second therapist (${suman.name}) with ${SECONDARY_PATIENTS.length} patients, ` +
        `${secondary.sessions} sessions — useful for checking data stays scoped.`,
      `Complaints: ${COMPLAINTS.length}.`,
      ``,
      `Sign in: ${PRIMARY_EMAIL} / ${PASSWORD}  (or suman.lama@example.com / ${PASSWORD})`,
    ].join('\n'),
  );
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await dataSource.transaction(seed);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
