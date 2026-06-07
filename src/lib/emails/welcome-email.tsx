import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendWelcomeEmail(
  toEmail: string,
  name: string,
  dashboardUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Welcome to Van-Vert ✈️',
      template: {
        id: '99a00527-678f-47fb-91d0-411325431790',
        variables: {
          name,
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending welcome email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
