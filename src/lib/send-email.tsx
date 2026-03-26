import { resend } from './resend';

/**
 * DEFAULT SENDER:
 * To send from a custom domain like 'vanvert.co', you must verify the domain in your Resend dashboard.
 */
const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export { sendVerificationEmail } from './emails/verification-email';

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Reset your password — Van-Vert',
      template: {
        id: 'password-reset-email',
        variables: { reset_url: resetUrl },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Password reset email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending password reset email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationReceivedEmail(toEmail: string, name: string, applicationId: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: "We've received your application — Van-Vert",
      template: {
        id: 'application-status-email',
        variables: {
          name,
          status: 'Received',
          dashboard_url: `https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/applications/${applicationId}`,
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Application received email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application received email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationApprovedEmail(toEmail: string, name: string, dashboardUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your application has been approved — Van-Vert',
      template: {
        id: 'application-status-email',
        variables: {
          name,
          status: 'Approved',
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Application approved email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application approved email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationRejectedEmail(toEmail: string, name: string, rejectionReason: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Update on your application — Van-Vert',
      template: {
        id: 'application-status-email',
        variables: {
          name,
          status: 'Rejected',
          feedback: rejectionReason,
          dashboard_url: 'https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/dashboard',
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Application rejected email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application rejected email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationNeedsMoreInfoEmail(toEmail: string, name: string, requiredInfo: string, dashboardUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Action required — additional documents needed — Van-Vert',
      template: {
        id: 'application-status-email',
        variables: {
          name,
          status: 'Needs More Information',
          feedback: requiredInfo,
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Application needs more info email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending application needs more info email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendWelcomeEmail(toEmail: string, name: string, dashboardUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Welcome to Van-Vert ✈️',
      template: {
        id: 'welcome-email',
        variables: {
          name,
          dashboard_url: dashboardUrl,
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Welcome email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending welcome email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendPasswordChangedEmail(toEmail: string, name: string, changedAt: string, resetUrl: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: toEmail,
      subject: 'Your password has been changed — Van-Vert',
      template: {
        id: 'password-reset-email',
        variables: {
          name,
          changed_at: changedAt,
          reset_url: resetUrl,
        },
      },
    });

    if (error) throw new Error(error.message);

    console.log(`✅ Password changed email sent successfully to ${toEmail}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Error sending password changed email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}
