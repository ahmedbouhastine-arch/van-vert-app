import { resend } from '../resend';

/**
 * This file is maintained for compatibility but uses the unified logic
 * defined in src/lib/send-email.tsx.
 */

export async function sendVerificationEmail(
  email: string,
  verificationUrl: string
) {
  await (resend.emails as any).send({
    from: 'Vanvert No-Reply <noreply@vanvert.co>',
    to: email,
    subject: 'Verify your email address — Van-Vert',
    template: 'Yfc9fb7dc-b701-4c91-a741-9d265779373e',
    params: {
      verificationUrl,
    },
  });
}
