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
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class MainActivity : AppCompatActivity() {
    private var latitude = 0.0
    private var longitude = 0.0
    // per galleria
    private lateinit var resultLauncher: ActivityResultLauncher<Intent>
    // foto
    private lateinit var resultLauncherFoto: ActivityResultLauncher<Intent>


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val bottone = findViewById<Button>(R.id.button)
        val testo = findViewById<TextView>(R.id.testone)
        val casella = findViewById<EditText>(R.id.casella)
        val latitudine = findViewById<TextView>(R.id.latitudine)
        val longitudine = findViewById<TextView>(R.id.longitudine)
        val mostra_foto = findViewById<ImageView>(R.id.fotuzza)

        mostra_foto.setImageResource(R.drawable.goblin)

        // location
        if (ContextCompat.checkSelfPermission(
                this,
                ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(this, arrayOf(ACCESS_FINE_LOCATION), 1)
        } else {
            val locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val locationListener = MyLocationListener()
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                5000,
                10f,
                locationListener
            )
        }


        bottone.setOnClickListener {
            if (casella.text.toString() == "Franco") {
                testo.text = "Grande Franco"
                latitudine.text = latitude.toString()
                longitudine.text = longitude.toString()
            }
        }

        //galleria
        resultLauncher =
            registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
                if (result.resultCode == Activity.RESULT_OK) {
                    val data: Intent? = result.data
                    val selectedImageUri = data?.data
                    // Use the selectedImageUri to display the image in an ImageView or process it as needed
                    mostra_foto.setImageURI(selectedImageUri)
                }
            }

        val bottone_galleria = findViewById<Button>(R.id.bottone_galleria)
        bottone_galleria.setOnClickListener {
            val intent = Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI)
            resultLauncher.launch(intent)
        }

        //foto
        resultLauncherFoto = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == Activity.RESULT_OK) {
                val data: Intent? = result.data
                val imageBitmap = data?.extras?.get("data") as Bitmap
                // Use the imageBitmap to display the image in an ImageView or process it as needed
                mostra_foto.setImageBitmap(imageBitmap)
            }
        }

        val bottone_foto = findViewById<Button>(R.id.bottone_foto)
        bottone_foto.setOnClickListener {
            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            resultLauncherFoto.launch(intent)
        }
    }

    private inner class MyLocationListener : LocationListener {
        override fun onLocationChanged(loc: Location) {
            longitude = loc.longitude
            latitude = loc.latitude
        }
    }
}