/**
 * Impostor brand character library.
 *
 * Full-body  → used for showcase sections
 * Head       → used for header logo, page corner decorations
 * Mini       → used for scattered inline decorations
 */

import { cn } from "@/lib/utils";

/* ─── IMPOSTOR ───────────────────────────────────────────────────────────── */

export function ImpostorFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-36 h-auto sm:w-44", className)}
      aria-label="Impostor character"
    >
      {/* Cloak */}
      <path d="M28 112 Q80 94 132 112 L142 222 Q80 242 18 222 Z" fill="#150d30" />
      {/* Hood back */}
      <path d="M46 70 Q80 46 114 70 Q108 48 80 36 Q52 48 46 70Z" fill="#0e0720" />
      {/* Head */}
      <ellipse cx="80" cy="84" rx="34" ry="33" fill="#201548" />
      {/* Hood rim shadow */}
      <path d="M47 76 Q80 62 113 76 Q110 68 80 64 Q50 68 47 76Z" fill="#12092c" opacity="0.7" />
      {/* Left eye glow */}
      <ellipse cx="66" cy="85" rx="10" ry="10" fill="#8070d4" opacity="0.12" />
      <ellipse cx="66" cy="85" rx="6" ry="6" fill="#9080e0" />
      <ellipse cx="64" cy="83" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.35)" />
      {/* Right eye glow */}
      <ellipse cx="94" cy="85" rx="10" ry="10" fill="#8070d4" opacity="0.12" />
      <ellipse cx="94" cy="85" rx="6" ry="6" fill="#9080e0" />
      <ellipse cx="92" cy="83" rx="2.5" ry="2.5" fill="rgba(255,255,255,0.35)" />
      {/* Smirk */}
      <path d="M70 100 Q80 104 90 100" stroke="#4d3590" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />
      {/* Right arm raised */}
      <path d="M110 120 Q122 100 110 84" stroke="#1c1240" strokeWidth="15" strokeLinecap="round" />
      <path d="M110 84 Q98 73 84 78" stroke="#1c1240" strokeWidth="12" strokeLinecap="round" />
      <ellipse cx="80" cy="80" rx="11" ry="10" fill="#2a1e58" />
      {/* Index finger at lips */}
      <path d="M79 80 Q77 66 79 60" stroke="#3a2870" strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="79" cy="57" r="4.5" fill="#3a2870" />
      {/* Left arm hanging */}
      <path d="M50 120 Q38 138 40 153" stroke="#1c1240" strokeWidth="15" strokeLinecap="round" />
      <ellipse cx="40" cy="156" rx="11" ry="9" fill="#2a1e58" />
    </svg>
  );
}

export function ImpostorHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-auto", className)}
      aria-hidden
    >
      <path d="M14 28 Q28 14 42 28 Q38 16 28 10 Q18 16 14 28Z" fill="#0e0720" />
      <ellipse cx="28" cy="36" rx="18" ry="18" fill="#201548" />
      <path d="M14 30 Q28 22 42 30 Q40 26 28 24 Q16 26 14 30Z" fill="#12092c" opacity="0.75" />
      <ellipse cx="21" cy="36" rx="5" ry="5" fill="#8070d4" opacity="0.18" />
      <ellipse cx="21" cy="36" rx="3.2" ry="3.2" fill="#9080e0" />
      <ellipse cx="20" cy="35" rx="1.1" ry="1.1" fill="rgba(255,255,255,0.4)" />
      <ellipse cx="35" cy="36" rx="5" ry="5" fill="#8070d4" opacity="0.18" />
      <ellipse cx="35" cy="36" rx="3.2" ry="3.2" fill="#9080e0" />
      <ellipse cx="34" cy="35" rx="1.1" ry="1.1" fill="rgba(255,255,255,0.4)" />
      <path d="M23 44 Q28 47 33 44" stroke="#4d3590" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M37 42 Q40 37 38 33" stroke="#2a1e58" strokeWidth="3" strokeLinecap="round" />
      <circle cx="38" cy="31" r="2.2" fill="#2a1e58" />
    </svg>
  );
}

/* ─── INNOCENT ───────────────────────────────────────────────────────────── */

export function InnocentFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-36 h-auto sm:w-44", className)}
      aria-label="Innocent character"
    >
      <ellipse cx="80" cy="160" rx="36" ry="46" fill="#0d2840" />
      <rect x="72" y="110" width="16" height="20" rx="8" fill="#163a58" />
      <circle cx="80" cy="90" r="34" fill="#163a58" />
      <circle cx="64" cy="86" r="10" fill="rgba(255,255,255,0.88)" />
      <circle cx="64" cy="86" r="6" fill="#4d94b8" />
      <circle cx="64" cy="86" r="3" fill="#0d2840" />
      <circle cx="66" cy="84" r="2" fill="rgba(255,255,255,0.9)" />
      <circle cx="96" cy="86" r="10" fill="rgba(255,255,255,0.88)" />
      <circle cx="96" cy="86" r="6" fill="#4d94b8" />
      <circle cx="96" cy="86" r="3" fill="#0d2840" />
      <circle cx="98" cy="84" r="2" fill="rgba(255,255,255,0.9)" />
      <ellipse cx="80" cy="106" rx="7" ry="6" fill="#0a1e30" />
      <path d="M73 106 Q80 111 87 106" stroke="#4d94b8" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M48 136 Q34 112 38 86" stroke="#163a58" strokeWidth="15" strokeLinecap="round" />
      <ellipse cx="38" cy="83" rx="11" ry="10" fill="#1f4d6a" />
      <path d="M34 78 Q31 68 33 62" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M38 76 Q36 66 38 60" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M42 78 Q42 68 44 62" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M112 136 Q126 112 122 86" stroke="#163a58" strokeWidth="15" strokeLinecap="round" />
      <ellipse cx="122" cy="83" rx="11" ry="10" fill="#1f4d6a" />
      <path d="M118 78 Q116 68 118 62" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M122 76 Q121 66 124 60" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
      <path d="M126 78 Q127 68 130 62" stroke="#1f4d6a" strokeWidth="5.5" strokeLinecap="round" />
    </svg>
  );
}

export function InnocentHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-auto", className)}
      aria-hidden
    >
      <circle cx="28" cy="28" r="22" fill="#163a58" />
      <circle cx="19" cy="26" r="6.5" fill="rgba(255,255,255,0.88)" />
      <circle cx="19" cy="26" r="4" fill="#4d94b8" />
      <circle cx="19" cy="26" r="2" fill="#0d2840" />
      <circle cx="20" cy="25" r="1.2" fill="rgba(255,255,255,0.9)" />
      <circle cx="37" cy="26" r="6.5" fill="rgba(255,255,255,0.88)" />
      <circle cx="37" cy="26" r="4" fill="#4d94b8" />
      <circle cx="37" cy="26" r="2" fill="#0d2840" />
      <circle cx="38" cy="25" r="1.2" fill="rgba(255,255,255,0.9)" />
      <ellipse cx="28" cy="38" rx="4.5" ry="4" fill="#0a1e30" />
      <path d="M8 22 Q6 16 8 12" stroke="#163a58" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M48 22 Q50 16 48 12" stroke="#163a58" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

/* ─── DETECTIVE ──────────────────────────────────────────────────────────── */

export function DetectiveFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-36 h-auto sm:w-44", className)}
      aria-label="Detective character"
    >
      {/* Trench coat body */}
      <path d="M32 118 Q80 100 128 118 L136 225 Q80 238 24 225 Z" fill="#1a2340" />
      {/* Belt */}
      <rect x="32" y="155" width="96" height="9" rx="4" fill="#111827" />
      <rect x="72" y="152" width="16" height="15" rx="3" fill="#b87333" opacity="0.8" />
      {/* Coat lapels */}
      <path d="M80 118 L62 145 L80 140 Z" fill="#111827" opacity="0.6" />
      <path d="M80 118 L98 145 L80 140 Z" fill="#111827" opacity="0.6" />
      {/* Neck */}
      <rect x="73" y="108" width="14" height="14" rx="7" fill="#243050" />
      {/* Head */}
      <ellipse cx="80" cy="84" rx="30" ry="29" fill="#243050" />
      {/* Hat brim */}
      <ellipse cx="80" cy="55" rx="40" ry="7" fill="#0f172a" />
      {/* Hat crown */}
      <path d="M48 55 Q52 28 80 24 Q108 28 112 55 Z" fill="#1e293b" />
      {/* Hat band */}
      <path d="M50 55 Q80 50 110 55" stroke="#b87333" strokeWidth="3.5" opacity="0.7" />
      {/* Left eye — squint/focused */}
      <ellipse cx="68" cy="83" rx="7" ry="5" fill="#0d1a2a" />
      <ellipse cx="68" cy="83" rx="4" ry="3" fill="#3a6080" />
      <circle cx="69" cy="82" r="1.3" fill="rgba(255,255,255,0.5)" />
      {/* Right eye */}
      <ellipse cx="92" cy="83" rx="7" ry="5" fill="#0d1a2a" />
      <ellipse cx="92" cy="83" rx="4" ry="3" fill="#3a6080" />
      <circle cx="93" cy="82" r="1.3" fill="rgba(255,255,255,0.5)" />
      {/* Stern mouth */}
      <path d="M72 97 Q80 95 88 97" stroke="#243050" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* Right arm with magnifying glass */}
      <path d="M120 120 Q136 140 132 162" stroke="#1a2340" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="130" cy="166" rx="10" ry="9" fill="#243050" />
      {/* Magnifying glass */}
      <circle cx="138" cy="185" r="14" stroke="#b87333" strokeWidth="4" opacity="0.85" fill="rgba(184,115,51,0.06)" />
      <path d="M128 197 Q118 210 112 218" stroke="#b87333" strokeWidth="4.5" strokeLinecap="round" opacity="0.75" />
      {/* Lens glint */}
      <circle cx="133" cy="180" r="3.5" fill="rgba(184,115,51,0.25)" />
      {/* Left arm hanging */}
      <path d="M40 120 Q26 140 28 158" stroke="#1a2340" strokeWidth="16" strokeLinecap="round" />
      <ellipse cx="28" cy="162" rx="10" ry="9" fill="#243050" />
    </svg>
  );
}

export function DetectiveHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-auto", className)}
      aria-hidden
    >
      {/* Hat brim */}
      <ellipse cx="28" cy="20" rx="26" ry="5" fill="#0f172a" />
      {/* Hat crown */}
      <path d="M16 20 Q18 8 28 6 Q38 8 40 20 Z" fill="#1e293b" />
      {/* Hat band */}
      <path d="M17 20 Q28 17 39 20" stroke="#b87333" strokeWidth="2.5" opacity="0.7" />
      {/* Head */}
      <ellipse cx="28" cy="42" rx="20" ry="20" fill="#243050" />
      {/* Left eye */}
      <ellipse cx="21" cy="40" rx="4.5" ry="3.2" fill="#0d1a2a" />
      <ellipse cx="21" cy="40" rx="2.8" ry="2" fill="#3a6080" />
      <circle cx="22" cy="39" r="0.9" fill="rgba(255,255,255,0.5)" />
      {/* Right eye */}
      <ellipse cx="35" cy="40" rx="4.5" ry="3.2" fill="#0d1a2a" />
      <ellipse cx="35" cy="40" rx="2.8" ry="2" fill="#3a6080" />
      <circle cx="36" cy="39" r="0.9" fill="rgba(255,255,255,0.5)" />
      {/* Stern mouth */}
      <path d="M22 50 Q28 48 34 50" stroke="#1a2d45" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* ─── GHOST ──────────────────────────────────────────────────────────────── */

export function GhostFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-36 h-auto sm:w-44", className)}
      aria-label="Ghost character"
    >
      {/* Outer glow */}
      <ellipse cx="80" cy="110" rx="60" ry="85" fill="rgba(128,112,212,0.06)" />
      {/* Ghost body */}
      <path
        d="M30 100 Q30 48 80 40 Q130 48 130 100 L130 175 Q120 185 110 172 Q100 160 90 172 Q80 185 70 172 Q60 160 50 172 Q40 185 30 175 Z"
        fill="rgba(200,195,235,0.18)"
        stroke="rgba(200,195,235,0.3)"
        strokeWidth="1.5"
      />
      {/* Inner glow core */}
      <ellipse cx="80" cy="100" rx="42" ry="52" fill="rgba(150,140,210,0.1)" />
      {/* Left eye — hollow */}
      <ellipse cx="62" cy="90" rx="11" ry="12" fill="rgba(15,10,40,0.85)" />
      <ellipse cx="62" cy="90" rx="6" ry="7" fill="rgba(8,6,24,0.9)" />
      <circle cx="58" cy="87" r="2.5" fill="rgba(255,255,255,0.15)" />
      {/* Right eye — hollow */}
      <ellipse cx="98" cy="90" rx="11" ry="12" fill="rgba(15,10,40,0.85)" />
      <ellipse cx="98" cy="90" rx="6" ry="7" fill="rgba(8,6,24,0.9)" />
      <circle cx="94" cy="87" r="2.5" fill="rgba(255,255,255,0.15)" />
      {/* Mischievous grin */}
      <path d="M62 112 Q70 120 80 116 Q90 120 98 112" stroke="rgba(15,10,40,0.7)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Small hands on sides */}
      <ellipse cx="28" cy="130" rx="9" ry="8" fill="rgba(200,195,235,0.15)" stroke="rgba(200,195,235,0.25)" strokeWidth="1" />
      <ellipse cx="132" cy="130" rx="9" ry="8" fill="rgba(200,195,235,0.15)" stroke="rgba(200,195,235,0.25)" strokeWidth="1" />
      {/* Wavy bottom fringe shine */}
      <path
        d="M30 175 Q35 168 40 175 Q45 182 50 172 Q55 162 60 172 Q65 182 70 172 Q75 162 80 172 Q85 182 90 172 Q95 162 100 172 Q105 182 110 172 Q115 162 120 172 Q125 182 130 175"
        stroke="rgba(200,195,235,0.2)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}

export function GhostHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 68"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-auto", className)}
      aria-hidden
    >
      <ellipse cx="28" cy="26" rx="22" ry="22" fill="rgba(128,112,212,0.06)" />
      <path
        d="M8 26 Q8 6 28 4 Q48 6 48 26 L48 44 Q44 50 40 44 Q36 38 28 44 Q20 50 16 44 Q12 38 8 44 Z"
        fill="rgba(200,195,235,0.2)"
        stroke="rgba(200,195,235,0.35)"
        strokeWidth="1.2"
      />
      {/* Eyes */}
      <ellipse cx="19" cy="24" rx="5.5" ry="6" fill="rgba(15,10,40,0.85)" />
      <circle cx="17" cy="22" r="1.5" fill="rgba(255,255,255,0.15)" />
      <ellipse cx="37" cy="24" rx="5.5" ry="6" fill="rgba(15,10,40,0.85)" />
      <circle cx="35" cy="22" r="1.5" fill="rgba(255,255,255,0.15)" />
      {/* Grin */}
      <path d="M20 34 Q24 38 28 36 Q32 38 36 34" stroke="rgba(15,10,40,0.65)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ─── SPECTATOR ──────────────────────────────────────────────────────────── */

export function SpectatorFull({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-36 h-auto sm:w-44", className)}
      aria-label="Spectator character"
    >
      {/* Body — relaxed stance, slight lean */}
      <path d="M34 116 Q80 100 126 116 L130 222 Q80 238 30 222 Z" fill="#1a3040" />
      {/* Neck */}
      <rect x="73" y="108" width="14" height="14" rx="7" fill="#1f4055" />
      {/* Head — slightly tilted */}
      <ellipse cx="82" cy="83" rx="31" ry="30" fill="#1f4055" />
      {/* Left eye — half-closed / observant */}
      <ellipse cx="70" cy="82" rx="8" ry="6" fill="#0e2535" />
      <ellipse cx="70" cy="82" rx="5" ry="4" fill="#2a6080" />
      <circle cx="71" cy="81" r="1.8" fill="rgba(255,255,255,0.6)" />
      {/* Eyelid upper */}
      <path d="M62 79 Q70 76 78 79" stroke="#1f4055" strokeWidth="3.5" strokeLinecap="round" />
      {/* Right eye */}
      <ellipse cx="94" cy="82" rx="8" ry="6" fill="#0e2535" />
      <ellipse cx="94" cy="82" rx="5" ry="4" fill="#2a6080" />
      <circle cx="95" cy="81" r="1.8" fill="rgba(255,255,255,0.6)" />
      <path d="M86 79 Q94 76 102 79" stroke="#1f4055" strokeWidth="3.5" strokeLinecap="round" />
      {/* Mouth — slight smirk */}
      <path d="M74 98 Q82 102 90 99" stroke="#1a3040" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
      {/* Arms crossed */}
      {/* Left arm going right across body */}
      <path d="M44 120 Q52 132 76 136" stroke="#1a3040" strokeWidth="16" strokeLinecap="round" />
      <path d="M44 130 Q52 122 76 128" stroke="#1a3040" strokeWidth="10" strokeLinecap="round" />
      {/* Right arm going left across body */}
      <path d="M116 120 Q108 132 84 136" stroke="#1a3040" strokeWidth="16" strokeLinecap="round" />
      <path d="M116 130 Q108 122 84 128" stroke="#1a3040" strokeWidth="10" strokeLinecap="round" />
      {/* Hands peeking out */}
      <ellipse cx="42" cy="132" rx="11" ry="9" fill="#2a5570" />
      <ellipse cx="118" cy="132" rx="11" ry="9" fill="#2a5570" />
    </svg>
  );
}

export function SpectatorHead({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-7 h-auto", className)}
      aria-hidden
    >
      <ellipse cx="28" cy="28" rx="22" ry="21" fill="#1f4055" />
      {/* Left eye — half-closed */}
      <ellipse cx="19" cy="26" rx="5.5" ry="4" fill="#0e2535" />
      <ellipse cx="19" cy="26" rx="3.5" ry="2.6" fill="#2a6080" />
      <circle cx="20" cy="25" r="1.2" fill="rgba(255,255,255,0.6)" />
      <path d="M13.5 23.5 Q19 21 24.5 23.5" stroke="#1f4055" strokeWidth="2.5" strokeLinecap="round" />
      {/* Right eye */}
      <ellipse cx="37" cy="26" rx="5.5" ry="4" fill="#0e2535" />
      <ellipse cx="37" cy="26" rx="3.5" ry="2.6" fill="#2a6080" />
      <circle cx="38" cy="25" r="1.2" fill="rgba(255,255,255,0.6)" />
      <path d="M31.5 23.5 Q37 21 42.5 23.5" stroke="#1f4055" strokeWidth="2.5" strokeLinecap="round" />
      {/* Smirk */}
      <path d="M21 36 Q28 39 35 37" stroke="#1a3040" strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

/* ─── MINI DECORATIONS ───────────────────────────────────────────────────── */

/** Tiny impostor silhouette — scattered on pages as ambient decoration */
export function ImpostorMini({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-auto", className)}
      aria-hidden
    >
      <path d="M8 20 Q16 14 24 20 L26 38 Q16 42 6 38 Z" fill="rgba(128,112,212,0.2)" />
      <path d="M9 14 Q16 8 23 14 Q21 8 16 5 Q11 8 9 14Z" fill="rgba(128,112,212,0.15)" />
      <ellipse cx="16" cy="16" rx="8" ry="8" fill="rgba(128,112,212,0.25)" />
      <ellipse cx="12" cy="16" rx="2.5" ry="2.5" fill="rgba(160,144,232,0.6)" />
      <ellipse cx="20" cy="16" rx="2.5" ry="2.5" fill="rgba(160,144,232,0.6)" />
    </svg>
  );
}

/** Tiny innocent silhouette */
export function InnocentMini({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-auto", className)}
      aria-hidden
    >
      <ellipse cx="16" cy="25" rx="10" ry="13" fill="rgba(77,148,184,0.18)" />
      <circle cx="16" cy="14" r="9" fill="rgba(77,148,184,0.22)" />
      <circle cx="12" cy="13" r="3" fill="rgba(255,255,255,0.25)" />
      <circle cx="20" cy="13" r="3" fill="rgba(255,255,255,0.25)" />
      <path d="M8 10 Q6 6 8 3" stroke="rgba(77,148,184,0.3)" strokeWidth="2" strokeLinecap="round" />
      <path d="M24 10 Q26 6 24 3" stroke="rgba(77,148,184,0.3)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Tiny ghost silhouette */
export function GhostMini({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-auto", className)}
      aria-hidden
    >
      <path
        d="M6 18 Q6 6 16 4 Q26 6 26 18 L26 32 Q23 36 20 32 Q18 28 16 32 Q14 36 12 32 Q9 28 6 32 Z"
        fill="rgba(200,195,235,0.15)"
        stroke="rgba(200,195,235,0.2)"
        strokeWidth="1"
      />
      <ellipse cx="11" cy="17" rx="3" ry="3.5" fill="rgba(10,6,24,0.6)" />
      <ellipse cx="21" cy="17" rx="3" ry="3.5" fill="rgba(10,6,24,0.6)" />
    </svg>
  );
}

/** Tiny detective silhouette */
export function DetectiveMini({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-6 h-auto", className)}
      aria-hidden
    >
      <ellipse cx="16" cy="10" rx="12" ry="2.5" fill="rgba(30,41,59,0.5)" />
      <path d="M10 10 Q12 4 16 3 Q20 4 22 10 Z" fill="rgba(30,41,59,0.45)" />
      <ellipse cx="16" cy="18" rx="9" ry="9" fill="rgba(36,48,80,0.4)" />
      <ellipse cx="12" cy="17" rx="2.5" ry="1.8" fill="rgba(58,96,128,0.6)" />
      <ellipse cx="20" cy="17" rx="2.5" ry="1.8" fill="rgba(58,96,128,0.6)" />
      <path d="M8 28 Q16 22 24 28 L26 42 Q16 46 6 42 Z" fill="rgba(26,35,64,0.4)" />
    </svg>
  );
}
