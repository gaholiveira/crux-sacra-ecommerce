"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/clientes", label: "Clientes" },
];

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Uma seção fica "ativa" tanto na própria lista (/admin/pedidos) quanto
  // nas páginas de detalhe dela (/admin/pedidos/abc123).
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const linkClass = (href: string) =>
    isActive(href)
      ? "rounded-lg bg-[#5A4738] px-3 py-2.5 text-sm font-medium text-white"
      : "rounded-lg px-3 py-2.5 text-sm text-[#A99C8C] hover:text-[#E8E0D5]";

  return (
    <>
      {/* Barra superior: só existe abaixo de md */}
      <div className="flex items-center justify-between bg-[#3A312B] px-4 py-3 md:hidden">
        <span className="text-[15px] font-semibold tracking-wide text-[#E8E0D5]">Crux Sacra</span>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center text-[#E8E0D5]"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 bg-[#3A312B] p-4 md:hidden">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={linkClass(item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}

      {/* Sidebar: só existe a partir de md */}
      <aside className="hidden w-60 shrink-0 flex-col gap-1 bg-[#3A312B] p-4 md:flex">
        <div className="flex items-center gap-2 border-b-2 border-[#C9B18C] px-2 pb-5 mb-2">
          <span className="text-[15px] font-semibold tracking-wide text-[#E8E0D5]">Crux Sacra</span>
        </div>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
            {item.label}
          </Link>
        ))}
      </aside>
    </>
  );
}
