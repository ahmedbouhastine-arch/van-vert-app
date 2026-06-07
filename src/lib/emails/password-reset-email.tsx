import { resend } from '../resend';

const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendPasswordResetEmail(
    toEmail: string,
    resetUrl: string
) {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_EMAIL,
            to: toEmail,
            subject: 'Reset your password — Van-Vert',
            template: {
                id: '77214652-f633-4be1-8e42-af6b3475351f',
                variables: { reset_url: resetUrl },
            },
        });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, id: data?.id };
    } catch (err) {
        console.error('❌ Error sending password reset email:', err);
        return { success: false, error: err instanceof Error ? err.message : 'Internal error in email sender' };
    }
}
