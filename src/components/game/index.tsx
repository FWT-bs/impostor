"use client";

import { Header, type HeaderUser } from "@/components/layout/Header";
import { Badge } from "@/components/ui/Badge";
import { Card, type CardProps } from "@/components/ui/Card";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { cn, getInitials, tokenColor } from "@/lib/utils";
import Link from "next/link";
import {
  type CSSProperties,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export function AppShell({
  children,
  user,
  className,
  mainClassName,
}: {
  children: ReactNode;
  user?: HeaderUser | null;
  className?: string;
  mainClassName?: string;
}) {
  return (
    <div className={cn("tabletop-page min-h-screen", className)}>
      <NavBar user={user} />
      <main className={cn("tabletop-main mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:px-10", mainClassName)}>
        {children}
      </main>
    </div>
  );
}

export function NavBar({ user }: { user?: HeaderUser | null }) {
  return <Header user={user} />;
}

export function PageHeader({
  title,
  description,
  actions,
  align = "left",
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "tabletop-page-header mb-8 flex flex-col gap-5",
        align === "center" && "mx-auto max-w-3xl items-center text-center",
        className,
      )}
    >
      <div className={cn("space-y-4", align === "center" && "items-center")}>
        <h1 className="tabletop-title">
          {title}
        </h1>
        {description && (
          <p className="tabletop-copy">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4">{actions}</div>}
    </div>
  );
}

export function GameCard({
  className,
  children,
  hover = true,
  accent = "purple",
  ...props
}: CardProps & {
  accent?: "purple" | "pink" | "cyan" | "lime" | "amber";
}) {
  const accentClass = {
    purple: "before:bg-brand",
    pink: "before:bg-heat",
    cyan: "before:bg-aqua",
    lime: "before:bg-lime",
    amber: "before:bg-amber",
  }[accent];

  return (
    <div className="h-full">
      <Card
        hover={false}
        className={cn(
          "game-card relative h-full overflow-hidden rounded-[28px]",
          "before:absolute before:left-6 before:top-0 before:h-1 before:w-16 before:rounded-full before:opacity-80",
          accentClass,
          hover &&
            "transition-all duration-200 will-change-transform hover:-translate-y-0.5 hover:bg-card-hover active:translate-y-0 active:scale-[0.99] active:duration-100",
          className,
        )}
        {...props}
      >
        {children}
      </Card>
    </div>
  );
}

export function RoleCard({
  role,
  title,
  subtitle,
  flipped = false,
  className,
}: {
  role: "mystery" | "crew" | "impostor";
  title: string;
  subtitle?: string;
  flipped?: boolean;
  className?: string;
}) {
  const tone =
    role === "impostor"
      ? "var(--heat)"
      : role === "crew"
        ? "var(--aqua)"
        : "var(--brand)";
  const icon: IconName =
    role === "impostor" ? "mask" : role === "crew" ? "shield" : "dice";

  return (
    <div className={cn("role-card-3d h-[184px] w-[132px] sm:h-[220px] sm:w-[158px]", className)}>
      <div
        className="relative h-full w-full rounded-lg"
        style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : undefined }}
      >
        <div
          className="role-face absolute inset-0 rounded-lg border border-brand/35 bg-card p-4"
          style={{ ["--role-tone" as string]: tone }}
        >
          <div className="grid h-full place-items-center rounded-md border border-border bg-background/50">
            <div className="text-center">
              <div className="mx-auto mb-3 grid size-12 place-items-center rounded-lg border border-brand/35 bg-brand/12 text-brand-2">
                <Icon name="mask" size={25} />
              </div>
              <p className="text-xs font-semibold text-muted">Role card</p>
            </div>
          </div>
        </div>
        <div
          className="role-face role-back absolute inset-0 rounded-lg border bg-card p-4 text-center"
          style={{
            ["--role-tone" as string]: tone,
            borderColor: `color-mix(in oklab, ${tone} 45%, transparent)`,
          }}
        >
          <div
            className="mx-auto mb-4 grid size-14 place-items-center rounded-lg text-white"
            style={{
              background: tone,
            }}
          >
            <Icon name={icon} size={29} />
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle && <p className="mt-2 text-xs leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
}

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: "open" | "live" | "mine" | "locked" | "finished" | "premium";
  children?: ReactNode;
  className?: string;
}) {
  const variant =
    status === "live"
      ? "live"
      : status === "open" || status === "mine"
        ? "default"
        : status === "premium"
          ? "pink"
          : "secondary";

  return (
    <Badge variant={variant} className={cn("capitalize", className)}>
      {status === "locked" && <Icon name="lock" size={12} />}
      {status === "premium" && <Icon name="crown" size={12} />}
      {children ?? status}
    </Badge>
  );
}

export function PlayerToken({
  name,
  index,
  active,
  editable,
  value,
  onChange,
  className,
}: {
  name: string;
  index?: number;
  active?: boolean;
  editable?: boolean;
  value?: string;
  onChange?: InputHTMLAttributes<HTMLInputElement>["onChange"];
  className?: string;
}) {
  const color = tokenColor(name || String(index ?? 0));
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[20px] bg-background p-3 transition-colors",
        active && "ring-2 ring-brand/50",
        className,
      )}
    >
      <div
        className="token token-sm"
        style={{ background: color }}
      >
        {getInitials(name || `P${(index ?? 0) + 1}`)}
      </div>
      <div className="min-w-0 flex-1">
        {editable ? (
          <Input
            aria-label={`Player ${(index ?? 0) + 1} name`}
            value={value}
            onChange={onChange}
            className="h-10 rounded-lg border-0 bg-surface-2"
          />
        ) : (
          <>
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            {index != null && <p className="text-xs text-muted">Seat {index + 1}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export function TopicPackChip({
  name,
  selected,
  locked,
  premium,
  onClick,
  className,
}: {
  name: string;
  selected?: boolean;
  locked?: boolean;
  premium?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-200 cursor-pointer will-change-transform active:scale-[0.95] active:duration-100",
        selected
          ? "bg-brand text-brand-ink"
          : locked
            ? "bg-background text-muted-2 hover:text-muted"
            : "bg-background text-foreground hover:bg-surface-2",
        className,
      )}
      aria-pressed={selected}
    >
      <Icon name={premium ? "crown" : locked ? "lock" : "dice"} size={13} className={premium ? "text-heat-2" : undefined} />
      <span>{name}</span>
    </button>
  );
}

export function TopicPackGrid({
  packs,
  premiumPacks,
  selected,
  lockedWhenPremium = false,
  onSelect,
  includeRandom = true,
  className,
}: {
  packs: string[];
  premiumPacks?: Set<string>;
  selected?: string | null;
  lockedWhenPremium?: boolean;
  onSelect?: (pack: string | null) => void;
  includeRandom?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {includeRandom && (
        <TopicPackChip
          name="Random"
          selected={!selected}
          onClick={() => onSelect?.(null)}
        />
      )}
      {packs.map((pack) => {
        const premium = premiumPacks?.has(pack) ?? false;
        const locked = premium && lockedWhenPremium;
        return (
          <TopicPackChip
            key={pack}
            name={pack}
            premium={premium}
            locked={locked}
            selected={selected === pack}
            onClick={() => onSelect?.(pack)}
          />
        );
      })}
    </div>
  );
}

export function SetupStepper({
  steps,
  active,
}: {
  steps: { label: string; description: string }[];
  active: number;
}) {
  return (
    <ol className="grid gap-2">
      {steps.map((step, index) => {
        const current = index === active;
        const done = index < active;
        return (
          <li
            key={step.label}
            className={cn(
              "rounded-lg border p-3 transition-colors",
              current
                ? "border-brand/45 bg-blue-soft"
                : done
                  ? "border-aqua/30 bg-aqua/8"
                  : "border-border bg-card/70",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-md text-xs font-bold",
                  current
                    ? "bg-brand text-white"
                    : done
                      ? "bg-aqua text-background"
                      : "bg-surface-2 text-muted",
                )}
              >
                {done ? <Icon name="check" size={14} stroke={2.8} /> : index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">{step.label}</p>
                <p className="text-xs text-muted">{step.description}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function RoomCard({
  code,
  players,
  maxPlayers,
  status,
  topic,
  action,
  className,
  showStatus = false,
}: {
  code: string;
  players: number;
  maxPlayers: number;
  status: "open" | "live" | "mine" | "finished";
  topic?: string;
  action?: ReactNode;
  className?: string;
  showStatus?: boolean;
}) {
  const fill = Math.min(100, Math.round((players / maxPlayers) * 100));
  return (
    <GameCard className={cn("p-4 sm:p-5", className)} accent={status === "live" ? "lime" : "purple"}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="display text-2xl text-brand sm:text-3xl">{code}</span>
            {showStatus && <StatusBadge status={status}>{status === "mine" ? "Your table" : status}</StatusBadge>}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
            <span>{players}/{maxPlayers} players</span>
            <span className="text-muted-2">/</span>
            <span className="min-w-0 max-w-full truncate">{topic || "Random pack"}</span>
          </div>
          <div className="mt-3 h-2.5 w-full max-w-[260px] overflow-hidden rounded-full bg-surface-3/75">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${fill}%` }}
            />
          </div>
        </div>
        {action && <div className="grid shrink-0 sm:block [&>*]:w-full sm:[&>*]:w-auto">{action}</div>}
      </div>
    </GameCard>
  );
}

export function EmptyState({
  title,
  text,
  action,
  icon = "mask",
}: {
  title: string;
  text: string;
  action?: ReactNode;
  icon?: IconName;
}) {
  return (
    <Card padding="lg" className="rounded-[32px] text-center">
      <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-brand text-brand-ink">
        <Icon name={icon} size={26} />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{text}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </Card>
  );
}

export function PricingCard({
  name,
  price,
  description,
  features,
  featured,
  cta,
  badge,
  children,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  featured?: boolean;
  cta: ReactNode;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <GameCard
      accent={featured ? "pink" : "purple"}
      className={cn("relative flex flex-col p-6", featured && "overflow-hidden border-heat/45")}
      hover
    >
      <div className="relative z-[1]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-bold">{name}</h3>
          {badge}
        </div>
        <div className="mb-2 flex items-end gap-2">
          <span className="display text-5xl">{price}</span>
          {price !== "$0" && <span className="pb-2 text-muted">/ month</span>}
        </div>
        <p className="mb-6 text-sm leading-relaxed text-muted">{description}</p>
        <ul className="mb-6 grid flex-1 gap-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm text-foreground">
              <span className={cn("grid size-5 place-items-center rounded-full", featured ? "bg-heat/16 text-heat-2" : "bg-aqua/12 text-aqua-2")}>
                <Icon name="check" size={13} stroke={2.8} />
              </span>
              {feature}
            </li>
          ))}
        </ul>
        {children}
        {cta}
      </div>
    </GameCard>
  );
}

export function TimerRing({
  value,
  max = 100,
  label,
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(1, value / max));
  const deg = pct * 360;
  return (
    <div
      className={cn("grid size-20 place-items-center rounded-lg", className)}
      style={{
        background: `conic-gradient(var(--aqua) ${deg}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div className="grid size-[68px] place-items-center rounded-md bg-background text-center">
        <div>
          <p className="text-lg font-bold text-foreground">{value}</p>
          {label && <p className="text-[10px] text-muted">{label}</p>}
        </div>
      </div>
    </div>
  );
}

export function VoteToken({
  label,
  selected,
  count,
  onClick,
}: {
  label: string;
  selected?: boolean;
  count?: number;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer",
        selected
          ? "border-heat/55 bg-heat/12"
          : "border-border bg-card/65 hover:border-heat/35",
      )}
    >
      <span className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-md bg-heat/14 text-heat-2">
          <Icon name="vote" size={18} />
        </span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </span>
      {count != null && <Badge variant="pink">{count}</Badge>}
    </button>
  );
}

export function TableLinkCard({
  href,
  icon,
  title,
  text,
  accent = "purple",
}: {
  href: string;
  icon: IconName;
  title: string;
  text: string;
  accent?: "purple" | "pink" | "cyan" | "lime" | "amber";
}) {
  return (
    <Link href={href} className="block h-full">
      <GameCard accent={accent} className="p-5">
        <div className="mb-5 grid size-12 place-items-center rounded-lg border border-border bg-background/60 text-brand-2">
          <Icon name={icon} size={24} />
        </div>
        <h3 className="mb-2 text-xl font-bold">{title}</h3>
        <p className="text-sm leading-relaxed text-muted">{text}</p>
      </GameCard>
    </Link>
  );
}

export function GameMetric({
  label,
  value,
  tone = "purple",
  className,
}: {
  label: string;
  value: string;
  tone?: "purple" | "pink" | "cyan" | "lime";
  className?: string;
}) {
  const color = {
    purple: "text-brand-2",
    pink: "text-heat-2",
    cyan: "text-aqua-2",
    lime: "text-lime",
  }[tone];
  return (
    <div className={cn("rounded-lg border border-border bg-card/65 p-4", className)}>
      <p className={cn("display text-3xl", color)}>{value}</p>
      <p className="mt-1 text-xs font-semibold text-muted">{label}</p>
    </div>
  );
}

export function Surface({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-lg border border-border bg-card/70 p-5", className)}
      {...props}
    />
  );
}

export function DoodleMark({
  kind = "mask",
  className,
  color = "var(--heat)",
  size = 42,
  rotate = -8,
}: {
  kind?: "star" | "smile" | "burst" | "zig" | "mask" | "eye" | "lock" | "shh" | "trace";
  className?: string;
  color?: string;
  size?: number;
  rotate?: number;
}) {
  const style = {
    "--doodle-color": color,
    "--doodle-size": `${size}px`,
    "--rot": `${rotate}deg`,
  } as CSSProperties;

  if (kind === "burst") {
    return <span className={cn("doodle doodle-burst", className)} style={style} aria-hidden />;
  }

  if (kind === "mask" || kind === "eye" || kind === "lock") {
    const icon: IconName = kind === "mask" ? "mask" : kind === "eye" ? "eye" : "lock";
    return (
      <span className={cn("doodle grid place-items-center", className)} style={{ ...style, width: size, height: size }} aria-hidden>
        <Icon name={icon} size={size * 0.82} stroke={2.25} />
      </span>
    );
  }

  const text = kind === "smile" ? ":)" : kind === "zig" ? "~~" : kind === "shh" ? "shh" : kind === "trace" ? "x x" : "*";
  return (
    <span
      className={cn("doodle", kind === "smile" && "doodle-smile", kind === "zig" && "doodle-zig", kind === "star" && "doodle-star", className)}
      style={style}
      aria-hidden
    >
      {text}
    </span>
  );
}

export function Pawn({
  color,
  className,
  size = 50,
}: {
  color: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={cn("pawn", className)}
      style={{ "--pawn-color": color, "--pawn-size": `${size}px` } as CSSProperties}
      aria-hidden
    />
  );
}

export function TabletopScene({
  variant = "home",
  className,
}: {
  variant?: "home" | "setup" | "rooms" | "pricing";
  className?: string;
}) {
  if (variant === "pricing") {
    return (
      <div className={cn("topic-vault", className)}>
        <span className="vault-card" style={{ "--left": "70px", "--bottom": "120px", "--vault-color": "#7ac67a", "--rot": "-7deg" } as CSSProperties}>Cult Movies</span>
        <span className="vault-card" style={{ "--left": "190px", "--bottom": "130px", "--vault-color": "#f5b83d", "--rot": "3deg" } as CSSProperties}>Street Food</span>
        <span className="vault-card" style={{ "--left": "310px", "--bottom": "118px", "--vault-color": "#f35a47", "--rot": "-2deg" } as CSSProperties}>90s Nostalgia</span>
        <span className="vault-card" style={{ "--left": "430px", "--bottom": "126px", "--vault-color": "#62b56c", "--rot": "4deg" } as CSSProperties}>World Capitals</span>
        <span className="vault-card" style={{ "--left": "550px", "--bottom": "112px", "--vault-color": "#f6e0b6", "--rot": "7deg" } as CSSProperties}>Sneakerhead</span>
        <span className="vault-card" style={{ "--left": "135px", "--bottom": "38px", "--vault-color": "#ef604d", "--rot": "-3deg" } as CSSProperties}>Boss Battles</span>
        <span className="vault-card" style={{ "--left": "260px", "--bottom": "28px", "--vault-color": "#8ccf88", "--rot": "2deg" } as CSSProperties}>Cocktails</span>
        <span className="vault-card" style={{ "--left": "385px", "--bottom": "36px", "--vault-color": "#f3c64b", "--rot": "-4deg" } as CSSProperties}>K-Pop</span>
        <div className="absolute bottom-8 left-1/2 z-[4] -translate-x-1/2 rounded-full border border-[#9b6c1d] bg-[#c99432] px-10 py-3 font-display text-2xl text-[#1c1308] shadow-[0_10px_18px_rgba(0,0,0,0.2)]">
          40+ total packs
        </div>
        <DoodleMark kind="lock" className="right-16 top-16" color="#ff5147" size={48} rotate={9} />
        <DoodleMark kind="mask" className="left-10 top-16" color="#fff5df" size={42} rotate={-12} />
      </div>
    );
  }

  if (variant === "setup") {
    return (
      <div className={cn("tabletop-dark min-h-[560px] p-8", className)}>
        <div className="relative z-[1]">
          <div className="mb-5 inline-block rotate-[-3deg] rounded-md bg-[#fff0ce] px-8 py-3 font-display text-xl text-foreground shadow-[0_8px_18px_rgba(0,0,0,0.2)]">
            Tonight&apos;s table
          </div>
          <h2 className="font-display text-4xl text-white">Round preview</h2>
          <div className="mt-5 grid gap-3">
            <PreviewLine label="Players" value="4" />
            <PreviewLine label="Topic pack" value="Random" />
            <PreviewLine label="Impostors" value="1" />
          </div>
          <div className="circle-table mt-8">
            <div className="seat-chip left-1/2 top-0 -translate-x-1/2">
              <Pawn color="#ef493a" className="!relative !left-auto !top-auto mb-2" size={36} />
              <strong>Mira</strong><span className="text-heat">Seat 1</span>
            </div>
            <div className="seat-chip right-5 top-1/2 -translate-y-1/2">
              <Pawn color="#f4b218" className="!relative !left-auto !top-auto mb-2" size={36} />
              <strong>Jules</strong><span className="text-amber">Seat 2</span>
            </div>
            <div className="seat-chip bottom-0 left-1/2 -translate-x-1/2">
              <Pawn color="#15925f" className="!relative !left-auto !top-auto mb-2" size={36} />
              <strong>Nova</strong><span className="text-aqua">Seat 3</span>
            </div>
            <div className="seat-chip left-5 top-1/2 -translate-y-1/2">
              <Pawn color="#1155f6" className="!relative !left-auto !top-auto mb-2" size={36} />
              <strong>Theo</strong><span className="text-brand">Seat 4</span>
            </div>
            <div className="relative z-[2] grid size-32 place-items-center rounded-full border border-white/25 bg-[#06172a] text-center">
              <div>
                <p className="font-display text-3xl text-heat">1</p>
                <p className="font-extrabold text-heat">IMPOSTER</p>
                <p className="font-display text-4xl">?</p>
              </div>
            </div>
          </div>
        </div>
        <DoodleMark kind="eye" className="right-8 top-36" color="#ff5147" />
        <DoodleMark kind="shh" className="bottom-8 right-16" color="#fff3df" />
      </div>
    );
  }

  return (
    <div className={cn("tabletop-dark min-h-[520px] p-6", className)}>
      <div className="relative h-[500px]">
        <div className="word-card left-[38%] top-6" style={{ "--rot": "-4deg" } as CSSProperties}>
          <span>Crew word</span>
          <strong>MOVIES</strong>
        </div>
        <div className="table-card left-[18%] top-[30%]" style={{ "--card-tone": "#15925f", "--rot": "6deg" } as CSSProperties}>
          <strong>MIRA</strong>
          <span>crew</span>
        </div>
        <div className="table-card left-[15%] top-[54%]" style={{ "--card-tone": "#f4b218", "--rot": "4deg" } as CSSProperties}>
          <strong>JULES</strong>
          <span>crew</span>
        </div>
        <div className="table-card left-[46%] top-[56%]" style={{ "--card-tone": "#15925f", "--rot": "8deg" } as CSSProperties}>
          <strong>THEO</strong>
          <span>ready</span>
        </div>
        <div className="table-card left-[25%] top-[72%]" style={{ "--card-tone": "#ef493a", "--rot": "-5deg" } as CSSProperties}>
          <strong>NOVA</strong>
          <span>suspect</span>
        </div>
        <div className="hint-card left-[48%] top-[34%]" style={{ "--rot": "-4deg" } as CSSProperties}>
          <span>Impostor hint</span>
          <strong>NOSTALGIA</strong>
        </div>
        <div className="notebook-card bottom-2 left-[29%]" style={{ "--rot": "-3deg" } as CSSProperties}>
          <p className="mb-4 text-center font-extrabold">Clue read</p>
          <div className="note-row"><span>Too specific</span><b>2</b></div>
          <div className="note-row" data-hot="true"><span>Only knows topic</span><b>3</b></div>
        </div>
        <Pawn color="#15925f" className="left-[18%] top-[29%]" />
        <Pawn color="#f4b218" className="left-[13%] top-[54%]" />
        <Pawn color="#ef493a" className="left-[24%] top-[71%]" />
        <Pawn color="#15925f" className="left-[47%] top-[55%]" />
        <div className="absolute bottom-6 right-4 z-[5] hidden h-56 w-5 rotate-[-15deg] rounded-full bg-amber shadow-[0_12px_18px_rgba(0,0,0,0.22)] md:block" />
        {variant === "rooms" && (
          <div className="absolute right-8 top-[22%] z-[5] w-[230px] rounded-2xl border border-white/12 bg-[#07182a]/92 p-5 shadow-[0_18px_34px_rgba(0,0,0,0.2)]">
            <p className="font-display text-2xl">Room HUSH</p>
            <p className="mt-2 text-sm text-white/70">Public lobbies looking for players</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              {["M", "J", "N", "T"].map((initial, index) => (
                <span key={initial} className="grid gap-1">
                  <span className="mx-auto grid size-10 place-items-center rounded-full" style={{ background: ["#15925f", "#8bd2b6", "#ef493a", "#8bd2b6"][index] }}>{initial}</span>
                  <span className="text-xs text-white/70">ready</span>
                </span>
              ))}
            </div>
          </div>
        )}
        <DoodleMark kind="mask" className="left-[6%] top-[10%]" color="#ff5147" size={52} />
        <DoodleMark kind="eye" className="left-[26%] top-[15%]" color="#f4b218" size={44} />
        <DoodleMark kind="shh" className="right-[12%] top-[8%]" color="#fff5df" size={44} />
      </div>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/12 bg-[#06172a]/72 px-4 py-3 text-sm">
      <span className="text-white/72">{label}</span>
      <strong className="text-white">{value}</strong>
    </div>
  );
}

export function HowItWorksStrip({
  mode = "home",
}: {
  mode?: "home" | "setup";
}) {
  const steps =
    mode === "setup"
      ? [
          { title: "Set table", text: "Seats and pack", color: "var(--brand)" },
          { title: "Deal roles", text: "Pass the device", color: "var(--amber)" },
          { title: "Clues", text: "One word each", color: "var(--aqua)" },
          { title: "Vote", text: "Find the bluff", color: "var(--heat)" },
        ]
      : [
          { title: "Reveal", text: "Get a secret word", color: "var(--aqua)" },
          { title: "Give a clue", text: "One clue about the word", color: "var(--amber)" },
          { title: "Vote", text: "Spot the bluff, save the word", color: "var(--heat)" },
          { title: "Fast rounds", text: "One phone or online", color: "var(--brand)" },
        ];

  return (
    <div className="how-strip">
      <div>
        <p className="font-display text-2xl leading-none">How it<br />works</p>
        <span className="mt-2 block h-1 w-20 rotate-[-3deg] rounded-full bg-heat" />
      </div>
      {steps.map((step, index) => (
        <div key={step.title} className="how-step">
          <span className="step-dot" style={{ "--step-color": step.color } as CSSProperties}>
            {index + 1}
          </span>
          <div>
            <h3 className="text-lg font-extrabold">{step.title}</h3>
            <p className="text-sm font-bold leading-5 text-muted">{step.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function InlineStyleVars({ style }: { style?: CSSProperties }) {
  return <span aria-hidden style={style} />;
}
