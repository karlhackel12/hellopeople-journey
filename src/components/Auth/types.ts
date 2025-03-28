
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['student', 'teacher'], {
    required_error: 'Please select a role',
  }),
  invitationCode: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export type FormValues = LoginFormValues | RegisterFormValues | ForgotPasswordFormValues;

export interface InvitationData {
  email: string | null;
  code: string | null;
  isInvited: boolean;
}
