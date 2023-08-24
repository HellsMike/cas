import psycopg2
import json

def executeQuery(query):    
    # Connessione al database
    conn = psycopg2.connect(
        dbname="cas",
        user="postgres",
        password="docker",
        host="localhost",
        port="5432"
    )
    
    # Esecuzione delle query 
    with conn.cursor() as cur:
        cur.execute(query)
        results = cur.fetchall()
        conn.commit()   
        
    # Chiusura della connessione al database
    conn.close()
    
    return results

def selectNCollections(latitudine, longitudine, n):
    # Query spaziale delle n collezioni più viine
    query = f"""
        SELECT id, name, ST_Y(geom), ST_X(geom), ST_Distance(geom, ST_SetSRID(ST_MakePoint({latitudine}, {longitudine}), 0)) AS distance
        FROM collections
        ORDER BY distance
        LIMIT {n}
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome', 'latitudine', 'longitudine', 'distanza'], item)) for item in results]

    # Formatta la lista di dizionari in JSON
    data_json = json.dumps(data_dict, indent=4)

    return data_json

def insertCollection():
    name = 'Punto_prova'
    latitude = 00.22222
    longitude = 11.231231

    # Query per l'inserimento di una nuova collection
    query = f"INSERT INTO collections (name, geom) VALUES ('{name}', 'POINT({latitude} {longitude})');"
    executeQuery(query)
    
def insertImage():
    url = 'path:to:image'
    collection_id = 1

    # Query per l'inserimento di una nuova immagine
    query = f"INSERT INTO images (url, collection_id) VALUES ('{url}', '{collection_id}');"
    executeQuery(query)

# Crea tabella delle collezioni
def createCollectionTable():
    query = """
        CREATE TABLE collections (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255),
            geom GEOMETRY(Point)
        );
        """
    executeQuery(query);

# Crea tabella delle immagini
def createImageTable():
    query = """
        CREATE TABLE images (
            id SERIAL PRIMARY KEY,
            url VARCHAR(255),
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            collection_id INTEGER REFERENCES collections(id)
        );
        """
    executeQuery(query);
