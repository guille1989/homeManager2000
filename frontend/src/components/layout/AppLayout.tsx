import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import { NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthProvider";
import { BrandLogo } from "./BrandLogo";
import { Button } from "../ui/Button";
import {
  DashboardIcon,
  LogoutIcon,
  SettingsIcon,
} from "../ui/Icons";

type NavItem = {
  to: string;
  label: string;
  end: boolean;
  Icon: (p: { className?: string }) => ReactElement;
};

const mainNav: NavItem[] = [
  { to: "/", label: "Resumen", end: true, Icon: DashboardIcon },
  { to: "/configuracion", label: "Configuracion", end: false, Icon: SettingsIcon }
];

const navGroups: Array<[string, NavItem[]]> = [
  ["Principal", mainNav]
];

const NavGroups = ({ onNavigate }: { onNavigate?: () => void }) => (
  <nav className="grid gap-5">
    {navGroups.map(([title, items]) => (
      <div key={title} className="grid gap-1">
        <p className="px-3 text-xs font-semibold uppercase tracking-wide text-white/40">{title}</p>
        {items.map(({ to, label, end, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive ? "bg-brand text-white shadow-md" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-white" : "text-white/50"}`} />
                <span className="truncate">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    ))}
  </nav>
);

export const AppLayout = () => {
  const { household, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-dvh bg-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-ink px-5 py-6 text-white">
        <BrandLogo dark />
        <div className="my-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Hogar</p>
          <h1 className="mt-1 text-lg font-bold text-white">{household?.name ?? "Compartido"}</h1>
        </div>
        <NavGroups />
        <Button
          variant="ghost"
          className="mt-auto flex items-center gap-2 text-white/50 hover:bg-white/10 hover:text-white"
          onClick={handleLogout}
        >
          <LogoutIcon className="h-4 w-4" />
          Cerrar sesion
        </Button>
      </aside>

      <button
        type="button"
        aria-label="Abrir menu"
        onClick={() => setMenuOpen(true)}
        className="fixed left-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-transparent transition hover:bg-white/10"
      >
        <img src="/img/innoapp-isotipo.svg" alt="" className="h-10 w-10 object-contain" />
      </button>

      {menuOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Cerrar menu"
            className="absolute inset-0 bg-black/35"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(82vw,320px)] flex-col bg-ink px-4 py-5 text-white shadow-2xl">
            <BrandLogo dark />
            <div className="my-5 rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-200">Hogar</p>
              <h1 className="mt-1 truncate text-base font-bold text-white">{household?.name ?? "Compartido"}</h1>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              <NavGroups onNavigate={() => setMenuOpen(false)} />
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogoutIcon className="h-4 w-4" />
              Cerrar sesion
            </button>
          </aside>
        </div>
      ) : null}

      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))]">
        <Outlet />
      </main>

      <ScrollRestoration />
    </div>
  );
};
