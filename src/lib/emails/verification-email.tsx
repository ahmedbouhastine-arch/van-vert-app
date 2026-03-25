import { Html, Body, Container, Section, Heading, Text, Link } from '@react-email/components';
import * as React from 'react';

interface VerificationEmailProps {
  verificationUrl: string;
}

export default function VerificationEmail({ verificationUrl }: VerificationEmailProps) {
  return (
    <Html>
      <Body style={{ backgroundColor: '#f6f9fc', fontFamily: 'sans-serif' }}>
        <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px', borderRadius: '8px' }}>
          <Section>
            <Heading style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a1a1a' }}>Verify your email</Heading>
            <Text style={{ fontSize: '16px', color: '#4a4a4a', lineHeight: '24px' }}>
              Welcome to Van-Vert! Click the button below to verify your email address and activate your pilot account.
            </Text>
            <Link 
              href={verificationUrl}
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
              Verify Email
            </Link>
            <Text style={{ fontSize: '12px', color: '#888888', marginTop: '32px', borderTop: '1px solid #eeeeee', paddingTop: '16px' }}>
              If you didn't sign up for Van-Vert, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
