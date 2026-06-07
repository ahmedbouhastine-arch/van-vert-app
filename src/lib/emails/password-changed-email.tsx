import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendPasswordChangedEmail(
  toEmail: string,
  name: string,
  changedAt: string,
  resetUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your password has been changed — Van-Vert',
      template: {
        id: '12da407c-40bf-4134-83af-85c98eda7853',
        variables: {
          name,
          changed_at: changedAt,
          reset_url: resetUrl,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending password changed email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
