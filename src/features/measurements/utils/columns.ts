import type { Reading } from "../api/measurements.types";

export type Phase = "r" | "s" | "t";

export interface Column {
  key: keyof Omit<Reading, "ts">;
  label: string;
  digits: number;
  phase?: Phase;
}

// Drives the table header, table cells, stat rows, and xlsx export — one
// definition instead of the header/cell list written out three times.
export const COLUMNS: Column[] = [
  { key: "u1", label: "U1-R (V)", digits: 1, phase: "r" },
  { key: "u2", label: "U2-S (V)", digits: 1, phase: "s" },
  { key: "u3", label: "U3-T (V)", digits: 1, phase: "t" },
  { key: "i1", label: "I1-R (A)", digits: 2, phase: "r" },
  { key: "i2", label: "I2-S (A)", digits: 2, phase: "s" },
  { key: "i3", label: "I3-T (A)", digits: 2, phase: "t" },
  { key: "s", label: "S (kVA)", digits: 2 },
  { key: "p", label: "P (kW)", digits: 2 },
  { key: "q", label: "Q (kvar)", digits: 2 },
  { key: "pf", label: "PF", digits: 3 },
  { key: "wp", label: "WP+ (MWh)", digits: 2 },
];

export const PHASE_COLOR: Record<Phase, string> = {
  r: "var(--phase-r)",
  s: "var(--phase-s)",
  t: "var(--phase-t)",
};

export const PHASE_BG: Record<Phase, string> = {
  r: "var(--phase-r-bg)",
  s: "var(--phase-s-bg)",
  t: "var(--phase-t-bg)",
};

export const PHASE_LABEL: Record<Phase, string> = { r: "Phase A", s: "Phase B", t: "Phase C" };
