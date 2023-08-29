package com.example.cas

import android.Manifest.permission.ACCESS_FINE_LOCATION
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.provider.MediaStore
import android.widget.Button
import androidx.activity.result.ActivityResult
import androidx.activity.result.ActivityResultCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

// Indirizzo delle altre componenti
const val backendEndpoint = "http://10.0.2.2:8000"

class MainActivity : AppCompatActivity() {
    private var longitude = 0.0
    private var latitude = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

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
                print(collectionId)
            }
        }

        // Crea un ActivityResultCallback per gestire il risultato dell'Intent per scattare la foto
        val takePictureCallback = ActivityResultCallback<ActivityResult> { result ->
            if (result.resultCode == RESULT_OK) {
                val imageUri = result.data?.clipData?.getItemAt(0)?.uri
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
            takePictureLauncher.launch(intentFotocamera)
        }
    }

    private inner class GPSListener : LocationListener {
        override fun onLocationChanged(loc: Location) {
            longitude = loc.longitude
            latitude = loc.latitude
        }
    }
}
