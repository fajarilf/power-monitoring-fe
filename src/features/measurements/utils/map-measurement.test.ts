import assert from "node:assert/strict";
import test from "node:test";
import { toReading, toDailySummary, toLiveReading } from "./map-measurement.ts";
import type { ApiDailyAggregate, ApiMeasurement, MqttMeasurement } from "../api/measurements.types.ts";

const sample: ApiMeasurement = {
  id: 372,
  deviceId: 1,
  deviceName: "Device 1",
  u1R: 356.51,
  u2S: 363.97,
  u3T: 361.08,
  i1R: 5.894,
  i2S: 6.795,
  i3T: 6.456,
  kva: 4.029,
  kw: 3.15,
  kvar: 3.27,
  pf: 0.6806,
  wpPlus: 0.2251,
  recordedAt: "2026-08-27T13:51:02.957+07:00",
  consumptionKwh: 0.12,
};

test("toReading maps every field to the right Reading key", () => {
  const r = toReading(sample);
  assert.equal(r.u1, sample.u1R);
  assert.equal(r.u2, sample.u2S);
  assert.equal(r.u3, sample.u3T);
  assert.equal(r.i1, sample.i1R);
  assert.equal(r.i2, sample.i2S);
  assert.equal(r.i3, sample.i3T);
  assert.equal(r.s, sample.kva);
  assert.equal(r.p, sample.kw);
  assert.equal(r.q, sample.kvar);
  assert.equal(r.pf, sample.pf);
  assert.equal(r.wp, sample.wpPlus);
  assert.equal(r.consumptionKwh, sample.consumptionKwh);
  assert.equal(r.ts.getTime(), new Date("2026-08-27T13:51:02.957+07:00").getTime());
});

// Real two-bucket fixture from GET /api/measurements/1/daily.
const dailyBuckets: ApiDailyAggregate[] = [
  {
    deviceId: 1,
    bucket: "2026-08-27T07:00:00+07:00",
    u1R_Avg: 359.94309210526336,
    u1R_Min: 355.04,
    u1R_Max: 364.96,
    u2S_Avg: 359.6805263157895,
    u2S_Min: 355.05,
    u2S_Max: 364.93,
    u3T_Avg: 360.1480921052633,
    u3T_Min: 355.01,
    u3T_Max: 364.97,
    i1R_Avg: 6.536302631578941,
    i1R_Min: 5.511,
    i1R_Max: 7.485,
    i2S_Avg: 6.540263157894733,
    i2S_Min: 5.515,
    i2S_Max: 7.49,
    i3T_Avg: 6.48505263157895,
    i3T_Min: 5.504,
    i3T_Max: 7.493,
    kvA_Avg: 4.134884868421056,
    kvA_Min: 3.801,
    kvA_Max: 4.498,
    kW_Avg: 2.8618421052631575,
    kW_Min: 2.51,
    kW_Max: 3.2,
    kvaR_Avg: 3.135506578947367,
    kvaR_Min: 2.803,
    kvaR_Max: 3.5,
    pF_Avg: 0.6945496710526315,
    pF_Min: 0.6008,
    pF_Max: 0.7997,
    wpPlus_Avg: 0.13083289473684223,
    wpPlus_Min: 0.0455,
    wpPlus_Max: 0.2173,
    sampleCount: 304,
    consumptionKwh: 10.5,
  },
  {
    deviceId: 1,
    bucket: "2026-08-26T07:00:00+07:00",
    u1R_Avg: 359.92142857142863,
    u1R_Min: 355.11,
    u1R_Max: 364.77,
    u2S_Avg: 359.8612499999999,
    u2S_Min: 355.01,
    u2S_Max: 364.78,
    u3T_Avg: 360.2860714285715,
    u3T_Min: 355.34,
    u3T_Max: 364.97,
    i1R_Avg: 6.370678571428572,
    i1R_Min: 5.518,
    i1R_Max: 7.449,
    i2S_Avg: 6.481392857142856,
    i2S_Min: 5.505,
    i2S_Max: 7.429,
    i3T_Avg: 6.528392857142857,
    i3T_Min: 5.547,
    i3T_Max: 7.464,
    kvA_Avg: 4.136392857142858,
    kvA_Min: 3.809,
    kvA_Max: 4.49,
    kW_Avg: 2.8437500000000004,
    kW_Min: 2.51,
    kW_Max: 3.19,
    kvaR_Avg: 3.1685892857142868,
    kvaR_Min: 2.824,
    kvaR_Max: 3.489,
    pF_Avg: 0.7003232142857144,
    pF_Min: 0.6032,
    pF_Max: 0.7964,
    wpPlus_Avg: 0.06448035714285714,
    wpPlus_Min: 0.0471,
    wpPlus_Max: 0.0821,
    sampleCount: 56,
    consumptionKwh: 4.5,
  },
];

test("toDailySummary: max/min are true overall extremes across buckets", () => {
  const { max, min } = toDailySummary(dailyBuckets);
  assert.equal(max.u1, Math.max(364.96, 364.77));
  assert.equal(min.u1, Math.min(355.04, 355.11));
  assert.equal(max.wp, Math.max(0.2173, 0.0821));
  assert.equal(min.wp, Math.min(0.0455, 0.0471));
  assert.equal(max.consumptionKwh, 10.5);
  assert.equal(min.consumptionKwh, 4.5);
});

test("toDailySummary: avg is weighted by sampleCount, not a mean of daily means", () => {
  const { avg } = toDailySummary(dailyBuckets);

  // Independently computed weighted mean (different code path than the
  // implementation) — catches a regression to an unweighted mean-of-means.
  const expectedU1 = (359.94309210526336 * 304 + 359.92142857142863 * 56) / (304 + 56);
  const expectedWp = (0.13083289473684223 * 304 + 0.06448035714285714 * 56) / (304 + 56);
  assert.ok(Math.abs(avg.u1 - expectedU1) < 1e-9);
  assert.ok(Math.abs(avg.wp - expectedWp) < 1e-9);
  assert.equal(avg.consumptionKwh, 7.5);

  // The two sampleCounts (304 vs 56) differ enough that an unweighted
  // mean-of-means would give a visibly different, wrong wp average.
  const unweightedWp = (0.13083289473684223 + 0.06448035714285714) / 2;
  assert.notEqual(avg.wp, unweightedWp);
});

test("toDailySummary returns zeros for an empty bucket list", () => {
  const { avg, max, min } = toDailySummary([]);
  assert.equal(avg.u1, 0);
  assert.equal(max.u1, 0);
  assert.equal(min.u1, 0);
  assert.equal(avg.consumptionKwh, 0);
});

const mqttSample: MqttMeasurement = {
  timestamp: "2026-08-26T14:32:10.500+07:00",
  data: {
    voltage: { rs: 361.32, st: 360.44, tr: 356.72 },
    current: { rs: 6.474, st: 7.084, tr: 5.983 },
    power: { kva: 4.057, kw: 2.68, kvar: 3.046, factor: 0.6605 },
    energy: { wp_plus_kwh: 0.0447 },
  },
};

test("toLiveReading maps power/energy fields to the right LiveReading key", () => {
  const r = toLiveReading(mqttSample);
  assert.equal(r.kwh, mqttSample.data.energy.wp_plus_kwh);
  assert.equal(r.kw, mqttSample.data.power.kw);
  assert.equal(r.kvar, mqttSample.data.power.kvar);
  assert.equal(r.pf, mqttSample.data.power.factor);
  assert.equal(r.ts.getTime(), new Date(mqttSample.timestamp).getTime());
});
