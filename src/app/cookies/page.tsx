import { VvLegalShell, VvLegalContent, type VvLegalSection } from "@/components/vv/VvLegalShell";

const sections: VvLegalSection[] = [
  {
    id: "what-cookies-are",
    title: "What cookies are",
    body: (
      <p>
        Cookies are small text files placed on your device when you visit a
        website. They help the site remember your preferences and understand how
        you use it. This policy explains which cookies Van-Vert sets and why.
      </p>
    ),
  },
  {
    id: "essential-cookies",
    title: "Essential cookies",
    body: (
      <>
        <p>
          These cookies are required for the platform to function. They handle
          authentication (keeping you signed in), CSRF protection, and session
          management. Without them, you cannot use Van-Vert.
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <span className="font-semibold text-navy">__session</span> — authentication session token. Expires
            when you sign out or after 30 days of inactivity.
          </li>
          <li>
            <span className="font-semibold text-navy">__csrf</span> — cross-site request forgery protection.
            Expires with your session.
          </li>
          <li>
            <span className="font-semibold text-navy">__consent</span> — records your cookie consent choice.
            Expires after 12 months.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "functional-cookies",
    title: "Functional cookies",
    body: (
      <>
        <p>
          These cookies remember your preferences — such as your preferred
          density setting, notification preferences, and last-viewed application.
          They make the platform more convenient but are not strictly required.
        </p>
        <p>
          You can disable functional cookies in your browser settings. Some UI
          preferences may reset on each visit if you do.
        </p>
      </>
    ),
  },
  {
    id: "analytics-cookies",
    title: "Analytics cookies",
    body: (
      <>
        <p>
          We use a privacy-focused analytics service to understand how pilots use
          Van-Vert — which pages are visited, how long conversions take, and
          where users drop off. This data is aggregated and cannot identify you
          personally.
        </p>
        <p>
          We do not use Google Analytics, Meta Pixel, or any third-party
          advertising tracker. Our analytics provider processes data exclusively
          within the EU and does not sell or share it.
        </p>
      </>
    ),
  },
  {
    id: "third-party-cookies",
    title: "Third-party cookies",
    body: (
      <p>
        Van-Vert does not set any third-party advertising or tracking cookies.
        The only third-party cookies you may encounter are from our payment
        processor (Stripe) during checkout, and from Google if you use &ldquo;Sign in
        with Google&rdquo;. Both are subject to their own cookie policies.
      </p>
    ),
  },
  {
    id: "managing-your-cookies",
    title: "Managing your cookies",
    body: (
      <>
        <p>
          You can manage or delete cookies through your browser settings. Most
          browsers allow you to block all cookies, block only third-party
          cookies, or clear cookies when you close the browser.
        </p>
        <p>
          If you block essential cookies, you will not be able to sign in to
          Van-Vert. If you have questions about our use of cookies, contact{" "}
          <a href="mailto:privacy@vanvert.co" className="font-semibold text-sky hover:text-navy">privacy@vanvert.co</a>.
        </p>
      </>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <VvLegalShell activeHref="/cookies" title="Cookie Policy" lastUpdated="May 12, 2026">
      <VvLegalContent sections={sections} />
    </VvLegalShell>
  );
}
