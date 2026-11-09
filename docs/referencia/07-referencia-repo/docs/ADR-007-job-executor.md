# ADR-007: Job Executor Architecture

## Status: Accepted

**Date**: 2026-09-23
**Task**: TES-134

## Context

The system uses `BackgroundTasks` (FastAPI in-process) for job execution. Two job types exist:

1. **Inference Jobs** (`InferenceExecutionService`): DINOv3 model inference with mutex via DB `UPDATE ... WHERE status = 'pending'`
2. **OCR Jobs** (`OCRExecutionService`): Document OCR processing

Both job types are enqueued via:
```python
background_tasks.add_task(executor.execute_job_by_id, job.id)
```

### Benchmark Results (TES-134)

Executed on: Python 3.14, PostgreSQL + asyncpg, Mock Runner

| Metric | Value |
|--------|-------|
| Sequential job time | **50.15 ms/job** |
| 5 concurrent jobs | **247.43 ms total** (no speedup) |
| Speedup at 5 concurrent | **1.01x** (essentially none) |
| Max throughput | **~20 jobs/sec** (constant at all concurrency levels) |
| API responsive during jobs | **Yes** (health check returns 200) |

### Concurrency Test Data

| Concurrent Jobs | Total Time | Throughput | Observation |
|-----------------|------------|------------|-------------|
| 1 | 51.66 ms | 19.36 jobs/sec | Baseline |
| 2 | 102.28 ms | 19.55 jobs/sec | Linear |
| 5 | 244.48 ms | 20.45 jobs/sec | Linear |
| 10 | 516.43 ms | 19.36 jobs/sec | Linear |
| 20 | 986.98 ms | 20.26 jobs/sec | Linear |

**Key Finding**: Throughput remains constant (~20 jobs/sec) regardless of concurrency level. Jobs execute sequentially in-process.

## Decision

**Keep BackgroundTasks in-process for current workload**, with documentation of the scaling boundary.

### Rationale

1. **No concurrent speedup observed**: BackgroundTasks runs in the same async event loop. Even with `asyncio.gather()`, jobs wait for each other because the asyncpg connections serialize DB operations.

2. **DB mutex is effective**: No double-processing observed even with concurrent requests. The `UPDATE ... WHERE status = 'pending'` atomic lock works correctly.

3. **API remains responsive**: Health checks return 200 within 12-215ms even during job load.

4. **Current load is manageable**: At ~50ms per job, the system can process ~1,200 jobs/minute sequentially, which covers current and near-term projected loads.

5. **Redis/RQ available but unused**: `redis>=5.2.0` and `rq>=2.0.0` are in dependencies but not wired up. This is a future migration path if needed.

## Consequences

### Keep In-Process (Current)

**Pros:**
- Simple deployment (single service)
- No additional infrastructure (Redis, workers)
- DB mutex provides safe concurrency
- Easy debugging (stack traces in same process)

**Cons:**
- No true parallelism (GIL, sequential execution)
- CPU-bound jobs block each other
- Will degrade under heavy concurrent load (>20 jobs concurrent)

### If Migration Needed

Migration path if load increases significantly:

1. **RQ (recommended)**: Use existing Redis dependency, simpler than Celery
   ```python
   from rq import Queue
   q = Queue('inference', connection=Redis())
   q.enqueue(executor.execute_job_by_id, job_id)
   ```

2. **Celery**: More features but more complexity
   ```python
   @celery.task
   def execute_inference(job_id):
       ...
   ```

### Scaling Triggers to Watch

Consider migration when:
- Job queue depth consistently > 50 pending jobs
- P95 job latency > 500ms during normal load
- Need for true multi-core parallelism (CPU-bound model inference)
- Requirement for job prioritization or rate limiting

## References

- Benchmark script: `backend/tests/bench_job_performance.py`
- Inference service: `backend/src/app/application/services/inference_service.py`
- OCR service: `backend/src/app/application/services/ocr_service.py`
- FastAPI BackgroundTasks: https://fastapi.tiangolo.com/tutorial/background-tasks/
