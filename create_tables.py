import psycopg2

# Connessione al database
conn = psycopg2.connect(
    dbname="cas",
    user="postgres",
    password="docker",
    host="localhost",
    port="5432"
)

# Creazione della tabella per la collezione
create_collection_table_query = """
DROP TABLE IF EXISTS (collections);
CREATE TABLE collections (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    geom GEOMETRY(Point)
);
"""

# Creazione della tabella per le immagini
create_images_table_query = """
DROP TABLE IF EXISTS (images);
CREATE TABLE images (
    id SERIAL PRIMARY KEY,
    url VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    collection_id INTEGER REFERENCES collections(id)
);
"""

# Esecuzione delle query per creare le tabelle
with conn.cursor() as cur:
    cur.execute(create_collection_table_query)
    cur.execute(create_images_table_query)
    conn.commit()

# Chiusura della connessione al database
conn.close()
