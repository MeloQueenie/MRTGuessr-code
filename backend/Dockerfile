FROM python:3.14-slim

RUN adduser --system --uid 1000 appuser

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ src/

USER appuser
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "--chdir", "src", "app:app", "--bind", "0.0.0.0:5000"]