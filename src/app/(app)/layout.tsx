import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/projects", label: "Projects" },
  { href: "/risks", label: "Risks" },
  { href: "/controls", label: "Controls / SoA" },
  { href: "/evidence", label: "Evidence" },
  { href: "/audit-log", label: "Audit Log" },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login"); // belt-and-suspenders; middleware is the primary gate

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <aside className="flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-8">
          <p className="text-lg font-semibold text-zinc-100">Priora</p>
          <p className="text-xs text-zinc-500">
            The decisions that come before scale.
          </p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-zinc-800 pt-4">
          <p className="text-sm text-zinc-200">{session.user.name}</p>
          <p className="text-xs text-zinc-500">{session.user.role}</p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="mt-2 text-xs text-zinc-400 underline hover:text-zinc-200"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
