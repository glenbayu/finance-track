import test from "node:test";
import assert from "node:assert/strict";
import {
  formatDateInTimeZone,
  getMonthRange,
  getRecentMonths,
  isDateValue,
} from "../lib/utils/date.ts";

test("formats business dates using Asia/Jakarta at UTC month boundaries", () => {
  assert.equal(formatDateInTimeZone(new Date("2026-10-31T16:59:59.999Z")), "2026-10-31");
  assert.equal(formatDateInTimeZone(new Date("2026-10-31T17:00:00.000Z")), "2026-11-01");
});

test("accepts real calendar dates and rejects impossible dates", () => {
  assert.equal(isDateValue("2024-02-29"), true);
  assert.equal(isDateValue("2026-02-29"), false);
  assert.equal(isDateValue("2026-04-31"), false);
  assert.equal(isDateValue("2026-13-01"), false);
  assert.equal(isDateValue("not-a-date"), false);
});

test("returns month ranges and recent months across year boundaries", () => {
  assert.deepEqual(getMonthRange("2026-12"), {
    start: "2026-12-01",
    end: "2027-01-01",
  });
  assert.deepEqual(getRecentMonths(3, "2027-01"), ["2026-11", "2026-12", "2027-01"]);
});
