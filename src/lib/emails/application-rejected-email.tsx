import { resend } from '../resend';
import { BASE_URL } from '../utils';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendApplicationRejectedEmail(
  toEmail: string,
  name: string,
  rejectionReason: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Update on your application — Van-Vert',
      template: {
        id: 'bf34a034-6fd2-4fc4-b421-34951a4a61e7',
        variables: {
          name,
          status: 'Rejected',
          feedback: rejectionReason,
          dashboard_url: `${BASE_URL}/dashboard`,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Application rejected email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending application rejected email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
