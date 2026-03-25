import { resend } from './resend';
import * as React from 'react';

/**
 * DEFAULT SENDER:
 * To send from a custom domain like 'vanvert.co', you must verify the domain in your Resend dashboard.
 */
const FROM_EMAIL = 'Van-Vert <noreply@vanvert.co>';

/**
 * sendEmail Wrapper
 * This now uses Resend's hosted templates instead of local React components.
 * The 'template' parameter refers to the template slug/name in your Resend dashboard.
 */
async function sendEmail(options: { to: string; subject: string; template: string; data: Record<string, any> }) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    console.error('❌ EMAIL ERROR: RESEND_API_KEY is missing from environment variables.');
    return { success: false, error: 'Resend API key is missing' };
  }

  try {
    // We call the Resend API using the 'template' property for hosted templates.
    // Ensure the template names/slugs match what you have in the Resend dashboard.
    const { data, error } = await (resend.emails as any).send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      template: options.template,
      data: options.data,
    });

    if (error) {
      console.error(`❌ Resend API Error (${options.template}):`, JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`✅ Hosted template "${options.template}" sent successfully to ${options.to}`);
    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('❌ Unexpected error in sendEmail wrapper:', err);
    return { success: false, error: err.message || 'Internal error in email sender' };
  }
}

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Verify your email address — Van-Vert',
    template: 'verification-email',
    data: {
      verificationUrl,
    },
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Reset your password — Van-Vert',
    template: 'password-reset-email',
    data: {
      resetUrl,
    },
  });
}

export async function sendApplicationReceivedEmail(toEmail: string, name: string, applicationId: string) {
  return sendEmail({
    to: toEmail,
    subject: "We've received your application — Van-Vert",
    template: 'application-status-email',
    data: {
      name,
      status: 'Received',
      dashboardUrl: `https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/applications/${applicationId}`,
    },
  });
}

export async function sendApplicationApprovedEmail(toEmail: string, name: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Your application has been approved — Van-Vert',
    template: 'application-status-email',
    data: {
      name,
      status: 'Approved',
      dashboardUrl,
    },
  });
}

export async function sendApplicationRejectedEmail(toEmail: string, name: string, rejectionReason: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Update on your application — Van-Vert',
    template: 'application-status-email',
    data: {
      name,
      status: 'Rejected',
      feedback: rejectionReason,
      dashboardUrl: 'https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/dashboard',
    },
  });
}

export async function sendApplicationNeedsMoreInfoEmail(toEmail: string, name: string, requiredInfo: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Action required — additional documents needed — Van-Vert',
    template: 'application-status-email',
    data: {
      name,
      status: 'Needs More Information',
      feedback: requiredInfo,
      dashboardUrl,
    },
  });
}

export async function sendWelcomeEmail(toEmail: string, name: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Welcome to Van-Vert ✈️',
    template: 'welcome-email',
    data: {
      name,
      dashboardUrl,
    },
  });
}

export async function sendPasswordChangedEmail(toEmail: string, name: string, changedAt: string, resetUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Your password has been changed — Van-Vert',
    template: 'password-reset-email',
    data: {
      name,
      changedAt,
      resetUrl,
    },
  });
}
