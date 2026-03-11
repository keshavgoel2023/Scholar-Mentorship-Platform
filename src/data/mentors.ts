// Mentors are now stored in the database (profiles table)
// Use these UUIDs to reference mentors:

export const MENTOR_IDS = {
  PRIYA_SHARMA: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  ARJUN_PATEL: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  ANJALI_REDDY: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  RAHUL_KUMAR: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  SNEHA_GUPTA: 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
  VIKRAM_SINGH: 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c',
  MEERA_JOSHI: 'a7b8c9d0-e1f2-405b-4c5d-6e7f8a9b0c1d',
  KARTHIK_IYER: 'b8c9d0e1-f2a3-415c-5d6e-7f8a9b0c1d2e',
} as const;

// Mentor rates (in ₹)
export const MENTOR_RATES: Record<string, number> = {
  [MENTOR_IDS.PRIYA_SHARMA]: 2500,
  [MENTOR_IDS.ARJUN_PATEL]: 2000,
  [MENTOR_IDS.ANJALI_REDDY]: 2200,
  [MENTOR_IDS.RAHUL_KUMAR]: 2800,
  [MENTOR_IDS.SNEHA_GUPTA]: 2300,
  [MENTOR_IDS.VIKRAM_SINGH]: 2600,
  [MENTOR_IDS.MEERA_JOSHI]: 3000,
  [MENTOR_IDS.KARTHIK_IYER]: 2400,
};

export const getMentorRate = (mentorId: string): number => {
  return MENTOR_RATES[mentorId] || 2000;
};