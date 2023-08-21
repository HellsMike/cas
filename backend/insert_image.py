import psycopg2

# Connessione al database
conn = psycopg2.connect(
    dbname="cas",
    user="postgres",
    password="docker",
    host="localhost",
    port="5432"
)

url = 'path:to:image'
collection_id = 1

# Query per l'inserimento di una nuova immagine
insert_image = f"""
INSERT INTO images (url, collection_id) VALUES 
    ('{url}', '{collection_id}');
"""
# Esecuzione delle query per l'inserimento di una nuova immagine
with conn.cursor() as cur:
    cur.execute(insert_image)
    conn.commit()

# Chiusura della connessione al database
conn.close()