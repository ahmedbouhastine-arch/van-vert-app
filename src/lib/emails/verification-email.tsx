import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendVerificationEmail(
  toEmail: string,
  verificationUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Verify your email address — Van-Vert',
      template: {
        id: 'fc9fb7dc-b701-4c91-a741-9d265779373e',
        variables: { verificationUrl: verificationUrl },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Verification email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending verification email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}
