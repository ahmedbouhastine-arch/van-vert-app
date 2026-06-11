import { VvLegalShell, VvLegalContent, type VvLegalSection } from "@/components/vv/VvLegalShell";

const sections: VvLegalSection[] = [
  {
    id: "infrastructure",
    title: "Infrastructure",
    body: (
      <>
        <p>
          Van-Vert runs on Google Cloud Platform in the EU-West region. All
          compute, storage and networking are provisioned within a dedicated VPC
          with no public internet exposure except through our edge load
          balancers.
        </p>
        <p>
          Infrastructure is defined as code and deployed through a CI/CD
          pipeline with mandatory peer review. Production access requires
          multi-factor authentication and is restricted to a small on-call
          engineering team.
        </p>
      </>
    ),
  },
  {
    id: "encryption",
    title: "Encryption",
    body: (
      <>
        <p>
          All data in transit is protected by TLS 1.3. All data at rest —
          including uploaded documents, database records and backups — is
          encrypted with AES-256 using keys managed by Google Cloud KMS.
        </p>
        <p>
          Document uploads are encrypted client-side before transmission and
          stored in a dedicated, access-controlled storage bucket. Decryption
          keys are never exposed to application code at runtime.
        </p>
      </>
    ),
  },
  {
    id: "access-control",
    title: "Access control",
    body: (
      <>
        <p>
          The platform enforces role-based access control at every layer. Pilots
          see only their own applications. Reviewers see only applications
          assigned to them. Admins and head admins have progressively broader
          access, with all actions recorded in an immutable audit log.
        </p>
        <p>
          Internal staff access to production data requires VPN, hardware
          security key, and manager approval via a just-in-time access system
          with automatic expiry.
        </p>
      </>
    ),
  },
  {
    id: "audits-certifications",
    title: "Audits & certifications",
    body: (
      <>
        <p>
          Van-Vert holds a current SOC 2 Type II report covering Security,
          Availability and Confidentiality. We engage an independent third-party
          penetration testing firm on a quarterly basis, and run a continuous bug
          bounty program for critical-severity findings.
        </p>
        <p>
          Audit reports and penetration test summaries are available under NDA.
          Contact{" "}
          <a href="mailto:security@vanvert.co" className="text-sky hover:text-navy">security@vanvert.co</a>.
        </p>
      </>
    ),
  },
  {
    id: "incident-response",
    title: "Incident response",
    body: (
      <>
        <p>
          We maintain a documented incident response plan with defined severity
          levels, escalation paths and communication timelines. Critical
          incidents trigger a response within 15 minutes. Affected users are
          notified within 72 hours as required by GDPR, or sooner when possible.
        </p>
        <p>
          Post-incident reviews are published internally and shared with affected
          customers on request.
        </p>
      </>
    ),
  },
  {
    id: "vulnerability-disclosure",
    title: "Vulnerability disclosure",
    body: (
      <>
        <p>
          If you discover a security vulnerability in Van-Vert, please report it
          to{" "}
          <a href="mailto:security@vanvert.co" className="text-sky hover:text-navy">security@vanvert.co</a>. We
          operate a coordinated disclosure program and acknowledge reports within
          24 hours.
        </p>
        <p>
          We ask that you give us reasonable time to investigate and fix the
          issue before public disclosure. We do not pursue legal action against
          researchers acting in good faith.
        </p>
      </>
    ),
  },
];

export default function SecurityPage() {
  return (
    <VvLegalShell activeHref="/security" title="Security" lastUpdated="May 12, 2026" kicker="Authority">
      <VvLegalContent sections={sections} />
    </VvLegalShell>
  );
}
