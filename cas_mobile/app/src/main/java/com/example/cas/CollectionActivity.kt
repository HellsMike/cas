package com.example.cas

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import android.widget.ListView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import fuel.Fuel
import fuel.post
import kotlinx.coroutines.runBlocking
import com.google.gson.Gson

class CollectionActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.collection_activity)

        val collections = findViewById<ListView>(R.id.collections)

        // Recupero dalla Main Activity i valori di longitudine e latitudine
        val longitudine = intent.getDoubleExtra("longitudine", 0.0)
        val latitudine = intent.getDoubleExtra("latitudine", 0.0)

        // Richiesta collezioni
        val n = 2
        val collectionList = getCollections(longitudine, latitudine, n)

        // Creazione di un ArrayAdapter per la ListView
        val adapter = CollectionAdapter(this, collectionList)
        collections.adapter = adapter

        // Notifica all'adapter che i dati sono cambiati
        adapter.notifyDataSetChanged()

        // Recupera l'id della collection selezionata e la passa alla Main Activity
        collections.setOnItemClickListener { parent, view, position, id ->
            val collection = collectionList[position]
            val intent = Intent(this, MainActivity::class.java)
            intent.putExtra("result", collection.id.toString())
            setResult(Activity.RESULT_OK, intent)
            finish()
        }
    }

    // Richiesta al backend per le n collezioni più vicine
    private fun getCollections(longitudine: Double, latitudine: Double, n: Int) :
            List<Collection> = runBlocking {
        // Formattazione dei dati in JSON
        val JSONBody = "{\"longitudine\": $longitudine, \"latitudine\": $latitudine, \"n\": $n}"
        val header = mapOf("Content-Type" to "application/json")
        // Invio richiesta
        val fuelResponse = Fuel.post("$backendEndpoint/getCollections", body = JSONBody,
            headers = header)
        if (fuelResponse.statusCode == 200) {
            val gson = Gson()
            return@runBlocking gson.fromJson<Array<Collection>?>(
                fuelResponse.body,
                Array<Collection>::class.java
            ).toList<Collection>()
        }
        return@runBlocking emptyList()
    }
}

data class Collection(val id: Int, val nome: String, val longitudine: Double,
                      val latitudine: Double, val distanza: Double)

// Adapter per la ListView
class CollectionAdapter(context: Context, private val collections: List<Collection>) :
    ArrayAdapter<Collection>(context, 0, collections) {
    override fun getView(position: Int, convertView: View?, parent: ViewGroup): View {
        // Ottieni l'oggetto corrente
        val collection = getItem(position)

        // Verifica se la vista esiste già, altrimenti la crea
        val view = convertView ?: LayoutInflater.from(context).inflate(R.layout.collection_item,
            parent, false)

        // Imposta i valori delle viste
        view.findViewById<TextView>(R.id.nome).text = collection!!.nome
        view.findViewById<TextView>(R.id.longitudine).text = "Lon: " + collection.longitudine.toString()
        view.findViewById<TextView>(R.id.latitudine).text = "Lat: " + collection.latitudine.toString()

        return view
    }
}
