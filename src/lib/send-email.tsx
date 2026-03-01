
import { resend } from './resend';

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  console.log('Sending via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Verify your email address — Van-Vert',
    template_id: 'fc9fb7dc-b701-4c91-a741-9d265779373e',
    variables: {
      verificationUrl: verificationUrl
    }
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  console.log('Sending password reset via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Reset your password — Van-Vert',
    template_id: '77214652-f633-4be1-8e42-af6b3475351f',
    variables: {
      resetUrl: resetUrl
    }
  });
}
