import { z } from "zod";

export const createAppointmentSchema = z.object({
  serviceId: z.number().int().positive(),
  staffId: z.number().int().positive(),
  startTime: z.string().datetime({ offset: true }),
  notes: z.string().trim().max(1000).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  startTime: z.string().datetime({ offset: true }),
});
