import type { PictogramName } from "@/lib/public-pictograms.ts";

// Hand-drawn pictograms for Home and Newcomers (V2 Stage 2, AL-03): 24×24 line drawings in the current
// text colour, decorative (aria-hidden) because the destination's name is always written beside them.
// Authored in this repository from basic shapes; no icon dependency, no external asset.

const SHAPES: Record<PictogramName, React.ReactNode> = {
  // signpost
  newcomers: (
    <>
      <path d="M12 3v18" />
      <path d="M12 5h6.5l2 2-2 2H12" />
      <path d="M12 11H5.5l-2 2 2 2H12" />
      <path d="M9 21h6" />
    </>
  ),
  // folded floor plan
  map: (
    <>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
      <path d="M9 4v13.5" />
      <path d="M15 6.5V20" />
    </>
  ),
  // building with windows and a door
  rooms: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7.5h2M13 7.5h2M9 11.5h2M13 11.5h2" />
      <path d="M10 21v-4.5h4V21" />
    </>
  ),
  // calendar
  schedule: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <path d="M8 14h2.5M13.5 14H16M8 17.2h2.5" />
    </>
  ),
  // key
  booking: (
    <>
      <circle cx="8" cy="15" r="3.5" />
      <path d="M10.5 12.5 19.5 3.5" />
      <path d="m16.5 6.5 2.5 2.5" />
      <path d="m14 9 2 2" />
    </>
  ),
  // megaphone
  display: (
    <>
      <path d="M3.5 9.5H7L15 5v14l-8-4.5H3.5z" />
      <path d="m7 14.5 1.2 4.5h2.3L9.1 14.2" />
      <path d="M18.5 9.5a4 4 0 0 1 0 5" />
    </>
  ),
  // question mark in a circle
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.6a2.6 2.6 0 1 1 3.7 2.3c-.8.4-1.2 1-1.2 1.9" />
      <path d="M12 17h.01" />
    </>
  ),
};

export function Pictogram({ name, className }: { name: PictogramName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {SHAPES[name]}
    </svg>
  );
}
