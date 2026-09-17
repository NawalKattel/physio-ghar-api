import { invalidSessionStatus } from '../common/errors/errors';
import { SessionStatus } from './session.entity';


const TRANSITIONS = {
  accept: { from: 'request', to: 'upcoming' },
  decline: { from: 'request', to: 'cancelled' },
  complete: { from: 'upcoming', to: 'completed' },
  reschedule: { from: 'upcoming', to: 'upcoming' },
} as const satisfies Record<string, { from: SessionStatus; to: SessionStatus }>;

export type SessionAction = keyof typeof TRANSITIONS;

const MESSAGES: Record<SessionAction, string> = {
  accept: 'This session is no longer a request.',
  decline: 'This session is no longer a request.',
  complete: 'Only upcoming sessions can be completed.',
  reschedule: 'Only upcoming sessions can be rescheduled.',
};


export function transition(current: SessionStatus, action: SessionAction): SessionStatus {
  const rule = TRANSITIONS[action];
  if (current !== rule.from) throw invalidSessionStatus(MESSAGES[action]);
  return rule.to;
}
