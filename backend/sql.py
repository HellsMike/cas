import psycopg2
import json
import numpy as np

srid = 4326

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

# Seleziona una collezione dato l'id
def selectCollection(id):
    query = f"""
        SELECT id, name
        FROM collections
        WHERE id = '{id}';
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome'], item)) for item in results]

    return data_dict

# Seleziona tutte le collezioni
def selectAllCollections():
    query = "SELECT * FROM collections;"
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome'], item)) for item in results]

    return data_dict

# Query spaziale delle n collezioni con le foto più vicine
def selectNCollections(longitudine, latitudine, n):
    query = f"""
        SELECT c.id, c.name, sub.distanza
        FROM collections AS c
        JOIN (
            SELECT DISTINCT ON (c.id) c.id,
            ST_DistanceSphere(ST_SetSRID(ST_MakePoint('{longitudine}', '{latitudine}'), '{srid}'), i.geom) AS distanza
            FROM collections AS c
            JOIN images AS i ON c.id = i.collection_id
            ORDER BY c.id, distanza
        ) AS sub
        ON c.id = sub.id
        ORDER BY sub.distanza
        LIMIT {n};
        """
    results = executeQuery(query)

    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'nome', 'distanza'], item)) for item in results]

    return data_dict

# Ritorna una lista di marker senza filtro spaziale
def selectAllMarker():
    query = f"""
        SELECT i.id, ST_X(i.geom) AS longitude, ST_Y(i.geom) AS latitude
        FROM images AS i
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'longitudine', 'latitudine'], item)) for item in results]

    return data_dict

# Ritorna una lista di marker all'interno di geojson
def selectMarkersFromGeoJSON(geometries):
    results = []
    for geometry in geometries:
        geometry_json = json.dumps(geometry)
        query = f"""
            SELECT i.id, ST_X(i.geom) AS longitude, ST_Y(i.geom) AS latitude
            FROM images AS i
            WHERE ST_intersects(ST_SetSRID(i.geom, 4326), (SELECT ST_SetSRID(ST_GeomFromGeoJSON ('{geometry_json}'), 4326) AS geom));
            """
        result = executeQuery(query)
        if result:
            # Converti la lista di tuple in una lista di dizionari
            for item in result:
                results.append(dict(zip(['id', 'longitudine', 'latitudine'], item)))

    return results

# Ritorna, con k fissato, id del cluster, longitudine e latitudine del centroide, e dimensione del cluster
def selectFixatedKMeans(k):
    results = []
    query = f"""
        SELECT cluster_id, 
               ST_X(ST_Centroid(ST_Collect(ST_SetSRID(geom, 4326)))) AS longitudine, 
               ST_Y(ST_Centroid(ST_Collect(ST_SetSRID(geom, 4326)))) AS latitudine,
               COUNT(*) AS size,
               array_agg(id) AS foto_ids
        FROM (
            SELECT 
                ST_ClusterKMeans(ST_SetSRID(geom, 4326), {k}) OVER () AS cluster_id,
                id,
                geom
            FROM images
        ) subquery
        GROUP BY cluster_id;
    """
    results = executeQuery(query)
    data_dict = [dict(zip(['id', 'longitudine', 'latitudine', 'size', 'imagesIds'], item)) for item in results]

    return data_dict

# Ritorna il numero massimo di immagini presenti nel db
def selectNumberImages():
    # Conta il numero di immagini da mettere come upper bound al numero di cluster
    query = "SELECT COUNT(*) FROM images;"
    result = executeQuery(query)

    return result[0][0] 

def automaticElbowMethod():
    # Ottiene il numero massimo di cluster
    max_k = selectNumberImages()
    # Se ha solo un cluster disponibile, restituisce direttamente 1
    if max_k == 1:
        return selectFixatedKMeans(1)
    # Inizializza una lista vuota per i valori di inerzia
    inertia_values = []
    
    # Esegue K-Means per diversi valori di k e calcola l'inerzia
    for k in range(1, max_k + 1):
        clusters = selectFixatedKMeans(k)
        # Calcola l'inerzia sommando le distanze quadrate delle immagini dai rispettivi centroidi
        inertia = sum([cluster['size'] * cluster['longitudine']**2 + cluster['latitudine']**2 for cluster in clusters])
        inertia_values.append(inertia)
    
    # Calcola la derivata seconda dell'inerzia
    second_derivative = np.diff(np.diff(inertia_values))
    
    # Trova il punto di flessione (dove la derivata seconda cambia segno)
    optimal_k = np.where(second_derivative > 0)[0][0] + 2
    
    return selectFixatedKMeans(optimal_k)

# Query per la selezione di un'immagine dato il suo id
def selectImage(id):
    query = f"""
        SELECT url, c.name
        FROM images as i
        JOIN collections AS c ON i.collection_id = c.id
        WHERE i.id = '{id}'
        """    
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['url', 'nome_collezione'], item)) for item in results]

    return data_dict

# Query spaziale pper le immagini sul punto fornito
def selectImagesByPosition(longitudine, latitudine):
    query = f"""
        SELECT url, c.name
        FROM images AS i
        JOIN collections AS c ON i.collection_id = c.id
        WHERE ST_X(i.geom) = {longitudine} AND ST_Y(i.geom) = {latitudine}
        """
    results = executeQuery(query)

    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['url', 'nome_collezione'], item)) for item in results]

    return data_dict

# Query spaziale pper le immagini sul punto fornito
def selectImagesByPositionAndCollection(longitudine, latitudine, collection_id):
    query = f"""
        SELECT url
        FROM images AS i
        JOIN collections AS c ON i.collection_id = c.id
        WHERE ST_X(i.geom) = {longitudine} AND ST_Y(i.geom) = {latitudine} AND c.id = {collection_id}
        """
    results = executeQuery(query)

    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['url'], item)) for item in results]

    return data_dict

# Query spaziale delle immagini di una collezione
def selectImagesByCollectionId(id):
    query = f"""
        SELECT i.id, ST_X(i.geom) AS longitudine, ST_Y(i.geom) AS latitudine
        FROM images AS i
        JOIN collections AS c ON i.collection_id = c.id
        WHERE c.id = {id}
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'longitudine', 'latitudine'], item)) for item in results]

    return data_dict

# Query spaziale delle n immagini più vicine
def selectNImages(longitudine, latitudine, n):
    query = f"""
        SELECT i.id, ST_X(i.geom) AS longitudine, ST_Y(i.geom) AS latitudine, c.name,
        ST_DistanceSphere(ST_SetSRID(ST_MakePoint({longitudine}, {latitudine}), {srid}), i.geom) AS distanza
        FROM images AS i
        JOIN collections AS c ON i.collection_id = c.id
        ORDER BY distanza
        LIMIT {n}
        """
    results = executeQuery(query)
    
    # Converti la lista di tuple in una lista di dizionari
    data_dict = [dict(zip(['id', 'longitudine', 'latitudine', 'nome_collezione', 'distanza'], item)) for item in results]

    return data_dict

# Query per l'inserimento di una nuova collection
def insertCollection(name):
    query = f"INSERT INTO collections (name) VALUES ('{name}') RETURNING id;"
    results = executeQuery(query)

    return selectCollection(results[0][0])
    
# Query per l'inserimento di una nuova immagine
def insertImage(url, collection_id, longitude, latitude):
    query = f"INSERT INTO images (url, geom, collection_id) VALUES ('{url}', ST_GeomFromText('SRID={srid};POINT({longitude} {latitude})'), '{collection_id}');"
    executeQuery(query)

# Crea tabella delle collezioni
def createCollectionTable():
    query = """
        CREATE TABLE collections (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255)
        );
        """
    executeQuery(query)

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
    executeQuery(query)
