import { Button } from '@/components/ui/button';
import { Html } from '@react-email/html';

interface VerificationEmailProps {
  verificationUrl: string;
}

export default function VerificationEmail({ verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
        <img src="/icon.png" alt="App Logo" style={{ width: '100px', height: '100px' }} />
        <h1>Verify your email address</h1>
        <p>Click the button below to verify your email address and complete your registration.</p>
        <Button href={verificationUrl}>Verify Email</Button>
        <hr />
        <p>If you need help, please contact our support team.</p>
      </div>
    </Html>
  );
}
