"use client";

import { useState } from "react";
import Link from "next/link";
import { logoutAction } from "./logout-action";

function CartIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="18" cy="20" r="1.4" />
      <path d="M2.5 3h2.4l2.1 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 7.5H6.2" />
    </svg>
  );
}

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

function AuthArea({
  user,
  onNavigate,
}: {
  user: { name: string | null; role: string } | null;
  onNavigate?: () => void;
}) {
  if (user) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        {user.role === "ADMIN" && (
          <Link
            href="/admin/produtos"
            onClick={onNavigate}
            className="text-sm text-[#6E6255] hover:text-[#3A312B] hover:underline"
          >
            Admin
          </Link>
        )}
        <Link
          href="/perfil"
          onClick={onNavigate}
          className="text-sm text-[#6E6255] hover:text-[#3A312B] hover:underline"
        >
          Olá, {user.name}
        </Link>
        <form action={logoutAction}>
          <button type="submit" className="text-sm text-[#6E6255] hover:text-[#3A312B]">
            Sair
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/entrar" onClick={onNavigate} className="text-sm text-[#6E6255] hover:text-[#3A312B]">
        Entrar
      </Link>
      <Link
        href="/cadastro"
        onClick={onNavigate}
        className="rounded-lg bg-[#5A4738] px-4 py-2 text-sm font-medium text-white hover:bg-[#4A3A2D]"
      >
        Criar conta
      </Link>
    </div>
  );
}

export function Header({
  user,
  cartCount,
}: {
  user: { name: string | null; role: string } | null;
  cartCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b-[3px] border-[#C9B18C] bg-white/70 backdrop-blur-md">
      <div className="flex items-center justify-between px-6 py-4 md:px-16 md:py-5">
        <Link href="/" className="text-lg font-bold tracking-wide text-[#3A312B]">
          Crux Sacra
        </Link>

        {/* Menu de navegação: só aparece a partir de md (768px) */}
        <nav className="hidden gap-9 text-sm font-medium md:flex">
          <Link href="/">Início</Link>
          <Link href="/produtos">Produtos</Link>
          <Link href="/#sobre">Sobre</Link>
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <Link
            href="/carrinho"
            className="flex items-center gap-2 text-sm text-[#6E6255] hover:text-[#3A312B]"
          >
            <CartIcon />
            Carrinho ({cartCount})
          </Link>
          <AuthArea user={user} />
        </div>

        {/* Abaixo de md: ícone do carrinho fica sempre visível ao lado do
            hambúrguer, nunca escondido dentro do menu — senão adicionar um
            item não dá nenhum feedback visível até o cliente abrir o menu. */}
        <div className="flex items-center gap-1 md:hidden">
          <Link
            href="/carrinho"
            className="relative flex h-9 w-9 items-center justify-center text-[#3A312B]"
            aria-label={`Carrinho, ${cartCount} ${cartCount === 1 ? "item" : "itens"}`}
          >
            <CartIcon />
            {cartCount > 0 && (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#5A4738] px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center text-[#3A312B]"
            aria-label={open ? "Fechar menu" : "Abrir menu"}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Painel do menu mobile: só existe quando `open` é true */}
      {open && (
        <div className="flex flex-col gap-5 border-t border-[#D8CDBC] px-6 py-5 md:hidden">
          <Link href="/" onClick={() => setOpen(false)} className="text-sm font-medium">
            Início
          </Link>
          <Link href="/produtos" onClick={() => setOpen(false)} className="text-sm font-medium">
            Produtos
          </Link>
          <Link href="/#sobre" onClick={() => setOpen(false)} className="text-sm font-medium">
            Sobre
          </Link>
          <div className="border-t border-[#D8CDBC] pt-4">
            <AuthArea user={user} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
