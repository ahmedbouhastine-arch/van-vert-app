import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Link,
  Hr,
  Heading,
} from '@react-email/components';
import * as React from 'react';

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  border: '1px solid #e6ebf1',
};

const box = {
  padding: '0 48px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const paragraph = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
};

const button = {
  backgroundColor: '#2563eb',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '100%',
  padding: '12px',
  marginTop: '24px',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '24px',
};

interface VerificationEmailProps {
  verificationUrl: string;
}

export const VerificationEmailTemplate = ({ verificationUrl }: VerificationEmailProps) => (
  <Html>
    <Head />
    <Preview>Verify your email address for Van-Vert</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Verify your email</Heading>
          <Text style={paragraph}>
            Welcome to Van-Vert! To complete your registration and start your pilot license conversion, please verify your email address.
          </Text>
          <Link style={button} href={verificationUrl}>
            Verify Email Address
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            If you didn't request this email, you can safely ignore it.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

interface WelcomeEmailProps {
  name: string;
  dashboardUrl: string;
}

export const WelcomeEmailTemplate = ({ name, dashboardUrl }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>Welcome to the future of aviation licensing</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Welcome, {name}!</Heading>
          <Text style={paragraph}>
            We're thrilled to have you on board. Van-Vert is designed to make your pilot license conversion process as smooth as possible.
          </Text>
          <Link style={button} href={dashboardUrl}>
            Go to My Dashboard
          </Link>
          <Hr style={hr} />
          <Text style={footer}>
            Van-Vert — Built for the modern aviator.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

interface PasswordResetEmailProps {
  resetUrl: string;
}

export const PasswordResetEmailTemplate = ({ resetUrl }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your Van-Vert password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Reset your password</Heading>
          <Text style={paragraph}>
            We received a request to reset your password. Click the button below to choose a new one.
          </Text>
          <Link style={button} href={resetUrl}>
            Reset Password
          </Link>
          <Text style={paragraph}>
            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </Text>
          <Hr style={hr} />
        </Section>
      </Container>
    </Body>
  </Html>
);

interface ApplicationStatusEmailProps {
  name: string;
  status: string;
  feedback?: string;
  dashboardUrl: string;
}

export const ApplicationStatusEmailTemplate = ({ name, status, feedback, dashboardUrl }: ApplicationStatusEmailProps) => (
  <Html>
    <Head />
    <Preview>Update on your application — Van-Vert</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={box}>
          <Heading style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Application Update</Heading>
          <Text style={paragraph}>
            Hello {name}, your application status has been updated to: <strong>{status}</strong>.
          </Text>
          {feedback && (
            <Section style={{ backgroundColor: '#f9fafb', padding: '16px', borderRadius: '8px', marginBottom: '24px' }}>
              <Text style={{ ...paragraph, margin: 0 }}><strong>Administrator Feedback:</strong></Text>
              <Text style={{ ...paragraph, fontStyle: 'italic' }}>{feedback}</Text>
            </Section>
          )}
          <Link style={button} href={dashboardUrl}>
            View Application Details
          </Link>
          <Hr style={hr} />
        </Section>
      </Container>
    </Body>
  </Html>
);
