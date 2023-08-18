import psycopg2

# Connessione al database
conn = psycopg2.connect(
    dbname="cas",
    user="postgres",
    password="docker",
    host="localhost",
    port="5432"
)

name = 'Punto_prova'
latitude = 00.22222
longitude = 11.231231

# Query per l'inserimento di una nuova collection
insert_collection = f"""
INSERT INTO collections (name, geom) VALUES 
    ('{name}', 'POINT({latitude} {longitude})');
"""
# Esecuzione delle query per l'inserimento di una nuova collection
with conn.cursor() as cur:
    cur.execute(insert_collection)
    conn.commit()

# Chiusura della connessione al database
conn.close()