from flask import Flask, request
import sql

app = Flask(__name__)

# Fornisce le collezioni esistenti nel database
@app.route('/getCollections', methods=['POST'])
def getCollection():
    print(request.data)
    data = request.get_json()
    print(data)
    return sql.selectNCollections(data['longitudine'], data['latitudine'], data['n'])

# Crea una nuova collezione
@app.route('/newCollection', methods=['POST'])
def newCollection():
    print(request.data)
    data = request.get_json()
    print(data)
    return sql.insertCollection(data['nome'], data['latitudine'], data['longitudine'])

app.run(host='localhost', port=8000)
