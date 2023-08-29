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

        try:
            results = cur.fetchall() 
        except:
            results = None
            
        conn.commit()   
        
    # Chiusura della connessione al database
    conn.close()
    
    return results

def selectCollection(nome, longitudine, latitudine):
    query = f"""
        SELECT id, name, ST_X(geom), ST_Y(geom)
        FROM collections
        WHERE name = '{nome}' AND ST_X(geom) = {longitudine} AND ST_Y(geom) = {latitudine};
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome', 'longitudine', 'latitudine'], item)) for item in results]

    # Formatta la lista di dizionari in JSON
    data_json = json.dumps(data_dict, indent=4)

    return data_json

def selectNCollections(longitudine, latitudine, n):
    # Query spaziale delle n collezioni più vicine
    query = f"""
        SELECT id, name, ST_X(geom), ST_Y(geom), ST_Distance(geom, ST_SetSRID(ST_MakePoint({longitudine}, {latitudine}), 0)) AS distance
        FROM collections
        ORDER BY distance
        LIMIT {n}
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome', 'longitudine', 'latitudine', 'distanza'], item)) for item in results]

    # Formatta la lista di dizionari in JSON
    data_json = json.dumps(data_dict, indent=4)

    return data_json

def insertCollection(name, latitude, longitude):
    # Query per l'inserimento di una nuova collection
    query = f"INSERT INTO collections (name, geom) VALUES ('{name}', 'POINT({longitude} {latitude})');"
    executeQuery(query)

    return selectCollection(name, longitude, latitude)
    
def insertImage():
    url = 'path:to:image'
    collection_id = 1
    latitude = 00.22221
    longitude = 11.231230

    # Query per l'inserimento di una nuova immagine
    query = f"INSERT INTO images (url, geom, collection_id) VALUES ('{url}', 'POINT({longitude} {latitude})', '{collection_id}');"
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
            geom GEOMETRY(Point),
            collection_id INTEGER REFERENCES collections(id)
        );
        """
    executeQuery(query);
