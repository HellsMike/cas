package com.example.cas

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ListView
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
        // Formattazione dei dati in JSON
        val JSONBody = "{\"longitudine\": $longitudine, \"latitudine\": $latitudine, \"n\": $n}"
        val collectionList = getCollections(JSONBody)
        print(collectionList)

        // Creazione di un ArrayAdapter per la ListView
        val items = mutableListOf("Elemento 1", "Elemento 2", "Elemento 3")
        val adapter = ArrayAdapter(this, android.R.layout.simple_list_item_1, items)
        collections.adapter = adapter

        // Aggiunta di un nuovo elemento alla lista
        items.add("Nuovo elemento")

        // Notifica all'adapter che i dati sono cambiati
        adapter.notifyDataSetChanged()

        // Recupera l'id della collection selezionata e la passa alla Main Activity
        collections.setOnItemClickListener { parent, view, position, id ->
            val element = parent.getItemAtPosition(position) as String
            val intent = Intent(this, MainActivity::class.java)
            intent.putExtra("result", element)
            setResult(Activity.RESULT_OK, intent)
            finish()
        }
    }

    private fun getCollections(jsonBody: String) : List<Collection> = runBlocking {
        val header = mapOf("Content-Type" to "application/json")
        val fuelResponse = Fuel.post("$backendEndpoint/getCollections", body = jsonBody,
            headers = header)
        if (fuelResponse.statusCode == 200) {
            val gson = Gson()
            val collectionList: List<Collection> = gson.fromJson(fuelResponse.body,
                Array<Collection>::class.java).toList()
            return@runBlocking collectionList
        }
        return@runBlocking emptyList()
    }
}

data class Collection(val id: Int, val nome: String, val latitudine: Double,
                      val longitudine: Double, val distanza: Double)
