import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendApplicationNeedsMoreInfoEmail(
  toEmail: string,
  name: string,
  requiredInfo: string,
  dashboardUrl: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Action required — additional documents needed — Van-Vert',
      template: {
        id: '19e4cf87-cb05-4e98-a3ea-b61256e918ae',
        variables: {
          name,
          status: 'Needs More Information',
          feedback: requiredInfo,
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Application needs more info email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application needs more info email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}
