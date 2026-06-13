import { isDemo } from "@/lib/profile";

// Rendered as the first element in <body> so it shows on the login page too.
// Server component: isDemo() reads APP_PROFILE at request time.
export function DemoBanner() {
  if (!isDemo()) return null;
  return (
    <div
      role="status"
      className="bg-amber-500 px-4 py-1.5 text-center text-sm font-medium text-black"
    >
      Demo instance — data resets daily; all content fictional
    </div>
  );
}
