import { z } from 'zod';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const campaignCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'NAVERBLOG']),
  budget: z.number().positive(),
  targetFollowers: z.number().int().positive(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  requirements: z.string().optional(),
  hashtags: z.array(z.string()).optional(),
  maxApplicants: z.number().int().positive().default(100),
  rewardAmount: z.number().positive().default(0),
  location: z.string().default('전국'),
});

export const campaignUpdateSchema = campaignCreateSchema.partial();

export const applicationCreateSchema = z.object({
  campaignId: z.string().cuid(),
  message: z.string().min(1).max(1000),
  proposedPrice: z.number().positive().optional(),
});

export const contentSubmitSchema = z.object({
  applicationId: z.string().cuid(),
  contentUrl: z.string().url(),
  description: z.string().max(1000).optional(),
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'NAVERBLOG']),
});

export const paymentCreateSchema = z.object({
  campaignId: z.string().cuid().optional(),
  amount: z.number().positive(),
  type: z.string(),
  paymentMethod: z.string(),
});

// Validation helper
export async function validateRequest<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; errors: z.ZodError }> {
  try {
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Format validation errors for API response
export function formatValidationErrors(errors: z.ZodError): Record<string, string[]> {
  const formatted: Record<string, string[]> = {};
  
  errors.errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = [];
    }
    formatted[path].push(error.message);
  });
  
  return formatted;
}