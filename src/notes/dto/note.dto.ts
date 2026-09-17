import { formatInZone, formatNullableInZone } from '../../common/time/time';
import { Note } from '../note.entity';

export class NoteDto {
  id: string;
  patientId: string;
  title: string;
  body: string;
  createdAt: string;

  updatedAt: string | null;

  sessionId: string | null;

  static from(n: Note, tz: string): NoteDto {
    return {
      id: n.id,
      patientId: n.patientId,
      title: n.title,
      body: n.body,
      createdAt: formatInZone(n.createdAt, tz),
      updatedAt: formatNullableInZone(n.updatedAt, tz),
      sessionId: n.sessionId,
    };
  }
}

export class NoteListDto {
  notes: NoteDto[];
  nextCursor: string | null;
}
