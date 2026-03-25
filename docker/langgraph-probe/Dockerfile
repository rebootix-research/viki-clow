FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi==0.118.0 \
    uvicorn[standard]==0.37.0 \
    langgraph==0.6.11

COPY docker/langgraph-probe/app.py /app/app.py

EXPOSE 12024

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "12024"]
