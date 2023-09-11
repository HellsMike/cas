import psycopg2
import json

srid=4326

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
        SELECT id, name, ST_X(geom) AS longitudine, ST_Y(geom) AS latitudine,
        ST_DistanceSphere(ST_SetSRID(ST_MakePoint({longitudine}, {latitudine}), {srid}), geom) / 1000 AS distanza
        FROM collections
        ORDER BY distanza
        LIMIT {n}
        """
    results = executeQuery(query)

    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome', 'longitudine', 'latitudine', 'distanza'], item)) for item in results]

    # Formatta la lista di dizionari in JSON
    data_json = json.dumps(data_dict, indent=4)

    return data_json

def selectAllMarker():
    query = f"""
        SELECT ST_X(i.geom) AS longitude, ST_Y(i.geom) AS latitude, c.name AS collection_name
        FROM images AS i
        JOIN collections AS c ON i.collection_id = c.id;
        """
        
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['longitudine', 'latitudine', 'nome_collezione'], item)) for item in results]

    return data_dict

def selectNImages(longitudine, latitudine, n):
    # Query spaziale delle n immagini più vicine
    query = f"""
        SELECT url, ST_X(geom) AS longitudine, ST_Y(geom) AS latitudine,
        ST_DistanceSphere(ST_SetSRID(ST_MakePoint({longitudine}, {latitudine}), {srid}), geom) / 1000 AS distanza
        FROM images
        ORDER BY distanza
        LIMIT {n}
        """
        
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['url', 'longitudine', 'latitudine', 'distanza'], item)) for item in results]

    return data_dict


def insertCollection(name, latitude, longitude):
    # Query per l'inserimento di una nuova collection
    query = f"INSERT INTO collections (name, geom) VALUES ('{name}', ST_GeomFromText('SRID={srid};POINT({longitude} {latitude})'));"
    executeQuery(query)

    return selectCollection(name, longitude, latitude)
    
def insertImage(url, collection_id, longitude, latitude):
    # Query per l'inserimento di una nuova immagine
    query = f"INSERT INTO images (url, geom, collection_id) VALUES ('{url}', ST_GeomFromText('SRID={srid};POINT({longitude} {latitude})'), '{collection_id}');"
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

#testing snippet e risultato

#print(selectNCollections(44.8, 10.3341, 2))
"""[
    {
        "id": 1,
        "nome": "Parma",
        "longitudine": 44.8015,
        "latitudine": 10.3341,
        "distanza": 0.16408698449
    },
    {
        "id": 2,
        "nome": "Bologna",
        "longitudine": 44.4949,
        "latitudine": 11.3426,
        "distanza": 116.98569484505
    }
]"""