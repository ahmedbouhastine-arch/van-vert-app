import { Button } from '@/components/ui/button';
import { Html } from '@react-email/html';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <div style={{ textAlign: 'center', fontFamily: 'sans-serif' }}>
        <img src="/icon.png" alt="App Logo" style={{ width: '100px', height: '100px' }} />
        <h1>Reset your password</h1>
        <p>Click the button below to reset your password.</p>
        <Button href={resetUrl}>Reset Password</Button>
        <p>This link will expire in 1 hour.</p>
        <hr />
        <p>If you need help, please contact our support team.</p>
      </div>
    </Html>
  );
}
