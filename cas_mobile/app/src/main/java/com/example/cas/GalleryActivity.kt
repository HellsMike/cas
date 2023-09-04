package com.example.cas

import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import fuel.Fuel
import fuel.post
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject

class GalleryActivity : AppCompatActivity() {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: RecyclerView.Adapter<*>
    private lateinit var layoutManager: RecyclerView.LayoutManager

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.gallery_view)

        recyclerView = findViewById(R.id.recycler_view)
        recyclerView.setHasFixedSize(true)

        layoutManager = LinearLayoutManager(this)
        recyclerView.layoutManager = layoutManager

        lifecycleScope.launch {
            val imageGallery = getNPhoto(
                intent.getDoubleExtra("longitudine", 0.0),
                intent.getDoubleExtra("latitudine", 0.0),
                intent.getIntExtra("n", 10))

            adapter = GalleryAdapter(imageGallery)

            recyclerView.adapter = adapter
        }

        // Bottone per chiudere l'intent
        val backButton = findViewById<FloatingActionButton>(R.id.back_btn)
        backButton.setOnClickListener {
            finish()
        }
    }

    private suspend fun getNPhoto(longitudine: Double, latitudine: Double, n: Int) : List<Image> {
        return withContext(Dispatchers.IO) {
            // Formattazione dei dati in JSON
            val jsonBody = JSONObject()
                .put("longitudine", longitudine)
                .put("latitudine", latitudine)
                .put("n", n)
            val header = mapOf("Content-Type" to "application/json")

            // Invio richiesta
            val fuelResponse = Fuel.post("$backendEndpoint/getImages", body = jsonBody.toString(),
                headers = header)

            if (fuelResponse.statusCode == 200) {
                val gson = Gson()
                return@withContext gson.fromJson<Array<Image>?>(
                    fuelResponse.body,
                    Array<Image>::class.java
                ).toList<Image>()
            }
            return@withContext emptyList()
        }
    }
}

data class Image(val longitudine: Double, val latitudine: Double, val distanza: Double?,
                 val base64image: String)

class GalleryAdapter(private val imageData: List<Image>) :
    RecyclerView.Adapter<GalleryAdapter.ViewHolder>() {

    class ViewHolder(val view: View, val imageView: ImageView, val textView: TextView) :
        RecyclerView.ViewHolder(view)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.gallery_item, parent,
            false)
        val imageView = view.findViewById<ImageView>(R.id.image_view)
        val textView = view.findViewById<TextView>(R.id.text_view)
        return ViewHolder(view, imageView, textView)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val image = imageData[position]
        val description = "Longitudine: " + image.longitudine.toString() + " Latitudine: " +
                image.latitudine.toString()
        holder.textView.text = description

        GlobalScope.launch(Dispatchers.IO) {
            val imageBytes = Base64.decode(image.base64image, Base64.DEFAULT)
            val decodedImage = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
            withContext(Dispatchers.Main) {
                holder.imageView.setImageBitmap(decodedImage)
            }
        }
    }

    override fun getItemCount() = imageData.size
}
