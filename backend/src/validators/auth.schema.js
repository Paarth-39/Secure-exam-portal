const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name cannot exceed 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  role: z.enum(['STUDENT', 'TEACHER']) // ADMIN only via existing admin database updates
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid verification token'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
};
