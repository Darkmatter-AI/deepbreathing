import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyCanonicalSelection,
  selectRows,
  shouldStopAfterFailures,
  updateIndexedMarker,
} from "../gsc-index-status-lib.mjs";

const rows = [
  { cells: ["1", "https://deepbreathingexercises.com/", "✓", "", ""] },
  { cells: ["2", "https://deepbreathingexercises.com/support", "", "", ""] },
];

test("full sweeps are the default and pending-only remains available", () => {
  assert.deepEqual(selectRows(rows), rows);
  assert.deepEqual(selectRows(rows, { pendingOnly: true }), [rows[1]]);
  assert.deepEqual(selectRows(rows, { limit: 1 }), [rows[0]]);
});

test("indexed markers can be added and cleared", () => {
  assert.equal(updateIndexedMarker(rows[1].cells, true)[2], "✓");
  assert.equal(updateIndexedMarker(rows[0].cells, false)[2], "");
});

test("the API outage circuit breaker stops repeated failed requests", () => {
  assert.equal(shouldStopAfterFailures(9), false);
  assert.equal(shouldStopAfterFailures(10), true);
  assert.equal(shouldStopAfterFailures(3, 3), true);
});

test("canonical classification detects off-domain hijacks and same-site mismatches", () => {
  assert.equal(
    classifyCanonicalSelection(
      "https://deepbreathingexercises.com/es/breathe/belly",
      "https://deepbreathingexercises.com/es/breathe/belly/",
    ),
    null,
  );
  assert.deepEqual(
    classifyCanonicalSelection(
      "https://deepbreathingexercises.com/es/breathe/belly",
      "https://www.747live.bet/",
    ),
    { type: "off-domain", googleCanonical: "https://www.747live.bet/" },
  );
  assert.deepEqual(
    classifyCanonicalSelection(
      "https://deepbreathingexercises.com/de/about",
      "https://deepbreathingexercises.com/about",
    ),
    {
      type: "different-url",
      googleCanonical: "https://deepbreathingexercises.com/about",
    },
  );
});
