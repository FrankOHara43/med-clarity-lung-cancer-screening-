import { z } from 'zod';

/**
 * Patient registration validator
 */
export const patientRegistrationSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  age: z
    .number()
    .min(0, 'Age must be positive')
    .max(150, 'Age must be valid'),
  gender: z.enum(['male', 'female', 'other'], {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  symptoms: z
    .array(z.string().min(1, 'Symptom cannot be empty'))
    .min(1, 'Please select at least one symptom')
    .max(10, 'Maximum 10 symptoms allowed'),
  medicalHistory: z
    .string()
    .max(1000, 'Medical history must not exceed 1000 characters')
    .optional(),
  allergies: z
    .array(z.string())
    .max(10, 'Maximum 10 allergies allowed')
    .optional(),
  currentMedications: z
    .array(z.string())
    .max(20, 'Maximum 20 medications allowed')
    .optional(),
});

/**
 * Patient update validator
 */
export const patientUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters')
    .optional(),
  age: z
    .number()
    .min(0, 'Age must be positive')
    .max(150, 'Age must be valid')
    .optional(),
  symptoms: z
    .array(z.string().min(1))
    .max(10, 'Maximum 10 symptoms allowed')
    .optional(),
  medicalHistory: z
    .string()
    .max(1000, 'Medical history must not exceed 1000 characters')
    .optional(),
  allergies: z
    .array(z.string())
    .max(10, 'Maximum 10 allergies allowed')
    .optional(),
  currentMedications: z
    .array(z.string())
    .max(20, 'Maximum 20 medications allowed')
    .optional(),
  diagnosisStatus: z
    .enum(['pending', 'in-progress', 'completed', 'reviewed'])
    .optional(),
});

/**
 * Type definitions derived from validators
 */
export type PatientRegistrationInput = z.infer<typeof patientRegistrationSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;

/**
 * Validation helper function
 */
export const validatePatientRegistration = (data: unknown) => {
  return patientRegistrationSchema.safeParse(data);
};

/**
 * Validation helper function for updates
 */
export const validatePatientUpdate = (data: unknown) => {
  return patientUpdateSchema.safeParse(data);
};
