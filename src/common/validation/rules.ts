// Field rules shared with the app (spec: "Validation rules").

export const PHONE_REGEX = /^(\+977)?9[78]\d{8}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const MESSAGES = {
  name: 'Enter your full name',
  phone: 'Enter a valid 10-digit mobile number',
  email: 'Enter a valid email address',
  password: 'Use at least 8 characters',
  experienceYears: 'Enter years of experience (0–50)',
  required: 'This field is required',
} as const;

/** Stored form of a phone number: the 10 local digits, without +977. */
export function normalizePhone(value: string): string {
  return value.replace(/^\+977/, '');
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
