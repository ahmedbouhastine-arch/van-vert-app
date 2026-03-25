import { resend } from './resend';
import * as React from 'react';
import { 
  VerificationEmailTemplate, 
  WelcomeEmailTemplate, 
  PasswordResetEmailTemplate, 
  ApplicationStatusEmailTemplate 
} from './emails/templates';

/**
 * DEFAULT SENDER:
 * To send from a custom domain like 'vanvert.co', you must verify the domain in your Resend dashboard.
 * If the domain is not verified, Resend will reject the request.
 */
const FROM_EMAIL = 'Van-Vert <noreply@vanvert.co>';

async function sendEmail(options: { to: string; subject: string; react: React.ReactElement }) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    console.error('❌ EMAIL ERROR: RESEND_API_KEY is missing from environment variables.');
    return { success: false, error: 'Resend API key is missing' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      console.error('❌ Resend API Error:', JSON.stringify(error, null, 2));
      return { success: false, error: error.message };
    }

    console.log(`✅ Email sent successfully: "${options.subject}" to ${options.to}`);
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
    react: <VerificationEmailTemplate verificationUrl={verificationUrl} />,
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Reset your password — Van-Vert',
    react: <PasswordResetEmailTemplate resetUrl={resetUrl} />,
  });
}

export async function sendApplicationReceivedEmail(toEmail: string, name: string, applicationId: string) {
  return sendEmail({
    to: toEmail,
    subject: "We've received your application — Van-Vert",
    react: <ApplicationStatusEmailTemplate 
      name={name} 
      status="Received" 
      dashboardUrl={`https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/applications/${applicationId}`} 
    />,
  });
}

export async function sendApplicationApprovedEmail(toEmail: string, name: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Your application has been approved — Van-Vert',
    react: <ApplicationStatusEmailTemplate name={name} status="Approved" dashboardUrl={dashboardUrl} />,
  });
}

export async function sendApplicationRejectedEmail(toEmail: string, name: string, rejectionReason: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Update on your application — Van-Vert',
    react: <ApplicationStatusEmailTemplate 
      name={name} 
      status="Rejected" 
      feedback={rejectionReason} 
      dashboardUrl="https://van-vert-app--REDACTED_FIREBASE_PROJECT_ID.europe-west4.hosted.app/dashboard" 
    />,
  });
}

export async function sendApplicationNeedsMoreInfoEmail(toEmail: string, name: string, requiredInfo: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Action required — additional documents needed — Van-Vert',
    react: <ApplicationStatusEmailTemplate 
      name={name} 
      status="Needs More Information" 
      feedback={requiredInfo} 
      dashboardUrl={dashboardUrl} 
    />,
  });
}

export async function sendWelcomeEmail(toEmail: string, name: string, dashboardUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Welcome to Van-Vert ✈️',
    react: <WelcomeEmailTemplate name={name} dashboardUrl={dashboardUrl} />,
  });
}

export async function sendPasswordChangedEmail(toEmail: string, name: string, changedAt: string, resetUrl: string) {
  return sendEmail({
    to: toEmail,
    subject: 'Your password has been changed — Van-Vert',
    react: <PasswordResetEmailTemplate resetUrl={resetUrl} />,
  });
}
