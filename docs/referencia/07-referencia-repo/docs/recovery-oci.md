# OPTIMUS-THY OCI Recovery Procedures

## After OCI Instance Reboot

1. Docker services auto-start via restart policy
2. Verify health:
   ```bash
   curl http://localhost:8000/health
   docker compose -f infra/oci/docker-compose.oci.yml ps
   ```

3. If services don't start:
   ```bash
   docker compose -f infra/oci/docker-compose.oci.yml restart
   ```

## After Database Outage

1. Check postgres status
2. Run migrations if needed:
   ```bash
   cd backend && uv run alembic upgrade head
   ```

3. Verify data integrity:
   ```bash
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM patients"
   ```

## Recovery Time Objective
- Health check restored: < 30 seconds
- Full service restored: < 2 minutes
- Database restored from backup: < 10 minutes

## Network Security Notes

### Current Exposure (Verified)
- Port 5432 (PostgreSQL): Bound to 0.0.0.0 - **exposed externally**
- Port 8000 (Backend API): Bound to 0.0.0.0 - expected for API access
- Port 9000 (MinIO): Bound to 127.0.0.1 only - **not exposed**

### Recommendations
- PostgreSQL should be bound to 127.0.0.1:5432 only
- Consider using OCI Network Security Groups to restrict access
- MinIO is correctly internal-only

## Health Check Commands

```bash
# Backend health
curl http://localhost:8000/health

# MinIO health
curl http://localhost:9000/minio/health/live

# PostgreSQL connectivity
psql $DATABASE_URL -c "SELECT 1"
```

## Running Recovery Tests

```bash
cd backend
uv run pytest tests/test_recovery.py -v
```
