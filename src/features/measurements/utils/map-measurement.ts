// Field mapping between the wire format and the domain Reading/Stats shapes.
// Only `import type` here — type imports erase at runtime, so this file
// resolves under `node --test` with no bundler alias, keeping the mapper
// test runnable without pulling in the API client or env config.

import type {
  ApiDailyAggregate,
  ApiMeasurement,
  LiveReading,
  MeasurementSummary,
  MqttMeasurement,
  Reading,
  Stats,
} from "../api/measurements.types";

export function toReading(m: ApiMeasurement): Reading {
  return {
    ts: new Date(m.recordedAt),
    u1: m.u1R,
    u2: m.u2S,
    u3: m.u3T,
    i1: m.i1R,
    i2: m.i2S,
    i3: m.i3T,
    s: m.kva,
    p: m.kw,
    q: m.kvar,
    pf: m.pf,
    wp: m.wpPlus,
  };
}

export function toLiveReading(msg: MqttMeasurement): LiveReading {
  return {
    ts: new Date(msg.timestamp),
    kwh: msg.data.energy.wp_plus_kwh,
    kw: msg.data.power.kw,
    kvar: msg.data.power.kvar,
    pf: msg.data.power.factor,
  };
}

/** Combine daily aggregate buckets (one per calendar day in the requested
 * range) into a single period avg/max/min. Max/min across buckets are true
 * overall max/min. Avg must be weighted by sampleCount — an unweighted
 * mean-of-daily-means is wrong whenever days have different sample counts
 * (e.g. a partial "today"). */
export function toDailySummary(buckets: ApiDailyAggregate[]): MeasurementSummary {
  const zero: Stats = { u1: 0, u2: 0, u3: 0, i1: 0, i2: 0, i3: 0, s: 0, p: 0, q: 0, pf: 0, wp: 0 };
  if (buckets.length === 0) return { avg: zero, max: { ...zero }, min: { ...zero } };

  const totalSamples = buckets.reduce((n, b) => n + b.sampleCount, 0);
  const avgOf = (pick: (b: ApiDailyAggregate) => number) =>
    totalSamples === 0 ? 0 : buckets.reduce((sum, b) => sum + pick(b) * b.sampleCount, 0) / totalSamples;
  const maxOf = (pick: (b: ApiDailyAggregate) => number) => Math.max(...buckets.map(pick));
  const minOf = (pick: (b: ApiDailyAggregate) => number) => Math.min(...buckets.map(pick));

  return {
    avg: {
      u1: avgOf((b) => b.u1R_Avg),
      u2: avgOf((b) => b.u2S_Avg),
      u3: avgOf((b) => b.u3T_Avg),
      i1: avgOf((b) => b.i1R_Avg),
      i2: avgOf((b) => b.i2S_Avg),
      i3: avgOf((b) => b.i3T_Avg),
      s: avgOf((b) => b.kvA_Avg),
      p: avgOf((b) => b.kW_Avg),
      q: avgOf((b) => b.kvaR_Avg),
      pf: avgOf((b) => b.pF_Avg),
      wp: avgOf((b) => b.wpPlus_Avg),
    },
    max: {
      u1: maxOf((b) => b.u1R_Max),
      u2: maxOf((b) => b.u2S_Max),
      u3: maxOf((b) => b.u3T_Max),
      i1: maxOf((b) => b.i1R_Max),
      i2: maxOf((b) => b.i2S_Max),
      i3: maxOf((b) => b.i3T_Max),
      s: maxOf((b) => b.kvA_Max),
      p: maxOf((b) => b.kW_Max),
      q: maxOf((b) => b.kvaR_Max),
      pf: maxOf((b) => b.pF_Max),
      wp: maxOf((b) => b.wpPlus_Max),
    },
    min: {
      u1: minOf((b) => b.u1R_Min),
      u2: minOf((b) => b.u2S_Min),
      u3: minOf((b) => b.u3T_Min),
      i1: minOf((b) => b.i1R_Min),
      i2: minOf((b) => b.i2S_Min),
      i3: minOf((b) => b.i3T_Min),
      s: minOf((b) => b.kvA_Min),
      p: minOf((b) => b.kW_Min),
      q: minOf((b) => b.kvaR_Min),
      pf: minOf((b) => b.pF_Min),
      wp: minOf((b) => b.wpPlus_Min),
    },
  };
}
