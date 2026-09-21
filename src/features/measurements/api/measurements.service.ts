import { apiGet } from "@/lib/api-client";
import { toReading, toDailySummary, deduplicateByMinute } from "../utils/map-measurement";
import type { ApiDailyAggregate, ApiMeasurement, GetMeasurementsParams, MeasurementSummary, Reading } from "./measurements.types";

// ponytail: one device exists today (/api/devices). Promote to a parameter
// when a device selector does.
export const DEVICE_ID = 1;

export async function getMeasurements({ from, to }: GetMeasurementsParams): Promise<Reading[]> {
  const data = await apiGet<ApiMeasurement[]>("/api/measurements", { deviceId: DEVICE_ID, from, to, page: 1, limit: 5000 });
  // Table reads newest-first (most recent reading on top); sort here rather
  // than reorder every consumer.
  return deduplicateByMinute(data.map(toReading).sort((a, b) => b.ts.getTime() - a.ts.getTime()));
}

export async function getMeasurementsSummary({ from, to }: GetMeasurementsParams): Promise<MeasurementSummary> {
  const data = await apiGet<ApiDailyAggregate[]>(`/api/measurements/${DEVICE_ID}/daily`, { from, to });
  return toDailySummary(data);
}
