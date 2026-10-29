# ---- build stage: install deps + compile duckdb native addon (npm lives here only) ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build

# Pin the Node major: duckdb's native addon is ABI-specific, so the build and
# runtime stages MUST install the same versioned stream (nodejs24) or the copied
# .node won't load. AL2023's default `nodejs` is still 18 (EOL, no security
# fixes), so the versioned package is required; it provides plain `node`/`npm`.
# duckdb 0.9.2 ships no prebuilt binary for Node 24, so `npm ci` compiles it
# from source here (gcc-c++/make/python3) — a slow step, but build-stage only.
RUN dnf -y update \
 && dnf -y install \
    make \
    gcc-c++ \
    nodejs24 \
    nodejs24-npm \
 && dnf clean all

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package.json server/package-lock.json /deploy/server/

# duckdb needs only @mapbox/node-pre-gyp's .find() at runtime, not its download
# chain — drop socks/ip (CVE-2024-29415, no upstream fix) and node-gyp's
# http-cache-semantics (CVE-2026-93748, no upstream fix), which are install-only.
# Node 24's node-gyp compiles addons as C++20, which duckdb 0.9.2's bundled re2
# doesn't parse; it only uses the C-based N-API, so C++17 is safe (this flag
# comes after node-gyp's own -std and wins).
RUN CXXFLAGS="-std=gnu++17" npm ci \
 && rm -rf node_modules/ip node_modules/socks node_modules/socks-proxy-agent \
    node_modules/http-cache-semantics

# ---- runtime stage: run the app with nodejs only (no npm CLI, no build toolchain) ----
# The minimal base has no Python (the standard image needs it for dnf), so the
# image doesn't carry python3.9 and its scanner findings.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal

# nodejs only, pinned to the same major as the build stage (ABI match for duckdb).
# nodejs24 pulls in the `nodejs24-npm` RPM, which ships npm's bundled node_modules
# (tar/minimatch/sigstore/...) that scanners flag. The app runs `node` directly and
# never uses npm, so remove the whole RPM — this clears both the on-disk bundle AND
# the RPM-database record (a plain `rm` would leave the metadata for scanners that
# read the RPM db, e.g. Twistlock, to keep reporting npm).
RUN microdnf -y update \
 && microdnf -y install \
    nodejs24 \
 && microdnf clean all \
 && rpm -e --nodeps nodejs24-npm

WORKDIR /deploy/server

# .dockerignore excludes **/node_modules, so the host's deps can never enter the
# `server/` context and clobber the build stage's Linux-compiled ones. Copy the
# large, rarely-changing node_modules layer FIRST and the app on top, so a source
# edit doesn't invalidate (and re-copy) the whole dependency layer.
COPY --from=build /deploy/server/node_modules /deploy/server/node_modules
COPY server/ /deploy/server/

# invoke node directly (no npm at runtime); mirrors `npm start`
CMD ["node", "-r", "dotenv/config", "app.js"]
