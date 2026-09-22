import { useQuery } from "@tanstack/react-query";
import { getMeasurements, getMeasurementsSummary, DEVICE_ID } from "./measurements.service";
import type { GetMeasurementsParams } from "./measurements.types";

export const measurementKeys = {
  all: ["measurements"] as const,
  lists: () => [...measurementKeys.all, "list"] as const,
  list: (params: GetMeasurementsParams) => [...measurementKeys.lists(), DEVICE_ID, params] as const,
  summaries: () => [...measurementKeys.all, "summary"] as const,
  summary: (params: GetMeasurementsParams) => [...measurementKeys.summaries(), DEVICE_ID, params] as const,
  exports: () => [...measurementKeys.all, "export"] as const,
  export: (params: GetMeasurementsParams) => [...measurementKeys.exports(), DEVICE_ID, params] as const,
};

const REFETCH_MS = 60_000;

export function useMeasurements(params: GetMeasurementsParams) {
  return useQuery({ queryKey: measurementKeys.list(params), queryFn: () => getMeasurements(params), refetchInterval: REFETCH_MS });
}

export function useMeasurementsSummary(params: GetMeasurementsParams) {
  return useQuery({ queryKey: measurementKeys.summary(params), queryFn: () => getMeasurementsSummary(params), refetchInterval: REFETCH_MS });
}

export function useMeasurementsForExport(params: GetMeasurementsParams) {
  return useQuery({
    queryKey: measurementKeys.export(params),
    queryFn: () => getMeasurements({ ...params, paginate: false }),
    enabled: false,
  });
}
