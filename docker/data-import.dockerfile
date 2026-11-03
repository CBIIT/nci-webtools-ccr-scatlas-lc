# Data-import task image: applies a delta DuckDB file from S3 onto the tier's
# database on EFS (see database/apply_delta.sh). Pinned to the DuckDB 0.9.x CLI
# — the same on-disk format the backend reads; a newer CLI would silently
# upgrade the file and the 0.9.1 backend could no longer open it.
#
# Amazon Linux 2023 minimal, like the frontend and backend images: patched
# packages land there quickly, while Debian bookworm leaves many scanner
# findings unfixed. It already has curl and ca-certificates; unzip is only
# needed to unpack the two downloads below and is removed afterwards.
FROM public.ecr.aws/amazonlinux/amazonlinux:2023-minimal

RUN microdnf -y update \
    && microdnf -y install unzip \
    && microdnf clean all

# AWS CLI v2 (fetch the delta from S3)
RUN curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip \
    && unzip -q /tmp/awscliv2.zip -d /tmp \
    && /tmp/aws/install \
    && rm -rf /tmp/awscliv2.zip /tmp/aws

# DuckDB CLI 0.9.2 (format-compatible with the backend's duckdb 0.9.x)
RUN curl -fsSL "https://github.com/duckdb/duckdb/releases/download/v0.9.2/duckdb_cli-linux-amd64.zip" -o /tmp/duckdb.zip \
    && unzip -q /tmp/duckdb.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/duckdb \
    && rm /tmp/duckdb.zip \
    && microdnf -y remove unzip \
    && microdnf clean all

WORKDIR /app
COPY database/apply_delta.sh .

CMD ["sh", "apply_delta.sh"]
