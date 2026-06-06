import { useRef, useState, type ReactNode } from "react";
import {
  DashboardIcon,
  TransactionsIcon,
  TrendDownIcon,
  TrendUpIcon,
} from "../../components/ui/Icons";
import type { CategoryBreakdown, PartnerBalance } from "../../types";
import { money } from "../../utils/format";

export type CarouselMiEconomia = {
  ingresos: number;
  gastosPropios: number;
  balance: number;
  categorias: CategoryBreakdown[];
};

export type CarouselHogar = {
  gastoTotal: number;
  tuParte: number;
  personas: number;
  partnerBalance?: PartnerBalance;
  categorias: CategoryBreakdown[];
};

type Props = {
  miEconomia: CarouselMiEconomia;
  hogar: CarouselHogar;
  currency: string;
  userName: string;
  onViewSpendingExpenses: () => void;
  onViewHouseholdExpenses: () => void;
};

const TOTAL = 3;

const pct = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(Math.max(value, 0));

const currentMonth = () =>
  new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
    new Date(),
  );

const clampPct = (value: number) => Math.min(Math.max(value, 0), 100);

const Slide = ({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) => (
  <div
    className={`${active ? "flex" : "hidden"} w-full flex-col px-4 pb-4 pt-4`}
  >
    {children}
  </div>
);

const Metric = ({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) => {
  const toneClass =
    tone === "positive"
      ? "text-brand-300"
      : tone === "negative"
        ? "text-red-300"
        : "text-white";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-200/70">
        {label}
      </p>
      <p className={`mt-1 truncate text-sm font-semibold ${toneClass}`}>
        {value}
      </p>
    </div>
  );
};

const CompactRow = ({
  label,
  value,
  subValue,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  tone?: "positive" | "negative" | "neutral";
}) => {
  const toneClass =
    tone === "positive"
      ? "text-brand-300"
      : tone === "negative"
        ? "text-red-300"
        : "text-white";

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-300">
          {icon ?? <DashboardIcon className="h-4 w-4" />}
        </span>
        <span className="truncate text-xs font-medium text-brand-200">
          {label}
        </span>
      </div>
      <div className="shrink-0 text-right">
        <strong className={`block text-xs font-semibold ${toneClass}`}>
          {value}
        </strong>
        {subValue && (
          <span className="text-[10px] font-medium text-brand-200/60">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

const CategoryBar = ({
  item,
  max,
  currency,
}: {
  item: CategoryBreakdown;
  max: number;
  currency: string;
}) => (
  <div className="grid gap-1.5">
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="truncate font-medium text-brand-200">{item.name}</span>
      <span className="font-semibold text-white">
        {money(item.total, currency)}
      </span>
    </div>
    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
      <div
        className="h-full rounded-full bg-brand-300"
        style={{
          width: `${max > 0 ? clampPct((item.total / max) * 100) : 0}%`,
        }}
      />
    </div>
  </div>
);

export const MonthlyCarousel = ({
  miEconomia,
  hogar,
  currency,
  userName,
  onViewSpendingExpenses,
  onViewHouseholdExpenses,
}: Props) => {
  const [slide, setSlide] = useState(0);
  const touchStart = useRef(0);

  const spentTotal = miEconomia.gastosPropios + hogar.tuParte;
  const spentPct =
    miEconomia.ingresos > 0 ? (spentTotal / miEconomia.ingresos) * 100 : 0;
  const housePct =
    miEconomia.ingresos > 0 ? (hogar.tuParte / miEconomia.ingresos) * 100 : 0;
  const balancePct =
    miEconomia.ingresos > 0
      ? (miEconomia.balance / miEconomia.ingresos) * 100
      : 0;
  const categories = miEconomia.categorias;
  const maxCategory = Math.max(
    ...categories.map((category) => category.total),
    0,
  );
  const hogarCategories = hogar.categorias;
  const maxHogarCategory = Math.max(
    ...hogarCategories.map((category) => category.total),
    0,
  );
  const partnerBalance = hogar.partnerBalance;
  const partnerNames = partnerBalance?.partnerNames ?? [];

  const goTo = (index: number) =>
    setSlide(Math.max(0, Math.min(TOTAL - 1, index)));
  const move = (direction: -1 | 1) => goTo(slide + direction);

  return (
    <>
    <section
      className="relative flex w-full flex-col rounded-[28px] bg-ink text-white shadow-2xl ring-1 ring-white/10"
      onTouchStart={(event) => {
        touchStart.current = event.touches[0].clientX;
      }}
      onTouchEnd={(event) => {
        const delta = event.changedTouches[0].clientX - touchStart.current;
        if (Math.abs(delta) > 40) move(delta < 0 ? 1 : -1);
      }}
    >
      <div className="pointer-events-none absolute inset-x-5 top-20 h-px bg-white/10" />

      <div className="relative z-10 px-4 pt-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-300">
            Resumen mensual
          </p>
          <p className="mt-1 text-xs font-medium capitalize text-brand-200/70">
            {currentMonth()}
          </p>
        </div>
      </div>

      <div className="relative z-10 w-full">
        <Slide active={slide === 0}>
          <div className="flex items-stretch gap-3">
            <div className="flex-1 rounded-[24px] bg-white p-4 text-ink shadow-2xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand">
                Mi economia
              </p>
              <p className="mt-4 text-xs font-medium text-muted">Ingresos</p>
              <p className="mt-1 truncate text-3xl font-bold text-brand">
                {money(miEconomia.ingresos, currency)}
              </p>

              <div className="mt-5 grid gap-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Gastos propios</span>
                  <strong>{money(miEconomia.gastosPropios, currency)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">Parte hogar</span>
                  <strong>{money(hogar.tuParte, currency)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-brand-100 pt-3">
                  <span className="font-semibold text-muted">Balance real</span>
                  <strong
                    className={
                      miEconomia.balance >= 0 ? "text-brand" : "text-danger"
                    }
                  >
                    {money(miEconomia.balance, currency)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="w-[42%] shrink-0 rounded-[24px] border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-200">
                Hogar
              </p>
              <p className="mt-4 text-xs font-medium text-brand-200/75">
                Tu parte mensual
              </p>
              <p className="mt-1 truncate text-2xl font-semibold text-white">
                {money(hogar.tuParte, currency)}
              </p>
              <div className="mt-4 flex items-center justify-between text-[11px] font-semibold text-brand-300">
                <span>{pct(housePct)}%</span>
                <span>{hogar.personas} personas</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Metric
              label="Ingreso"
              value={money(miEconomia.ingresos, currency)}
              tone="positive"
            />
            <Metric
              label="Gasto"
              value={money(spentTotal, currency)}
              tone="negative"
            />
            <Metric
              label="Libre"
              value={`${pct(balancePct)}%`}
              tone={miEconomia.balance >= 0 ? "positive" : "negative"}
            />
          </div>
        </Slide>

        <Slide active={slide === 1}>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
                Control de gasto
              </p>
              <p className="mt-2 truncate text-[30px] font-bold leading-none text-white">
                {money(spentTotal, currency)}
              </p>
              <p className="mt-2 text-sm font-medium text-brand-200/70">
                Propios + tu parte del hogar
              </p>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center gap-3">
                <div
                  className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
                  style={{
                    background: `conic-gradient(#8cf4ee ${clampPct(spentPct)}%, rgba(255,255,255,0.1) 0)`,
                  }}
                >
                  <div className="grid h-16 w-16 place-items-center rounded-full bg-ink text-center">
                    <span className="text-base font-bold text-white">
                      {pct(spentPct)}%
                    </span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">
                    Peso sobre ingresos
                  </p>
                  <p className="mt-1 text-xs leading-4 text-brand-200/70">
                    Mantienes {money(miEconomia.balance, currency)} como balance
                    real este mes.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onViewSpendingExpenses}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              <TransactionsIcon className="h-4 w-4 text-brand-300" />
              Ver control de gastos
            </button>

            <div className="grid max-h-52 max-w-sm gap-2.5 overflow-y-auto pr-1">
              {categories.length ? (
                categories.map((category) => (
                  <CategoryBar
                    key={category.categoryId}
                    item={category}
                    max={maxCategory}
                    currency={currency}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-brand-200/70">
                  Aun no hay gastos personales este mes.
                </p>
              )}
            </div>
          </div>
        </Slide>

        <Slide active={slide === 2}>
          <div className="flex flex-col gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-300">
                Hogar
              </p>
              <p className="mt-2 truncate text-[30px] font-bold leading-none text-white">
                {money(hogar.gastoTotal, currency)}
              </p>
              <p className="mt-2 text-sm font-medium text-brand-200/70">
                Gasto total compartido
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Metric
                label="Tu parte"
                value={money(hogar.tuParte, currency)}
                tone="negative"
              />
              <Metric
                label="Sobre ingresos"
                value={`${pct(housePct)}%`}
                tone="neutral"
              />
            </div>

            <button
              type="button"
              onClick={onViewHouseholdExpenses}
              className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.08] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              <TransactionsIcon className="h-4 w-4 text-brand-300" />
              Ver gastos del hogar
            </button>

            <div className="grid gap-1.5 rounded-[22px] border border-white/10 bg-white/[0.06] p-3">
              {partnerNames.length ? (
                partnerNames.map((name) => {
                  const paid = partnerBalance?.paidExpenses[name] ?? 0;
                  const sharePct =
                    hogar.gastoTotal > 0 ? (paid / hogar.gastoTotal) * 100 : 0;
                  return (
                    <CompactRow
                      key={name}
                      label={
                        name === userName ? `${name} pagaste` : `${name} pago`
                      }
                      value={money(paid, currency)}
                      subValue={`${pct(sharePct)}% del total`}
                      icon={
                        name === userName ? (
                          <TrendUpIcon className="h-4 w-4" />
                        ) : (
                          <TrendDownIcon className="h-4 w-4" />
                        )
                      }
                      tone={name === userName ? "positive" : "neutral"}
                    />
                  );
                })
              ) : (
                <CompactRow
                  label="Total del hogar"
                  value={money(hogar.gastoTotal, currency)}
                />
              )}
            </div>

            <div className="grid gap-2.5 max-w-sm">
              {hogarCategories.length ? (
                hogarCategories.map((category) => (
                  <CategoryBar
                    key={category.categoryId}
                    item={category}
                    max={maxHogarCategory}
                    currency={currency}
                  />
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-brand-200/70">
                  Aun no hay gastos compartidos este mes.
                </p>
              )}
            </div>

          </div>
        </Slide>
      </div>

    </section>

      <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 flex justify-center gap-1.5">
        {Array.from({ length: TOTAL }, (_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => goTo(index)}
            aria-label={`Ir a resumen ${index + 1}`}
            className={`h-1.5 rounded-full transition-all ${slide === index ? "w-6 bg-brand-300" : "w-1.5 bg-white/20"}`}
          />
        ))}
      </div>
    </>
  );
};
