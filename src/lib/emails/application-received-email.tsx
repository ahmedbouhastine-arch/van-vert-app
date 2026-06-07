import { resend } from '../resend';
import { BASE_URL } from '../utils';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendApplicationReceivedEmail(
  toEmail: string,
  name: string,
  applicationId: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: "We've received your application — Van-Vert",
      template: {
        id: 'e95585d0-eddc-4e8c-9ecc-cda18da7319c',
        variables: {
          name,
          status: 'Received',
          dashboard_url: `${BASE_URL}/applications/${applicationId}`,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending application received email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
