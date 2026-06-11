import { VvLegalShell, VvLegalContent, type VvLegalSection } from "@/components/vv/VvLegalShell";

const sections: VvLegalSection[] = [
  {
    id: "regulatory-framework",
    title: "Regulatory framework",
    body: (
      <>
        <p>
          Van-Vert operates within the regulatory frameworks of every aviation
          authority we support. Our platform is designed to meet the procedural
          and documentary requirements set by EASA, FAA, UK CAA, Transport
          Canada (TCCA), GCAA and DGCA for pilot license validation and
          conversion.
        </p>
        <p>
          We maintain current knowledge of each authority&apos;s Acceptable Means of
          Compliance (AMC) and Advisory Circulars, and update our document
          checklists and workflows whenever requirements change.
        </p>
      </>
    ),
  },
  {
    id: "data-protection-gdpr",
    title: "Data protection (GDPR)",
    body: (
      <>
        <p>
          As a company registered in the European Union, Vanguard Aviation
          Academy is fully subject to the General Data Protection Regulation. We
          process personal data under Article 6(1)(b) — performance of a
          contract — and Article 6(1)(f) — legitimate interests in platform
          security.
        </p>
        <p>
          Our Data Protection Officer reviews all processing activities and
          conducts annual Data Protection Impact Assessments. Sub-processors are
          bound by Data Processing Agreements that mirror our obligations under
          GDPR.
        </p>
      </>
    ),
  },
  {
    id: "authority-relationships",
    title: "Authority relationships",
    body: (
      <>
        <p>
          We work directly with authority licensing desks to ensure that document
          packs submitted through Van-Vert meet the exact format, certification
          and translation requirements. This isn&apos;t a legal partnership — it&apos;s an
          operational one: we know what they accept because we&apos;ve submitted
          hundreds of successful applications.
        </p>
        <p>
          When an authority updates its requirements, we push those changes to
          affected checklists within 48 hours.
        </p>
      </>
    ),
  },
  {
    id: "soc-2-type-ii",
    title: "SOC 2 Type II",
    body: (
      <>
        <p>
          Van-Vert is audited annually against the SOC 2 Type II trust service
          criteria for Security, Availability and Confidentiality. Our most
          recent audit was completed in March 2026 with zero exceptions.
        </p>
        <p>
          Audit reports are available under NDA to enterprise customers on the
          Academy plan. Contact{" "}
          <a href="mailto:compliance@vanvert.co" className="text-sky hover:text-navy">compliance@vanvert.co</a> to
          request a copy.
        </p>
      </>
    ),
  },
  {
    id: "data-retention",
    title: "Data retention",
    body: (
      <>
        <p>
          Application data (documents, status history, reviewer feedback) is
          retained for the duration required by the issuing authority — typically
          7 years for issued licenses. You can request a full data export at any
          time from your profile settings.
        </p>
        <p>
          Account data is deleted within 30 days of account closure. Documents
          already submitted to an authority are subject to that authority&apos;s own
          retention policies, which we do not control.
        </p>
      </>
    ),
  },
  {
    id: "compliance-reporting",
    title: "Compliance reporting",
    body: (
      <>
        <p>
          If you believe Van-Vert is not meeting a regulatory obligation, or if
          you want to report a data handling concern, write to{" "}
          <a href="mailto:compliance@vanvert.co" className="text-sky hover:text-navy">compliance@vanvert.co</a>. We
          investigate every report and respond within 10 business days.
        </p>
        <p>
          For aviation safety concerns, contact the relevant national authority
          directly — Van-Vert does not operate aircraft or issue licenses.
        </p>
      </>
    ),
  },
];

export default function CompliancePage() {
  return (
    <VvLegalShell activeHref="/compliance" title="Compliance" lastUpdated="May 12, 2026" kicker="Authority">
      <VvLegalContent sections={sections} />
    </VvLegalShell>
  );
}
