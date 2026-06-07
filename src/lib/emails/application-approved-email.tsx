import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendApplicationApprovedEmail(
  toEmail: string,
  name: string,
  dashboardUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your application has been approved — Van-Vert',
      template: {
        id: '74b562ec-e410-47c6-a99c-48452768f607',
        variables: {
          name,
          status: 'Approved',
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending application approved email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
