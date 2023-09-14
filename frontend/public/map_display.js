const backendEndpoint = 'http://localhost:8000'

var mainMap = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mainMap);

// Inserisce i bordi per la visualizzazione di una singola mappa
var southWest = L.latLng(-89.98155760646617, -180),
    northEast = L.latLng(89.99346179538875, 180),
    bounds = L.latLngBounds(southWest, northEast);

mainMap.setMaxBounds(bounds);

var geojson; // File GEOJSON
var polygonLayerGroup = L.layerGroup(); // Gruppo layer per i poligoni
var polygonLayerBorderGroup = L.layerGroup(); // Gruppo layer per i bordi dei poligoni

var markers = []; // Array per tenere traccia dei marker
var markerLayer; // Layer per i marker

var soglia = 2; // Soglia per il cambio colorazione da giallo a verde

// Controlla l'opzione selezionata per i marker
var markerRadios = document.querySelectorAll('input[type=radio][name="marker"]');

// Aggiunge un evento 'change' a ciascun pulsante radio per i marker 
for (var i = 0; i < markerRadios.length; i++) {
    markerRadios[i].addEventListener('change', function() {
        if (this.checked) {
            switch(this.value) {
                case 'none':
                    // Rimuove eventuali marker presenti
                    mainMap.removeLayer(markerLayer)
                    markers = []

                    break;
                case 'global':
                    // Aggiunge i marker globali
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
                        markers = []

                    addGlobalMarkers();

                    break;
                case 'local':
                    // Aggiunge i marker all'interno del GEOJSON
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
                        markers = []

                    addLocalMarkers();

                    break;
            }
        }
    });
}

// Controlla l'opzione selezionata per la colorazione
var colorRadios = document.querySelectorAll('input[type=radio][name="color"]');

// Aggiunge un evento 'change' a ciascun pulsante radio per la colorazione 
for (var i = 0; i < colorRadios.length; i++) {
    colorRadios[i].addEventListener('change', function() {
        if (this.checked) {
            switch(this.value) {
                case 'none':
                    // Rimuove eventuali colorazioni presenti e ripristina solo i bordi
                    mainMap.removeLayer(polygonLayerGroup)

                    if (!mainMap.hasLayer(polygonLayerBorderGroup))
                        polygonLayerBorderGroup.addTo(mainMap)

                    polygonLayerGroup = L.layerGroup();

                    break;
                case 'local':
                    // Aggiunge la colorazione all'interno del GEOJSON
                    if (mainMap.hasLayer(polygonLayerGroup))
                        mainMap.removeLayer(polygonLayerGroup)

                    if (mainMap.hasLayer(polygonLayerBorderGroup))
                        mainMap.removeLayer(polygonLayerBorderGroup)

                    polygonLayerGroup = L.layerGroup();
                    colorMap();

                    break;
                case 'global_heatmap':
                    // Aggiunge la heatmap globale
                    if (mainMap.hasLayer(polygonLayerGroup))
                        mainMap.removeLayer(polygonLayerGroup)

                    if (mainMap.hasLayer(polygonLayerBorderGroup))
                        mainMap.removeLayer(polygonLayerBorderGroup)

                    polygonLayerGroup = L.layerGroup();

                    break;
                case 'local_heatmap':
                    // Aggiunge la heatmap all'interno del GEOJSON
                    if (mainMap.hasLayer(polygonLayerGroup))
                        mainMap.removeLayer(polygonLayerGroup)

                    if (mainMap.hasLayer(polygonLayerBorderGroup))
                        mainMap.removeLayer(polygonLayerBorderGroup)

                    polygonLayerGroup = L.layerGroup();

                    break;
            }
        }
    });
}

// Funzione per aggiungere marker globali
function addGlobalMarkers() {
    fetch(backendEndpoint + '/getGlobalMarkers')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            // Crea un nuovo marker per ogni elemento in data
            var marker = L.marker([item.latitudine, item.longitudine])
                .bindPopup(item.nome_collezione)
                .openPopup();

            markers.push(marker); // Aggiungi il marker all'array
        });

        // Aggiungi i marker alla mappa principale
        markerLayer = L.layerGroup(markers);
        markerLayer.addTo(mainMap);   
    })
    .catch(error => console.error('Error:', error));
}

// Funzione per aggiungere marker locali
function addLocalMarkers() {
    fetch(backendEndpoint + '/getLocalMarkers', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(geojson),
    })
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            // Crea un nuovo marker per ogni elemento in data
            var marker = L.marker([item.latitudine, item.longitudine])
                .bindPopup(item.nome_collezione)
                .openPopup();

            markers.push(marker); // Aggiungi il marker all'array
        });

        // Aggiungi i marker alla mappa principale
        markerLayer = L.layerGroup(markers);
        markerLayer.addTo(mainMap);   
    })
    .catch(error => console.error('Error:', error));
}

// Funzione per gestire il caricamento del file GeoJSON
function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            geojson = JSON.parse(e.target.result);

            if (geojson.type === "FeatureCollection" && geojson.features) {
                // Rimuove eventuali bordi e colorazioni legati ad altri geojson
                if (mainMap.hasLayer(polygonLayerGroup))
                mainMap.removeLayer(polygonLayerGroup)

                if (mainMap.hasLayer(polygonLayerBorderGroup))
                    mainMap.removeLayer(polygonLayerBorderGroup)

                polygonLayerBorderGroup = L.layerGroup();

                // Rimuove eventuali marker presenti sulla mappa
                if (mainMap.hasLayer(markerLayer))
                    mainMap.removeLayer(markerLayer)
                    markers = []

                geojson.features.forEach(function(feature) {
                    if (feature.geometry.type === "MultiPolygon") {
                        // Crea un layer con il poligono e il bordo senza colore
                        var polygonLayerBorder = L.geoJSON(feature, {
                            style: {
                                fillOpacity: 0, // Opacità del riempimento
                                color: "black", // Colore del bordo
                                weight: 1, // Spessore del bordo
                            },
                        });
                        
                        polygonLayerBorderGroup.addLayer(polygonLayerBorder);
                    }
                });
                
                polygonLayerBorderGroup.addTo(mainMap)
                // Imposta i radio button ai valori standard
                document.getElementById('no_color').checked = true;
                document.getElementById('no_marker').checked = true;
                // Rende cliccabili i radio button legati ai filtri spaziali
                document.getElementById('local_marker').disabled = false;   
                document.getElementById('local_color').disabled = false;
                document.getElementById('local_heatmap').disabled = false;
            } else {
                console.error("Il file GeoJSON non contiene un MultiPolygon.");
            }
        };
        reader.readAsText(file);
    }
}

// Verifica se un Marker è contenuto in un polygon
function isMarkerInsidePolygon(marker, polygonFeature) {
    var inPolygon = false;
    var point = turf.point([marker.getLatLng().lng, marker.getLatLng().lat]);
    // Controlla se la feature è un polygon o multipolygon
    if (polygonFeature.geometry.type === "Polygon") {
        var polygon = turf.polygon(polygonFeature.geometry.coordinates);
        inPolygon = turf.booleanPointInPolygon(point, polygon);
    } else if (polygonFeature.geometry.type === "MultiPolygon") {
        for (var i = 0; i < polygonFeature.geometry.coordinates.length; i++) {
            var polygon = turf.polygon(polygonFeature.geometry.coordinates[i]);
            if (turf.booleanPointInPolygon(point, polygon)) {
                inPolygon = true;
                break;
            }
        }
    }
    return inPolygon;
}

// Genera la colorazione dei poligoni
function colorMap() {
    if (geojson.type === "FeatureCollection" && geojson.features) {
        var colorMarkers = []; // Lista temporanea dei marker
                
        // Ottiene la lista di marker locali
        fetch(backendEndpoint + '/getLocalMarkers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(geojson),
        })
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                // Crea un nuovo marker per ogni elemento in data
                var marker = L.marker([item.latitudine, item.longitudine])
                    .bindPopup(item.nome_collezione)
                    .openPopup();
    
                colorMarkers.push(marker); // Aggiunge il marker all'array
            });
            
            // Mostra il contenitore dei poligoni e crea la mappa dei poligoni
            geojson.features.forEach(function(feature) {
                if (feature.geometry.type === "MultiPolygon") {
                    var markerCount = 0; // Contatore di marker nel singolo poligono

                    // Calcola il conteggio dei marker all'interno del poligono
                    colorMarkers.forEach(function(marker){
                        if (isMarkerInsidePolygon(marker, feature)) {
                            markerCount++;
                        }
                    })

                    // Imposta il colore in base al conteggio dei marker
                    var fillColor = "red"; // Colore predefinito se nessun marker è presente
                    
                    if (markerCount > 0) 
                        fillColor = markerCount < soglia ? "yellow" : "green";
                    
                    // Crea un layer con il poligono e il colore appropriato
                    var polygonLayer = L.geoJSON(feature, {
                        style: {
                            fillColor: fillColor,
                            fillOpacity: 0.4, // Opacità del riempimento
                            color: "black", // Colore del bordo
                            weight: 1, // Spessore del bordo
                        }
                    });

                    polygonLayerGroup.addLayer(polygonLayer);
                }
            });

            polygonLayerGroup.addTo(mainMap);
        })
        .catch(error => console.error('Error:', error));
    }
}
