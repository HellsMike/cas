from flask import Flask, request
from PIL import Image
import base64
import io
import datetime
import json
import os
import sql

app = Flask(__name__)

# Fornisce le N collezioni più vicine alle coordinate fornite
@app.route('/getCollections', methods=['POST'])
def getCollection():
    print(request.data)
    data = request.get_json()
    print(data)
    return sql.selectNCollections(data['longitudine'], data['latitudine'], data['n'])

@app.route('/getImages', methods=['POST'])
def getImages():
    print(request.data)
    data = request.get_json()
    print(data)
    images = sql.selectNImages(data['longitudine'], data['latitudine'], data['n'])
    
    for image in images:
        # Leggi i dati dell'immagine dal file
        with open(image['url'], 'rb') as f:
            image_data = f.read()

        del image['url']
        
        # Comprimi l'immagine con Pillow
        image_buffer = io.BytesIO(image_data)
        img = Image.open(image_buffer)
        img = img.convert("RGB")
        output_buffer = io.BytesIO()
        img.save(output_buffer, format="JPEG", quality=70)  # Modifica il valore della qualità secondo le tue esigenze
        
        # Codifica l'immagine compressa in base64
        compressed_image_data = output_buffer.getvalue()
        image['base64image'] = base64.b64encode(compressed_image_data).decode('utf-8')

    # Formatta la lista di dizionari in JSON
    data_json = json.dumps(images, indent=4)

    return data_json


# Crea una nuova collezione
@app.route('/newCollection', methods=['POST'])
def newCollection():
    print(request.data)
    data = request.get_json()
    print(data)
    return sql.insertCollection(data['nome'], data['latitudine'], data['longitudine'])

# Inserisce la foto nel database
@app.route('/insertPhoto', methods=['POST'])
def insertPhoto():
    data = request.get_json()
    imgdata = base64.b64decode(data['base64image']) 
    dir_name = 'backend/images'
    file_name = data['collectionId'] + '_' + datetime.datetime.now().strftime('%d-%m-%Y-%H-%M-%S') + '.jpg'

    # Crea la directory se non esiste
    if not os.path.exists(dir_name):
        os.makedirs(dir_name)

    # Crea il percorso completo al file
    file_path = os.path.join(dir_name, file_name)

    # Scrivi i dati dell'immagine nel file
    with open(file_path, 'wb') as f:
        f.write(imgdata)

    sql.insertImage(file_path, data['collectionId'], data['longitudine'], data['latitudine'])
    return '', 204

app.run(host='localhost', port=8000)
