FROM python:3.12-slim AS builder

WORKDIR /app
COPY pyproject.toml .
RUN pip install --no-cache-dir .

FROM python:3.12-slim

RUN groupadd -r appuser && useradd -r -g appuser appuser
WORKDIR /app

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin
COPY agent_platform/ agent_platform/
COPY proto/ proto/

USER appuser

EXPOSE 50051

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD python -c "import grpc; ch = grpc.insecure_channel('localhost:50051'); grpc.channel_ready_future(ch).result(timeout=3)" || exit 1

CMD ["python", "-m", "agent_platform.main_control"]
