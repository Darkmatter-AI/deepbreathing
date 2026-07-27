export function selectRows(rows, { pendingOnly = false, limit = Infinity } = {}) {
  const selected = pendingOnly
    ? rows.filter((row) => !row.cells[2].includes("✓"))
    : rows;
  return selected.slice(0, limit);
}

export function updateIndexedMarker(cells, indexed) {
  const updated = [...cells];
  updated[2] = indexed ? "✓" : "";
  return updated;
}

export function shouldStopAfterFailures(failureCount, maximumFailures = 10) {
  return failureCount >= maximumFailures;
}

function comparableUrl(value) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";
  if (url.pathname !== "/") url.pathname = url.pathname.replace(/\/+$/, "");
  return url;
}

function sharesSiteDomain(leftHostname, rightHostname) {
  const left = leftHostname.replace(/^www\./, "");
  const right = rightHostname.replace(/^www\./, "");
  return (
    left === right ||
    left.endsWith(`.${right}`) ||
    right.endsWith(`.${left}`)
  );
}

export function classifyCanonicalSelection(inspectionUrl, googleCanonical) {
  if (!googleCanonical) return null;

  let inspected;
  let selected;
  try {
    inspected = comparableUrl(inspectionUrl);
    selected = comparableUrl(googleCanonical);
  } catch {
    return { type: "invalid", googleCanonical };
  }

  if (!sharesSiteDomain(inspected.hostname, selected.hostname)) {
    return { type: "off-domain", googleCanonical: selected.href };
  }

  if (inspected.href !== selected.href) {
    return { type: "different-url", googleCanonical: selected.href };
  }

  return null;
}
