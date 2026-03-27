import { resend } from '../resend';

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
          dashboard_url: `https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/applications/${applicationId}`,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log(`✅ Application received email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application received email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}
