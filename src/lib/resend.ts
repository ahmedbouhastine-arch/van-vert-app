import { Resend } from 'resend';

// Initialize the Resend client. 
// Note: If the API key is missing, the client will still initialize but calls will fail with a 401.
// This is handled in the send-email logic to provide a better developer experience.
export const resend = new Resend(process.env.RESEND_API_KEY || 'MISSING_API_KEY');
