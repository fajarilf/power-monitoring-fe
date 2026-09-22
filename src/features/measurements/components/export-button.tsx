"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { useMeasurements, useMeasurementsSummary } from "../api/measurements.queries";
import { COLUMNS } from "../utils/columns";
import type { MeasurementSummary, Reading, Stats } from "../api/measurements.types";

function scaleVolts(s: Stats): Stats {
  return { ...s, u1: s.u1 / 10, u2: s.u2 / 10, u3: s.u3 / 10, q: s.q / 10, pf: s.pf / 1000 };
}

function scaleStats(stats: MeasurementSummary): MeasurementSummary {
  return { avg: scaleVolts(stats.avg), max: scaleVolts(stats.max), min: scaleVolts(stats.min) };
}

function scaleRows(rows: Reading[]): Reading[] {
  return rows.map((r) => ({ ...r, ...scaleVolts(r) }));
}

const HEADER = ["Date", "Time", ...COLUMNS.map((c) => c.label)];

function statRow(label: string, s: Stats) {
  return [label, "", ...COLUMNS.map((c) => s[c.key].toFixed(c.digits))];
}

function dataRow(r: Reading) {
  return [
    r.ts.toLocaleDateString(),
    r.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    ...COLUMNS.map((c) => r[c.key].toFixed(c.digits)),
  ];
}

export interface ExportButtonProps {
  from: string;
  to: string;
}

export function ExportButton({ from, to }: ExportButtonProps) {
  // Same hooks (same query keys) as LogTableContainer — TanStack serves this
  // from cache, so export never costs an extra request and can't disagree
  // with what's on screen.
  const rowsQuery = useMeasurements({ from, to });
  const statsQuery = useMeasurementsSummary({ from, to });

  const disabled = rowsQuery.isPending || statsQuery.isPending || !!rowsQuery.error || !!statsQuery.error;

  function handleExport() {
    if (!rowsQuery.data || !statsQuery.data) return;
    const stats = scaleStats(statsQuery.data);
    const rows = scaleRows(rowsQuery.data);
    const aoa = [
      HEADER,
      statRow("Average", stats.avg),
      statRow("Maximum", stats.max),
      statRow("Minimum", stats.min),
      ...rows.map(dataRow),
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // merge the Date+Time columns for the three summary label rows (rows 1-3, 0-indexed)
    ws["!merges"] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } },
      { s: { r: 3, c: 0 }, e: { r: 3, c: 1 } },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Log History");
    XLSX.writeFile(wb, `power-log_${from}_${to}.xlsx`);
  }

  return (
    <Button type="button" variant="secondary" onClick={handleExport} disabled={disabled}>
      Export to Excel
    </Button>
  );
}
