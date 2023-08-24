from flask import Flask, request
import json
import sql

app = Flask(__name__)

# Fornisce le collezioni esistenti nel database
@app.route('/getCollections', methods=['POST'])
def getCollection():
    data = request.get_json()
    print(data)
    return sql.selectNCollections(data['latitudine'], data['longitudine'], data['n'])

app.run(host='localhost', port=8000)
