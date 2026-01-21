import type { SVGProps } from 'react';

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg role="img" viewBox="0 0 24 24" {...props}>
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.3 1.84-4.25 1.84-5.18 0-9.4-4.22-9.4-9.4s4.22-9.4 9.4-9.4c2.6 0 4.38 1.02 5.7 2.23l2.42-2.34C18.57.45 15.82 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c7.28 0 12.1-5.13 12.1-12.48 0-.8-.08-1.55-.25-2.25z"
      />
    </svg>
  );
}
