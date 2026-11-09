# Backup and Restore Guide

## Overview

This document describes the backup and restore procedures for the OPTIMUS-THY infrastructure, covering PostgreSQL database and MinIO S3-compatible ObjectStorage.

## Architecture

The system uses:
- **PostgreSQL 16**: Primary relational database
- **MinIO S3**: Object storage for clinical documents and images
- **Docker Compose**: Container orchestration for local development

## Backup Components

### What is Backed Up

| Component | Description | Tool | Format |
|-----------|-------------|------|--------|
| PostgreSQL | Full database dump | `pg_dump` (inside container) | Custom compressed (`-Fc`) gzip |
| S3 Buckets | All objects in buckets | `mc mirror` | Mirror of directory structure |

### S3 Buckets

- `optimus-thy-files`: Primary storage bucket
- `optimus-thy-test`: Test/development bucket

## Backup Scripts

Location: `infra/backup/`

### `backup.sh`

Creates a timestamped backup of all infrastructure components.

```bash
# Full backup
./infra/backup/backup.sh

# Skip one component
./infra/backup/backup.sh --skip-postgres
./infra/backup/backup.sh --skip-s3

# Custom retention (days)
./infra/backup/backup.sh --retention 14
```

**Output**: `infra/backup/backups/backup_YYYYMMDD_HHMMSS/`

```
├── manifest.json           # Backup metadata
├── postgres_optimus_thy.sql.gz
├── postgres_metadata.json
├── s3/
│   ├── optimus-thy-files/
│   └── optimus-thy-test/
└── s3_metadata.json
```

### `verify.sh`

Verifies backup integrity by restoring to a temporary database and comparing S3 object counts.

```bash
./infra/backup/verify.sh
```

Verification includes:
- PostgreSQL dump format validation
- Restore to `optimus_thy_verify` temporary database
- Table count verification
- S3 object count comparison with live system

### `restore.sh`

Restores from a backup. **Requires confirmation** to prevent accidental data loss.

```bash
# Interactive restore from latest backup
./infra/backup/restore.sh

# Restore from specific backup
./infra/backup/restore.sh --backup-dir /path/to/backup

# Dry run (show what would be done)
./infra/backup/restore.sh --dry-run

# Restore to different database name
./infra/backup/restore.sh --target-db different_db
```

## Makefile Targets

```bash
make backup           # Run full backup
make backup-verify   # Run backup and verify integrity
make backup-latest   # Show latest backup info
make restore         # Restore from backup (interactive)
make verify-backup   # Verify latest backup
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5433` | PostgreSQL port |
| `POSTGRES_USER` | `optimus` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `optimus_secret` | PostgreSQL password |
| `POSTGRES_DB` | `optimus_thy` | Database name |
| `S3_ENDPOINT` | `localhost:9000` | MinIO endpoint |
| `S3_ACCESS_KEY` | `optimus_minio` | MinIO access key |
| `S3_SECRET_KEY` | `optimus_minio_secret` | MinIO secret key |
| `S3_BUCKET_NAME` | `optimus-thy-files` | Primary bucket |
| `S3_TEST_BUCKET_NAME` | `optimus-thy-test` | Test bucket |
| `BACKUP_ROOT` | `infra/backup/backups` | Backup storage root |
| `RETENTION_DAYS` | `7` | Days to keep backups |

## Backup Verification Results

Recent verification output demonstrates successful backup/restore:

```
=== Backup Verification Summary ===
PostgreSQL: PASSED
  - 26 tables verified
  - Key tables: patients, users, inference_jobs
  - Temporary restore database: optimus_thy_verify

S3: PASSED
  - optimus-thy-files: empty (0 objects)
  - optimus-thy-test: 1205 objects verified
```

## Safety Features

1. **Restore confirmation**: `restore.sh` requires typing `yes` to proceed
2. **Dry-run mode**: `--dry-run` shows what would be done without changes
3. **Temporary restore DB**: Verify uses separate `optimus_thy_verify` database
4. **Automatic cleanup**: Old backups retained per `RETENTION_DAYS` setting

## Limitations

- **No incremental backup**: Each backup is a full snapshot
- **No encryption**: Backups are stored unencrypted
- **No remote storage**: Backups stored locally only
- **No backup compression tuning**: Uses default gzip compression

## Troubleshooting

### pg_dump version mismatch

If you see `server version: X; pg_dump version: Y` errors, the backup script automatically uses `pg_dump` from the PostgreSQL container to ensure version compatibility.

### S3 access denied

Ensure MinIO container is running and mc alias is configured correctly:
```bash
docker exec optimus-thy-s3 mc alias set local http://localhost:9000 <key> <secret> --api S3v4
```

### Backup verification fails

1. Check backup file exists: `ls -la infra/backup/backups/`
2. Verify manifest: `cat infra/backup/backups/latest/manifest.json`
3. Run with verbose output to see specific failures
