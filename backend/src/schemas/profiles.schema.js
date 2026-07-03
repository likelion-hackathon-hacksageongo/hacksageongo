import { z } from "zod";

const genderSchema = z.enum(["male", "female", "prefer_not_to_say"]);

const mbtiSchema = z.enum([
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
  "unknown",
]);

const expectedGraduationSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "expectedGraduation must be YYYY-MM format.");

export const createProfileSchema = z.object({
  nickname: z.string().min(1).max(30),

  birthYear: z.number().int().min(1900).max(new Date().getFullYear()),

  school: z.string().max(100).optional().nullable(),
  department: z.string().max(100).optional().nullable(),

  gpa: z.number().min(0).max(4.5).optional().nullable(),

  gender: genderSchema,

  mbti: mbtiSchema.optional().default("unknown"),

  completedSemesters: z.number().int().min(0).max(16),

  expectedGraduation: expectedGraduationSchema,
});

export const updateProfileSchema = createProfileSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });
