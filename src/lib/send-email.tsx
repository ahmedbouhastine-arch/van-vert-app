/**
 * DEFAULT SENDER:
 * To send from a custom domain like 'vanvert.co', you must verify the domain in your Resend dashboard.
 */
const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

function getResendHeaders(): { Authorization: string; 'Content-Type': string; } | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    console.error('❌ EMAIL ERROR: RESEND_API_KEY is missing from environment variables.');
    return null;
  }
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Verify your email address — Van-Vert',
        template_id: 'fc9fb7dc-b701-4c91-a741-9d265779373e',
        variables: { verificationUrl },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));
    
    console.log(`✅ Verification email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending verification email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Reset your password — Van-Vert',
        template_id: 'password-reset-email',
        variables: { resetUrl },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Password reset email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending password reset email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationReceivedEmail(toEmail: string, name: string, applicationId: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: "We've received your application — Van-Vert",
        template_id: 'application-status-email',
        variables: {
          name,
          status: 'Received',
          dashboardUrl: `https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/applications/${applicationId}`,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Application received email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending application received email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationApprovedEmail(toEmail: string, name: string, dashboardUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Your application has been approved — Van-Vert',
        template_id: 'application-status-email',
        variables: {
          name,
          status: 'Approved',
          dashboardUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Application approved email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending application approved email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationRejectedEmail(toEmail: string, name: string, rejectionReason: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Update on your application — Van-Vert',
        template_id: 'application-status-email',
        variables: {
          name,
          status: 'Rejected',
          feedback: rejectionReason,
          dashboardUrl: 'https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/dashboard',
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Application rejected email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending application rejected email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendApplicationNeedsMoreInfoEmail(toEmail: string, name: string, requiredInfo: string, dashboardUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Action required — additional documents needed — Van-Vert',
        template_id: 'application-status-email',
        variables: {
          name,
          status: 'Needs More Information',
          feedback: requiredInfo,
          dashboardUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Application needs more info email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending application needs more info email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendWelcomeEmail(toEmail: string, name: string, dashboardUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Welcome to Van-Vert ✈️',
        template_id: 'welcome-email',
        variables: {
          name,
          dashboardUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Welcome email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending welcome email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendPasswordChangedEmail(toEmail: string, name: string, changedAt: string, resetUrl: string) {
  const headers = getResendHeaders();
  if (!headers) return { success: false, error: 'Resend API key is missing' };

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [toEmail],
        subject: 'Your password has been changed — Van-Vert',
        template_id: 'password-reset-email',
        variables: {
          name,
          changedAt,
          resetUrl,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || JSON.stringify(data));

    console.log(`✅ Password changed email sent successfully to ${toEmail}`);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('❌ Error sending password changed email:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}
