package com.example.cas

import android.Manifest.permission.ACCESS_FINE_LOCATION
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

// Indirizzo delle altre componenti
const val backendEndpoint = "http://10.0.2.2:8000"

class MainActivity : AppCompatActivity() {
    private var longitude = 0.0
    private var latitude = 0.0

    // Registrazione del callback per gestire il risultato restituito dall'activity delle collection
    private val resultLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val resultValue = result.data?.getStringExtra("result")
            // Recupero id della collection
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Aggiornamento della posizione
        if (ContextCompat.checkSelfPermission(this, ACCESS_FINE_LOCATION) !=
            PackageManager.PERMISSION_GRANTED ) {
                ActivityCompat.requestPermissions(this, arrayOf(ACCESS_FINE_LOCATION),
                    1)
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

        // Bottone per le foto
        val picButton = findViewById<Button>(R.id.pic_btn)
        picButton.setOnClickListener {
            // Creazione di una nuova activity per la visualizzazione delle collection
            val intent = Intent(this, CollectionActivity::class.java)
            intent.putExtra("longitudine", longitude)
            intent.putExtra("latitudine", latitude)
            resultLauncher.launch(intent)
        }
    }

    private inner class GPSListener : LocationListener {
        override fun onLocationChanged(loc: Location) {
            longitude = loc.longitude
            latitude = loc.latitude
        }
    }
}
