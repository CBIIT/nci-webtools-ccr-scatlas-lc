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
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return await response.json();
}
