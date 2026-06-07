import { VvLegalShell, VvLegalContent, type VvLegalSection } from "@/components/vv/VvLegalShell";

const sections: VvLegalSection[] = [
  {
    id: "acceptance-of-terms",
    title: "Acceptance of terms",
    body: (
      <>
        <p>
          By creating a Van-Vert account, you agree to these Terms of Service. If you are using the
          platform on behalf of a flight school or organization, you confirm you have the authority to
          bind that organization to these terms.
        </p>
        <p>
          We may update these terms — material changes are announced at least 30 days in advance via
          email and a banner inside the app.
        </p>
      </>
    ),
  },
  {
    id: "what-van-vert-provides",
    title: "What Van-Vert provides",
    body: (
      <>
        <p>
          Van-Vert is a license conversion management platform. We provide tools to upload, organize and
          submit the document pack required by aviation authorities for pilot license conversions, and to
          track each application through to issue.
        </p>
        <p>
          We do not issue licenses. The issuing authority is the final decision-maker on every
          application. We are a service that organizes your interaction with that authority — we do not
          represent or replace it.
        </p>
      </>
    ),
  },
  {
    id: "your-account",
    title: "Your account",
    body: (
      <>
        <p>
          You are responsible for the accuracy of information you submit, including documents and
          personal details. Submitting false or fraudulent information may result in rejection by the
          issuing authority and immediate termination of your account.
        </p>
        <p>Keep your password and recovery email secure. You are responsible for activity under your account up until you report it compromised.</p>
      </>
    ),
  },
  {
    id: "fees-and-refunds",
    title: "Fees and refunds",
    body: (
      <>
        <p>
          The Solo tier is free to use until your license is issued. Once issued, an issuance fee
          applies — currently €189 per conversion. The Pro tier carries a monthly subscription disclosed
          at checkout. Academy pricing is per contract.
        </p>
        <p>
          If an application you submitted on Solo is rejected outright by the authority, you do not owe
          an issuance fee. Subscription fees on Pro are pro-rated and refundable for the unused portion of
          a billing period.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>
          You may not: (a) attempt to access another pilot&apos;s application, (b) reverse-engineer the
          platform, (c) submit forged documents, (d) use the platform to evade an authority&apos;s stated
          rules. We cooperate with authorities investigating fraudulent applications.
        </p>
        <p>Reviewer feedback, application IDs and case officer communications are confidential to the application — do not republish or share them.</p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Liability",
    body: (
      <>
        <p>
          Van-Vert provides the platform &ldquo;as is&rdquo;. Issuance timelines and outcomes are at the
          discretion of the authority. While we apply best-in-class engineering to keep your data safe and
          your application moving, we are not liable for delays caused by the authority, by missing
          information you supplied, or by force majeure events.
        </p>
        <p>
          Our total liability for any claim is capped at the fees you have paid to us in the 12 months
          preceding the claim. Nothing in these terms excludes liability that cannot be excluded by law.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Termination",
    body: (
      <>
        <p>
          You may close your account at any time from your profile settings. We will retain your
          application data for as long as the issuing authority requires (typically 7 years for issued
          licenses) and delete everything else within 30 days.
        </p>
        <p>
          We may suspend or close accounts engaged in fraud, abuse or repeated violations of these terms.
          Where possible, we give you written notice and a chance to respond first.
        </p>
      </>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of Portugal. Disputes are subject to the exclusive
        jurisdiction of the courts of Lisbon, without prejudice to the consumer protection rules of your
        country of residence.
      </p>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <VvLegalShell activeHref="/terms" title="Terms of Service" lastUpdated="May 12, 2026">
      <VvLegalContent sections={sections} />
    </VvLegalShell>
  );
}
