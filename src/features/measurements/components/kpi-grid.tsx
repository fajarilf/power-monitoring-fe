"use client";

import { StatCard } from "./stat-card";
import { useLiveReading } from "../hooks/use-live-reading";
import { PF_THRESHOLD } from "../utils/constants";

const STATUS_LABEL = { connecting: "connecting…", live: "live", offline: "offline" } as const;
const STATUS_COLOR = { connecting: "var(--text-dim)", live: "var(--good)", offline: "var(--alert)" } as const;

export function KpiGrid() {
  const { reading, status } = useLiveReading();

  const statusLine = (
    <span style={{ color: STATUS_COLOR[status] }}>
      ● {STATUS_LABEL[status]}
      {reading && ` · ${reading.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`}
    </span>
  );

  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Energy (WP+)" value={(reading?.kwh ?? 0) / 10} unit="kWh" accent="var(--phase-t)">
        {statusLine}
      </StatCard>
      <StatCard label="Active Power" value={(reading?.kw ?? 0) / 10} unit="kW" accent="var(--warning)">
        {statusLine}
      </StatCard>
      <StatCard label="Reactive Power" value={(reading?.kvar ?? 0) / 10} unit="kvar" accent="var(--phase-s)">
        {statusLine}
      </StatCard>
      <StatCard label="Power Factor" value={(reading?.pf ?? 0) / 10} unit="" digits={3} accent="var(--good)">
        {reading ? (
          <span style={{ color: reading.pf >= PF_THRESHOLD ? "var(--good)" : "var(--warning)" }}>
            ● {reading.pf >= PF_THRESHOLD ? "within target" : "below target"}
          </span>
        ) : (
          statusLine
        )}
      </StatCard>
    </div>
  );
}
