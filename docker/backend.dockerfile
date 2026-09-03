# ---- build stage: install deps + compile duckdb native addon (npm lives here only) ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023 AS build

# Pin the Node major: duckdb's native addon is ABI-specific, so the build and
# runtime stages MUST resolve to the same major or the copied .node won't load.
# 18 is AL2023's default nodejs today; pinning is deliberate — if AL2023 ever
# retires the 18 stream the build fails loudly here (bump this + the runtime pin),
# which is far safer than an unpinned install silently drifting the two stages to
# mismatched majors and crash-looping duckdb at runtime.
RUN dnf -y update \
 && dnf -y install \
    make \
    gcc-c++ \
    "nodejs-1:18.*" \
    npm \
 && dnf clean all

WORKDIR /deploy/server

# use build cache for npm packages
COPY server/package.json server/package-lock.json /deploy/server/

# duckdb needs only @mapbox/node-pre-gyp's .find() at runtime, not its download
# chain — drop socks/ip (CVE-2024-29415, no upstream fix) which are install-only.
RUN npm ci \
 && rm -rf node_modules/ip node_modules/socks node_modules/socks-proxy-agent

# ---- runtime stage: run the app with nodejs only (no npm CLI, no build toolchain) ----
FROM public.ecr.aws/amazonlinux/amazonlinux:2023

# nodejs only, pinned to the same major as the build stage (ABI match for duckdb).
# nodejs pulls in the `nodejs-npm` RPM, which ships npm's bundled node_modules
# (tar/minimatch/sigstore/...) that scanners flag. The app runs `node` directly and
# never uses npm, so remove the whole RPM — this clears both the on-disk bundle AND
# the RPM-database record (a plain `rm` would leave the metadata for scanners that
# read the RPM db, e.g. Twistlock, to keep reporting npm).
RUN dnf -y update \
 && dnf -y install \
    "nodejs-1:18.*" \
 && dnf clean all \
 && rpm -e --nodeps nodejs-npm

WORKDIR /deploy/server

# .dockerignore excludes **/node_modules, so the host's deps can never enter the
# `server/` context and clobber the build stage's Linux-compiled ones. Copy the
# large, rarely-changing node_modules layer FIRST and the app on top, so a source
# edit doesn't invalidate (and re-copy) the whole dependency layer.
COPY --from=build /deploy/server/node_modules /deploy/server/node_modules
COPY server/ /deploy/server/

# invoke node directly (no npm at runtime); mirrors `npm start`
CMD ["node", "-r", "dotenv/config", "app.js"]
