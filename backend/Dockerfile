# Usa un'immagine base Python
FROM python:3.9

# Imposta la directory di lavoro nel container
WORKDIR /app

# Copia il tuo codice nella directory di lavoro
COPY . /app

# Installa le dipendenze del tuo backend
RUN pip install -r requirements.txt

# Esponi la porta su cui il tuo server Flask è in ascolto (porta 8000)
EXPOSE 8000

# Avvia il tuo server Flask
CMD ["python", "endpoint.py"]