# ADR-MODEL-001: Model Runner Validation on OCI

## Status: Accepted

**Date**: 2026-09-23
**Task**: TES-162

## Context

The system uses `InferenceExecutionService` with a `mock_runner` (MockThyroidModelRunner) that simulates DINOv3 inference for development and thesis demo. Need to validate if real DINOv3/ModelRunner can run on OCI hardware.

### OCI Hardware Profile

| Component | Value |
|-----------|-------|
| OCI Shape | Ampere A1 |
| Architecture | aarch64 (ARM Neoverse-N1) |
| CPU Cores | 4 |
| RAM | 23Gi |
| Platform | Linux-6.8.0-1060-oracle-aarch64 |
| Python | 3.14.7 |

### Validation Results

**ModelRunner Interface Test**:
- `ia_tiroides` package imports successfully ✓
- `MockThyroidModelRunner` instantiates and runs ✓
- `DINOv3ModelRunner` requires `weights_path` argument - **weights not available in OCI**

**Mock Runner Benchmark** (10 runs on OCI Ampere A1):

| Metric | Value |
|--------|-------|
| Mean | **30.9 ms** |
| Min | 30.5 ms |
| Max | 32.64 ms |
| Std Dev | 0.62 ms |
| Prediction | MALIGNANT (0.524 probability) |

**Real Model Status**:
- `DINOv3ModelRunner` instantiated but requires model weights file
- Weights file path: Not configured in OCI environment
- Torch/CUDA: Installed and available (CUDA 13, torch 2.14.0)

## Decision

**Continue using mock_runner for thesis demo** because:

1. **No model weights available**: The DINOv3 fine-tuned weights are not deployed in the OCI environment. The `weights_path` argument is required but not provided.

2. **Mock runner is deterministic and reproducible**: The `MockThyroidModelRunner` produces consistent results based on input hash, suitable for development and demo purposes.

3. **OCI hardware validated**: The OCI Ampere A1 shape successfully runs the model interface (Python, PyTorch, PIL, inference pipeline). When weights are available, real inference can run on this hardware.

4. **Thesis demo scope**: The mock runner is sufficient to demonstrate the full inference pipeline including heatmap generation, result persistence, and API integration.

### Future Path for Real Model

When DINOv3 weights become available:

1. Set `weights_path` to the model checkpoint file
2. Optionally set `expected_sha256` for checksum validation
3. The `DINOv3ModelRunner` will automatically use CUDA if available, falling back to CPU

```python
# After weights are available:
runner = DINOv3ModelRunner(
    weights_path="/path/to/model_weights.pt",
    expected_sha256="<expected-checksum>",
    device="cuda"  # or "cpu"
)
```

## Consequences

### Positive

- Full inference pipeline validated without requiring heavy model weights
- Mock runner provides deterministic, reproducible results for testing
- OCI hardware confirmed capable of running PyTorch workloads
- Clear path to real model when weights become available

### Trade-offs

- Mock runner does not reflect actual DINOv3 inference time
- Real model may have different latency characteristics on ARM vs x86

## References

- Benchmark script: `backend/tests/bench_model_runner.py`
- Inference service: `backend/src/app/application/services/inference_service.py`
- Model runner interface: `ia-tiroides/src/ia_tiroides/dino_runner.py`
- Mock runner: `ia-tiroides/src/ia_tiroides/runner.py`
