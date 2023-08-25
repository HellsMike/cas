package com.example.cas

import android.Manifest.permission.ACCESS_FINE_LOCATION
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import fuel.Fuel
import fuel.post
import kotlinx.coroutines.runBlocking

// Indirizzo delle altre componenti
const val backendEndpoint = "http://10.0.2.2:8000"

class MainActivity : AppCompatActivity() {

    var latitude = 0.0
    var longitude = 0.0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Bottone per le foto
        val picButton = findViewById<Button>(R.id.pic_btn)
        picButton.setOnClickListener {
            val n = 2
            val dict = mapOf("latitudine" to latitude, "longitudine" to longitude, "n" to n)

            // Formattazione dei dati in JSON
            val jsonBody = "{\"latitudine\": $latitude, \"longitudine\": $longitude, \"n\": $n}"
            getCollections(jsonBody)
        }

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
    }

    private fun getCollections(jsonBody: String) = runBlocking {
        val header = mapOf("Content-Type" to "application/json")
        val fuelResponse = Fuel.post("$backendEndpoint/getCollections", body = jsonBody,
            headers = header)
        println(fuelResponse.statusCode)
        println(fuelResponse.body)
    }

    private inner class GPSListener : LocationListener {
        override fun onLocationChanged(loc: Location) {
            longitude = loc.longitude
            latitude = loc.latitude
        }
    }
}