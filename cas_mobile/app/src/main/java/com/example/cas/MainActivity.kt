package com.example.cas

import android.Manifest.permission.ACCESS_FINE_LOCATION
import android.app.Activity
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.provider.MediaStore
import android.util.ArrayMap
import android.util.Base64
import android.widget.Button
import android.widget.EditText
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.gson.Gson
import fuel.Fuel
import fuel.post
import kotlinx.coroutines.runBlocking
import org.json.JSONObject
import java.io.Serializable

// Indirizzo delle altre componenti
const val backendEndpoint = "http://10.0.2.2:8000"

class MainActivity : AppCompatActivity() {
    // Coordinate attuali
    private var longitude = 0.0
    private var latitude = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        var imageUri = Uri.EMPTY // Uri della foto scattata
        var onClickLongitude = 0.0 // Longitudine al momento dello scatto della foto
        var onClickLatitude = 0.0 // Latitudine al momento dello scatto della foto

        // Aggiornamento della posizione
        if (ContextCompat.checkSelfPermission(this, ACCESS_FINE_LOCATION) !=
            PackageManager.PERMISSION_GRANTED ) {
                ActivityCompat.requestPermissions(this, arrayOf(ACCESS_FINE_LOCATION), 1)
        } else {
            val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

            // Ottiene la posizione di apertura
            val loc = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            latitude = loc?.latitude ?: 0.0
            longitude = loc?.longitude ?: 0.0

            // Ascolta per cambiamenti di location
            val locationListener = GPSListener()
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000,
                10f, locationListener)
        }

        // Registrazione del callback per gestire il risultato restituito dalla collection activity
        val resultLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                // Recupero id della collection
                val collectionId = result.data?.getStringExtra("result")

                // Invio della richiesta di inserimento della foto
                // Ottieni un InputStream per l'URI dell'immagine
                val inputStream = contentResolver.openInputStream(imageUri)

                // Leggi i dati dall'InputStream e convertili in una stringa codificata in base64
                val imageBytes = inputStream?.readBytes()
                val base64Image = Base64.encodeToString(imageBytes, Base64.DEFAULT)

                // Invio delle richiesta per aggiungere la foto al db
                sendPhoto(onClickLongitude, onClickLatitude, collectionId!!, base64Image)
            }
        }

        // Crea un ActivityResultCallback per gestire il risultato dell'Intent per scattare la foto
        val takePictureCallback = ActivityResultCallback<ActivityResult> { result ->
            if (result.resultCode == RESULT_OK) {
                // Cattura della posizione al momento della foto
                onClickLongitude = longitude
                onClickLatitude = latitude

                // Creazione di una nuova activity per la visualizzazione delle collection
                val intentCollezioni = Intent(this, CollectionActivity::class.java)
                intentCollezioni.putExtra("longitudine", longitude)
                intentCollezioni.putExtra("latitudine", latitude)
                resultLauncher.launch(intentCollezioni)
            }
        }

        // Crea un ActivityResultLauncher per l'Intent per scattare la foto
        val takePictureLauncher = registerForActivityResult(
            ActivityResultContracts.StartActivityForResult(), takePictureCallback)

        // Bottone per le foto
        val picButton = findViewById<Button>(R.id.pic_btn)
        picButton.setOnClickListener {
            // Scatta foto
            val intentFotocamera = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            val values = ContentValues()
            values.put(MediaStore.Images.Media.TITLE, "New Picture")
            values.put(MediaStore.Images.Media.DESCRIPTION, "From your Camera")
            imageUri = contentResolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            intentFotocamera.putExtra(MediaStore.EXTRA_OUTPUT, imageUri)
            takePictureLauncher.launch(intentFotocamera)
        }

        // Casella per l'inserimento di n numero di foto da visualizzare
        val nGallery = findViewById<EditText>(R.id.n_text)
        // Bottone per la visualizzazione delle n foto più vicine
        val galleryButton = findViewById<Button>(R.id.gallery_btn)
        galleryButton.setOnClickListener {
            // Crea un Intent per avviare la GalleryActivity
            val intent = Intent(this, GalleryActivity::class.java)
            intent.putExtra("n", nGallery.text.toString().toInt())
            intent.putExtra("longitudine", longitude)
            intent.putExtra("latitudine", latitude)
            startActivity(intent)
        }
    }

    private inner class GPSListener : LocationListener {
        override fun onLocationChanged(loc: Location) {
            longitude = loc.longitude
            latitude = loc.latitude
        }
    }

    private fun sendPhoto(longitudine: Double, latitudine: Double, collectionId: String,
                          base64image: String) = runBlocking {
        // Formattazione dei dati in JSON
        val jsonBody = JSONObject()
            .put("longitudine", longitudine)
            .put("latitudine", latitudine)
            .put("collectionId", collectionId)
            .put("base64image", base64image)
        val header = mapOf("Content-Type" to "application/json")

        // Invio richiesta
        Fuel.post("$backendEndpoint/insertPhoto", body = jsonBody.toString(), headers = header)
    }
}
