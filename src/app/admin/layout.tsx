import Link from "next/link";
import { Public_Sans } from "next/font/google";
import { requireAdmin } from "@/lib/auth/dal";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
});

const navItems = [
  { href: "/admin/produtos", label: "Produtos", active: true },
  { href: "#", label: "Pedidos", active: false },
  { href: "#", label: "Clientes", active: false },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className={`${publicSans.variable} flex min-h-screen font-[family-name:var(--font-public-sans)] bg-[#E8E0D5] text-[#3A312B]`}>
      <aside className="flex w-60 shrink-0 flex-col gap-1 bg-[#3A312B] p-4">
        <div className="flex items-center gap-2 border-b-2 border-[#C9B18C] px-2 pb-5 mb-2">
          <span className="text-[15px] font-semibold tracking-wide text-[#E8E0D5]">
            Crux Sacra
          </span>
        </div>
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={
              item.active
                ? "rounded-lg bg-[#5A4738] px-3 py-2.5 text-sm font-medium text-white"
                : "rounded-lg px-3 py-2.5 text-sm text-[#A99C8C] hover:text-[#E8E0D5]"
            }
          >
            {item.label}
          </Link>
        ))}
      </aside>
      <main className="flex-1 overflow-auto px-14 py-11">{children}</main>
    </div>
  );
}
