import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';
const ADMISSIONS_EMAIL = 'admissions@vanvert.co';

// These three senders differ from their siblings in this folder (e.g.
// application-needs-info-email.tsx): those reference pre-existing Resend
// *hosted dashboard templates* by UUID (`template: { id, variables }`),
// which is the preferred pattern for this project. No hosted template
// exists yet for these three notifications, so they send plain inline HTML
// via Resend's `html` field instead of leaving the recipient un-notified.
// Whoever manages the Resend dashboard can create matching templates later
// and swap these over to the `template` pattern, same as the others.

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendApplicationInReviewEmail(
  toEmail: string,
  name: string,
  applicationId: string,
  dashboardUrl: string,
  note?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your application is under review — Van-Vert',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p>Hi ${escapeHtml(name)},</p>
          <p>Your application is now under review by our admissions team.</p>
          ${note ? `<p style="padding:12px;background:#f8fafc;border-radius:6px;">${escapeHtml(note)}</p>` : ''}
          <p>You can check its status any time from your dashboard.</p>
          <p><a href="${dashboardUrl}">View your dashboard</a></p>
          <p style="color:#64748b;font-size:12px;">Application ID: ${escapeHtml(applicationId)}</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending application in-review email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}

export async function sendStaffNewApplicationAlertEmail(input: {
  applicantName: string;
  applicantEmail: string;
  licenseType: string;
  applicationId: string;
  dashboardUrl: string;
}) {
  const { applicantName, applicantEmail, licenseType, applicationId, dashboardUrl } = input;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMISSIONS_EMAIL,
      replyTo: applicantEmail,
      subject: `New application submitted — ${applicantName} (${licenseType})`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <p>A new application was just submitted.</p>
          <table cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 12px;color:#64748b;">Applicant</td><td style="padding:6px 12px;">${escapeHtml(applicantName)}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Email</td><td style="padding:6px 12px;">${escapeHtml(applicantEmail)}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">License type</td><td style="padding:6px 12px;">${escapeHtml(licenseType)}</td></tr>
          </table>
          <p><a href="${dashboardUrl}">Review this application</a></p>
          <p style="color:#64748b;font-size:12px;">Application ID: ${escapeHtml(applicationId)}</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending staff new-application alert email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}

export async function sendContactFormEmail(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const { name, email, subject, message } = input;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMISSIONS_EMAIL,
      replyTo: email,
      subject: `Website contact form — ${subject} (${name})`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <table cellpadding="0" cellspacing="0">
            <tr><td style="padding:6px 12px;color:#64748b;">Name</td><td style="padding:6px 12px;">${escapeHtml(name)}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Email</td><td style="padding:6px 12px;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:6px 12px;color:#64748b;">Subject</td><td style="padding:6px 12px;">${escapeHtml(subject)}</td></tr>
          </table>
          <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('❌ Error sending contact form email:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
  }
}
