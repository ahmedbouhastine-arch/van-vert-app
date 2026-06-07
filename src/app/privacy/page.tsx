import { VvLegalShell, VvLegalContent, type VvLegalSection } from "@/components/vv/VvLegalShell";

const sections: VvLegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          Van-Vert is operated by Vanguard Aviation Academy (&ldquo;VAA&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;), a licensed
          aviation training organization registered in the European Union. Our registered address and data
          protection contact are listed at the bottom of this page.
        </p>
        <p>
          This Privacy Policy explains how we handle the personal data of pilots, instructors and academy
          administrators using the Van-Vert platform to convert and manage pilot licenses.
        </p>
      </>
    ),
  },
  {
    id: "data-we-collect",
    title: "Data we collect",
    body: (
      <>
        <p>To convert your license, the platform handles three categories of data:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><span className="font-semibold text-navy">Account data</span> — name, email address, password hash, and authentication factors.</li>
          <li><span className="font-semibold text-navy">Application data</span> — license type, country pair, application status, reviewer comments and timestamps.</li>
          <li><span className="font-semibold text-navy">Document data</span> — uploads required by the issuing authority: passport, medical certificate, logbook, prior licenses, and translations.</li>
        </ul>
        <p>
          We do not collect biometric data, financial transaction details (handled by our payments processor),
          or browsing data beyond what is needed to keep the platform secure.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    title: "How we use it",
    body: (
      <>
        <p>
          Application and document data is used solely to process your license conversion with the relevant
          authority. Account data is used to operate the platform — sign you in, send transactional emails,
          and route reviewer feedback to you.
        </p>
        <p>We do not sell your data. We do not train AI models on your documents. We do not share your personal data with marketers.</p>
      </>
    ),
  },
  {
    id: "who-we-share-it-with",
    title: "Who we share it with",
    body: (
      <>
        <p>
          Your documents and application data are shared with the receiving aviation authority (e.g. EASA,
          GCAA, DGCA) and your assigned case officer at VAA. That is the entire list — there are no
          third-party advertisers, brokers, or analytics partners receiving your application content.
        </p>
        <p>
          Infrastructure providers (cloud hosting, email delivery, payments) process data on our behalf
          under signed Data Processing Agreements and have no rights to use it for their own purposes.
        </p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>
          Under GDPR and equivalent regimes you may at any time: (1) request a copy of the data we hold
          about you, (2) correct inaccurate data, (3) ask us to delete your account and application data,
          (4) export your application history as a portable archive.
        </p>
        <p>
          Requests are handled within 30 days. Documents already submitted to an authority cannot be
          withdrawn from that authority&apos;s records — that is governed by the authority&apos;s own retention policy.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          All uploads are encrypted in transit (TLS 1.3) and at rest (AES-256). Production access is
          restricted to a small on-call team and is audited continuously. We are SOC 2 Type II audited
          annually and run an ongoing third-party penetration testing program.
        </p>
        <p>
          If you discover a security issue, contact{" "}
          <a href="mailto:security@vanvert.co" className="text-sky hover:text-navy">security@vanvert.co</a> — we
          run a coordinated disclosure program and acknowledge reports within 24 hours.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          Questions about this policy, or to exercise the rights above, write to{" "}
          <a href="mailto:privacy@vanvert.co" className="font-semibold text-sky hover:text-navy">privacy@vanvert.co</a>.
          Our Data Protection Officer reviews all incoming requests personally.
        </p>
        <p>Vanguard Aviation Academy · Rua do Aeroporto 1 · 1700-008 Lisbon · Portugal</p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <VvLegalShell activeHref="/privacy" title="Privacy Policy" lastUpdated="May 12, 2026">
      <VvLegalContent sections={sections} />
    </VvLegalShell>
  );
}
