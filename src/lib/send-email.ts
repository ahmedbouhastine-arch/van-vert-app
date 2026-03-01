import { resend } from './resend';
import VerificationEmail from './emails/verification-email';
import PasswordResetEmail from './emails/password-reset-email';

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Verify your email address',
    react: <VerificationEmail verificationUrl={verificationUrl} />
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Reset your password',
    react: <PasswordResetEmail resetUrl={resetUrl} />
  });
}
