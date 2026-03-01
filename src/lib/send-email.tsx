import { resend } from './resend';
import VerificationEmail from './emails/verification-email';
import PasswordResetEmail from './emails/password-reset-email';

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  console.log('Sending via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Verify your email address',
    react: <VerificationEmail verificationUrl={verificationUrl} />
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  console.log('Sending password reset via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Reset your password',
    react: <PasswordResetEmail resetUrl={resetUrl} />
  });
}
