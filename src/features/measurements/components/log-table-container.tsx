"use client";

import { useMeasurements, useMeasurementsSummary } from "../api/measurements.queries";
import { LogTable } from "./log-table";
import type { DateRange, MeasurementSummary, Reading, Stats } from "../api/measurements.types";

export interface LogTableContainerProps {
  range: DateRange;
}

function scaleVolts(s: Stats): Stats {
  return { ...s, u1: s.u1 / 10, u2: s.u2 / 10, u3: s.u3 / 10 };
}

function scaleStats(stats: MeasurementSummary | undefined): MeasurementSummary | undefined {
  return stats && { avg: scaleVolts(stats.avg), max: scaleVolts(stats.max), min: scaleVolts(stats.min) };
}

function scaleRows(rows: Reading[]): Reading[] {
  return rows.map((r) => ({ ...r, ...scaleVolts(r) }));
}

export function LogTableContainer({ range }: LogTableContainerProps) {
  const rowsQuery = useMeasurements(range);
  const statsQuery = useMeasurementsSummary(range);

  const loading = rowsQuery.isPending || statsQuery.isPending;
  // Narrowed to the rows query on purpose: a hiccup on the secondary summary
  // query shouldn't blank out a table whose rows loaded fine.
  const error = rowsQuery.error;

  return (
    <LogTable
      rows={scaleRows(rowsQuery.data ?? [])}
      stats={scaleStats(statsQuery.data)}
      loading={loading}
      error={error}
      onRetry={() => {
        rowsQuery.refetch();
        statsQuery.refetch();
      }}
    />
  );
}
