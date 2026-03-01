
import { resend } from './resend';

export async function sendVerificationEmail(toEmail: string, verificationUrl: string) {
  console.log('Sending via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Verify your email address — Van-Vert',
    template_id: 'fc9fb7dc-b701-4c91-a741-9d265779373e',
    variables: {
      verificationUrl: verificationUrl
    }
  });
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string) {
  console.log('Sending password reset via Resend to:', toEmail);
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Reset your password — Van-Vert',
    template_id: '77214652-f633-4be1-8e42-af6b3475351f',
    variables: {
      resetUrl: resetUrl
    }
  });
}

export async function sendApplicationReceivedEmail(toEmail: string, name: string, applicationId: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: "We've received your application — Van-Vert",
    template_id: 'e95585d0-eddc-4e8c-9ecc-cda18da7319c',
    variables: { name, applicationId }
  });
}

export async function sendApplicationApprovedEmail(toEmail: string, name: string, dashboardUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your application has been approved — Van-Vert',
    template_id: '74b562ec-e410-47c6-a99c-48452768f607',
    variables: { name, dashboardUrl }
  });
}

export async function sendApplicationRejectedEmail(toEmail: string, name: string, rejectionReason: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Update on your application — Van-Vert',
    template_id: 'bf34a034-6fd2-4fc4-b421-34951a4a61e7',
    variables: { name, rejectionReason }
  });
}

export async function sendApplicationNeedsMoreInfoEmail(toEmail: string, name: string, requiredInfo: string, dashboardUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Action required — additional documents needed — Van-Vert',
    template_id: '19e4cf87-cb05-4e98-a3ea-b61256e918ae',
    variables: { name, requiredInfo, dashboardUrl }
  });
}

export async function sendWelcomeEmail(toEmail: string, name: string, dashboardUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Welcome to Van-Vert ✈️',
    template_id: '99a00527-678f-47fb-91d0-411325431790',
    variables: { name, dashboardUrl }
  });
}

export async function sendPasswordChangedEmail(toEmail: string, name: string, changedAt: string, resetUrl: string) {
  await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: toEmail,
    subject: 'Your password has been changed — Van-Vert',
    template_id: '12da407c-40bf-4134-83af-85c98eda7853',
    variables: { name, changedAt, resetUrl }
  });
}
