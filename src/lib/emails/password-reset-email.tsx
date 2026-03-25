import { Html, Body, Container, Section, Heading, Text, Link } from '@react-email/components';
import * as React from 'react';

interface PasswordResetEmailProps {
  resetUrl: string;
}

export default function PasswordResetEmail({ resetUrl }: PasswordResetEmailProps) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px', borderRadius: '8px' }}>
          <Section>
            <Heading style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>Reset your password</Heading>
            <Text style={{ fontSize: '16px', color: '#4a4a4a', lineHeight: '24px' }}>
              Click the button below to reset your password. This link will expire in 1 hour.
            </Text>
            <Link 
              href={resetUrl}
              style={{ 
                backgroundColor: '#2563eb', 
                color: '#ffffff', 
                padding: '12px 24px', 
                borderRadius: '4px', 
                textDecoration: 'none',
                display: 'inline-block',
                fontWeight: 'bold',
                marginTop: '16px'
              }}
            >
              Reset Password
            </Link>
            <Text style={{ fontSize: '12px', color: '#888888', marginTop: '32px', borderTop: '1px solid #eeeeee', paddingTop: '16px' }}>
              If you didn't request this, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
