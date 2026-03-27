/**
 * Barrel export for all email senders.
 * Each email has its own file in ./emails/ following a consistent pattern.
 */

export { sendVerificationEmail } from './emails/verification-email';
export { sendPasswordResetEmail } from './emails/password-reset-email';
export { sendPasswordChangedEmail } from './emails/password-changed-email';
export { sendWelcomeEmail } from './emails/welcome-email';
export { sendApplicationReceivedEmail } from './emails/application-received-email';
export { sendApplicationApprovedEmail } from './emails/application-approved-email';
export { sendApplicationRejectedEmail } from './emails/application-rejected-email';
export { sendApplicationNeedsMoreInfoEmail } from './emails/application-needs-info-email';
