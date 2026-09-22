// No functions. No imports from the service or queries.

export interface Reading {
  ts: Date;
  u1: number; // U1-R (V)
  u2: number; // U2-S (V)
  u3: number; // U3-T (V)
  i1: number; // I1-R (A)
  i2: number; // I2-S (A)
  i3: number; // I3-T (A)
  s: number; // S (kVA)
  p: number; // P (kW)
  q: number; // Q (kvar)
  pf: number; // PF
  wp: number; // WP+ (kWh), cumulative register
}

export type Stats = Omit<Reading, "ts">;

export interface MeasurementSummary {
  avg: Stats;
  max: Stats;
  min: Stats;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface GetMeasurementsParams extends DateRange {
  paginate?: boolean;
}

export interface ApiMeasurement {
  id: number;
  deviceId: number;
  deviceName: string;
  u1R: number;
  u2S: number;
  u3T: number;
  i1R: number;
  i2S: number;
  i3T: number;
  kva: number;
  kw: number;
  kvar: number;
  pf: number;
  wpPlus: number;
  recordedAt: string;
}

// One calendar-day aggregate bucket from GET /api/measurements/{deviceId}/daily.
// Casing genuinely differs from ApiMeasurement (kvA/kW/kvaR/pF here vs.
// kva/kw/kvar/pf there) — transcribed exactly from the backend's payload.
export interface ApiDailyAggregate {
  deviceId: number;
  bucket: string;
  u1R_Avg: number;
  u1R_Min: number;
  u1R_Max: number;
  u2S_Avg: number;
  u2S_Min: number;
  u2S_Max: number;
  u3T_Avg: number;
  u3T_Min: number;
  u3T_Max: number;
  i1R_Avg: number;
  i1R_Min: number;
  i1R_Max: number;
  i2S_Avg: number;
  i2S_Min: number;
  i2S_Max: number;
  i3T_Avg: number;
  i3T_Min: number;
  i3T_Max: number;
  kvA_Avg: number;
  kvA_Min: number;
  kvA_Max: number;
  kW_Avg: number;
  kW_Min: number;
  kW_Max: number;
  kvaR_Avg: number;
  kvaR_Min: number;
  kvaR_Max: number;
  pF_Avg: number;
  pF_Min: number;
  pF_Max: number;
  wpPlus_Avg: number;
  wpPlus_Min: number;
  wpPlus_Max: number;
  sampleCount: number;
}

// One MQTT message published by the meter. voltage/current are present on
// the wire but unused by the live KPI cards.
export interface MqttMeasurement {
  timestamp: string;
  data: {
    voltage: { rs: number; st: number; tr: number };
    current: { rs: number; st: number; tr: number };
    power: { kva: number; kw: number; kvar: number; factor: number };
    energy: { wp_plus_kwh: number };
  };
}

export interface LiveReading {
  ts: Date;
  kwh: number;
  kw: number;
  kvar: number;
  pf: number;
}
