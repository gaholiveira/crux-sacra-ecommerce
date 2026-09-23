import { Public_Sans } from "next/font/google";
import { requireAdmin } from "@/lib/auth/dal";
import { AdminNav } from "./admin-nav";

const publicSans = Public_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-public-sans",
});

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div
      className={`${publicSans.variable} flex min-h-screen flex-col font-[family-name:var(--font-public-sans)] bg-[#E8E0D5] text-[#3A312B] md:flex-row`}
    >
      <AdminNav />
      <main className="flex-1 overflow-auto px-6 py-8 md:px-14 md:py-11">{children}</main>
    </div>
  );
}
