export function asQueryParams(params) {
  return params
    ? "?" +
        Object.entries(params)
          .map(
            ([key, value]) =>
              ![null, undefined, ""].includes(value) &&
              [key, value].map(encodeURIComponent).join("="),
          )
          .filter(Boolean)
          .join("&")
    : "";
}

// Gateway hiccups — a deploy's task swap, a briefly-drained target, a dropped
// connection — surface as 502/503/504 or a network error, and the same
// request succeeds moments later. Those are retried transparently (GETs are
// idempotent) before an error ever reaches a component; the API's own errors
// (400 with a JSON body, a real 500) fail immediately.
const RETRY_STATUSES = [502, 503, 504];
// ~4s of waiting across the 6 attempts, so a genuine outage shows its error
// in about five seconds rather than leaving a spinner up
const RETRY_DELAYS = [250, 500, 750, 1000, 1500];

export async function query(url, params, options) {
  const fetchOptions = {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  if (/get/i.test(fetchOptions.method)) {
    url += asQueryParams(params);
  } else {
    fetchOptions.body = JSON.stringify(params);
  }

  const attempt = async () => {
    const response = await fetch(url, fetchOptions);
    // A failed request must REJECT: the API answers errors with 400 +
    // { error }, and resolving with that object silently hands components a
    // non-array where records are expected (a TypeError deep in rendering,
    // attributed to the wrong place) instead of the error path they already
    // have — Recoil loadables' hasError, or a caller's own .catch. Check the
    // status BEFORE parsing: a proxy 502/504 answers with an HTML page, and
    // parsing first would surface a JSON syntax error and lose the status.
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const error = new Error(body?.error ?? `Request failed (${response.status})`);
      error.status = response.status;
      throw error;
    }
    return await response.json();
  };

  const delays = /get/i.test(fetchOptions.method) ? RETRY_DELAYS : [];
  for (const delay of delays) {
    try {
      return await attempt();
    } catch (error) {
      // no status = the fetch itself failed (network); both cases are the
      // transient kind — anything else is a real answer, surface it now
      if (error.status !== undefined && !RETRY_STATUSES.includes(error.status)) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return await attempt();
}
