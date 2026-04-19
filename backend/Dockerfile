FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV USE_SQLITE=true
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "-c", "import uvicorn; uvicorn.run('app.main:app', host='0.0.0.0', port=int(__import__('os').environ.get('PORT', 8000)))"]
