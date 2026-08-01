type SaarthiLogoProps = {
  className?: string;
};

export function SaarthiLogo({ className }: SaarthiLogoProps) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 120 72"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M5 22C18 26 32 31 47 31C54 31 57 24 70 24C78 24 83 28 94 27C100 26 104 24 105 21C106 18 102 17 97 18C87 19 82 17 76 16C66 14 55 15 49 20C43 25 38 27 29 26C20 25 11 21 5 18"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M17 47C29 46 40 47 49 53C58 58 70 61 81 55C86 52 90 48 93 43C96 38 95 35 90 34C82 33 76 34 69 31C63 29 58 27 52 28"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M52 28C56 34 64 38 75 39C82 40 89 39 93 43"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M66 47C71 42 74 39 77 36M75 52C79 47 83 42 88 39M55 48C59 43 63 40 68 38"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <path
        d="M115 49C103 48 91 46 81 51"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="5"
      />
    </svg>
  );
}
