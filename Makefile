.PHONY: proto test lint run-control run-worker clean

# Generate protobuf stubs for all languages
proto:
	python -m grpc_tools.protoc \
		-I proto/ \
		--python_out=agent_platform/proto/ \
		--grpc_python_out=agent_platform/proto/ \
		proto/agent_platform.proto
	@echo "Python proto stubs generated"

# Run tests
test:
	python -m pytest tests/ -v

# Type checking
lint:
	python -m mypy agent_platform/ --ignore-missing-imports

# Start control plane
run-control:
	python -m agent_platform.main_control

# Start execution worker
run-worker:
	python -m agent_platform.main_worker

# Run quickstart demo
demo:
	python examples/quickstart.py

# Install dependencies
install:
	pip install -e ".[dev]"

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
