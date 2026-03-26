import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
) {
  await resend.emails.send({
    from: 'Vanvert No-Reply <noreply@vanvert.co>',
    to: email,
    subject: 'Verify your email address — Van-Vert',
    template: 'fc9fb7dc-b701-4c91-a741-9d265779373e',
    params: {
      verificationUrl,
    },
  });
}
