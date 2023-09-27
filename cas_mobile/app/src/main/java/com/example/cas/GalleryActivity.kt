package com.example.cas

import android.graphics.BitmapFactory
import android.os.Bundle
import android.util.Base64
import android.widget.ImageView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.android.material.floatingactionbutton.FloatingActionButton
import com.google.gson.Gson
import fuel.Fuel
import fuel.post
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.ProtocolException

class GalleryActivity : AppCompatActivity() {
    private var currentImageIndex = 0
    private lateinit var imageGallery: List<Image>

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.gallery_activity)

        // Bottone per chiudere l'intent
        val backButton = findViewById<FloatingActionButton>(R.id.back_btn)
        backButton.setOnClickListener {
            finish()
        }

        val imageView = findViewById<ImageView>(R.id.pic_view)

        imageGallery = getNPict(
            intent.getDoubleExtra("longitudine", 0.0),
            intent.getDoubleExtra("latitudine", 0.0),
            intent.getIntExtra("n", 10)
        )

        println(imageGallery[0])
        if (imageGallery.isNotEmpty()) {
            val image = imageGallery[currentImageIndex]
            val base64Image = getBase64Image(image.id)
            println(base64Image.base64image)
            if (base64Image.base64image != "null") {
                val imageBytes = Base64.decode(base64Image.base64image, Base64.DEFAULT)
                val decodedImage = BitmapFactory.decodeByteArray(imageBytes, 0,
                    imageBytes.size)
                imageView.setImageBitmap(decodedImage)
            }
        }

        imageView.setOnClickListener {
            /* Incrementa il contatore per la visualizzazione immagini e lo resetta se arrivato
            all'ultima */
            currentImageIndex = (currentImageIndex + 1) % imageGallery.size
            val image = imageGallery[currentImageIndex]
            val base64Image = getBase64Image(image.id)
            if (base64Image.base64image != "null") {
                val imageBytes = Base64.decode(base64Image.base64image, Base64.DEFAULT)
                val decodedImage = BitmapFactory.decodeByteArray(
                    imageBytes, 0,
                    imageBytes.size
                )
                imageView.setImageBitmap(decodedImage)
            }
        }
    }

    private fun getNPict(longitudine: Double, latitudine: Double, n: Int) :
            List<Image> = runBlocking {
        // Formattazione dei dati in JSON
        val jsonBody = JSONObject()
            .put("longitudine", longitudine)
            .put("latitudine", latitudine)
            .put("n", n)
        val header = mapOf("Content-Type" to "application/json", "Connection" to "close")
        // Invio richiesta
        val fuelResponse = Fuel.post("$backendEndpoint/getImages", body = jsonBody.toString(),
            headers = header)

        if (fuelResponse.statusCode == 200) {
            val gson = Gson()
            println(fuelResponse)
            println(fuelResponse.body)
            println(fuelResponse.body.length)
            return@runBlocking gson.fromJson<Array<Image>?>(
                fuelResponse.body,
                Array<Image>::class.java
            ).toList<Image>()
        }
        return@runBlocking emptyList()
    }

    private fun getBase64Image(id: Int) : Base64Image = runBlocking {
        try {
            // Formattazione dei dati in JSON
            val jsonBody = JSONObject()
                .put("id", id)
            val header = mapOf("Content-Type" to "application/json", "Connection" to "close")

            println("KOTLIN MERDA")
            // Invio richiesta
            val fuelResponse = Fuel.post("$backendEndpoint/getImage", body = jsonBody.toString(),
                headers = header)

            println(fuelResponse)
            println(fuelResponse.body)
            println(fuelResponse.body.length)
            if (fuelResponse.statusCode == 200) {
                val gson = Gson()
                return@runBlocking gson.fromJson<Base64Image>(
                    fuelResponse.body,
                    Base64Image::class.java
                )
            }

            return@runBlocking Base64Image("null")
        } catch (e: ProtocolException) {
            println("AAAAAAAAAAAAAAAAAAAAAAA")
            println(e)
            return@runBlocking getBase64Image(id)
        }
    }
}

data class Image(val id: Int, val longitudine: Double, val latitudine: Double,
                 val nome_collezione: String, val distanza: Double)

data class Base64Image(val base64image: String)
