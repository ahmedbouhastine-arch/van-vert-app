const FROM_EMAIL = 'Vanvert No-Reply <noreply@vanvert.co>';

export async function sendVerificationEmail(
  toEmail: string,
  verificationUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'MISSING_API_KEY') {
    console.error('❌ EMAIL ERROR: RESEND_API_KEY is missing from environment variables.');
    return { success: false, error: 'Resend API key is missing' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
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
