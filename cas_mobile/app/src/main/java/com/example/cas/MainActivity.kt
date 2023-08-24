package com.example.cas

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.widget.Button
import fuel.Fuel
import fuel.get
import fuel.post
import kotlinx.coroutines.runBlocking

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val picButton = findViewById<Button>(R.id.pic_btn)
        picButton.setOnClickListener {
            val jsonBody = """
            {
                "chiave1": "valore1",
                "chiave2": "valore2"
            }
            """
            // postRequest(jsonBody)
            getCollections()
        }
    }

    private fun getCollections() = runBlocking {
        val fuelResponse = Fuel.get("http://10.0.2.2:8000/getCollections")
        println(fuelResponse.body)
    }

    private fun postRequest(jsonBody: String) = runBlocking {
        val fuelResponse = Fuel.post("https://example.com", body=jsonBody)
        println(fuelResponse.statusCode)
        println(fuelResponse.body)
    }
}