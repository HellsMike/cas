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

var markers = []; // Array per tenere traccia dei marker
var markerLayer; // Layer per i marker

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
                    break;
                case 'global':
                    // Aggiunge i marker globali
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
                    addGlobalMarkers(); 
                    break;
                case 'local':
                    // Aggiunge i marker all'interno del GEOJSON
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
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
                    // Rimuove eventuali colorazioni presenti
                    break;
                case 'local':
                    // Aggiunge la colorazione all'interno del GEOJSON
                    break;
                case 'global_heatmap':
                    // Aggiunge la heatmap globale
                    break;
                case 'local_heatmap':
                    // Aggiunge la heatmap all'interno del GEOJSON
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
                // Mostra il contenitore dei poligoni e crea la mappa dei poligoni
                const polygonsContainer = document.getElementById("map");
                polygonsContainer.style.display = "block";

                geojson.features.forEach(function(feature) {
                    if (feature.geometry.type === "MultiPolygon") {
                        // Crea un layer con il poligono e il bordo senza colore
                        var polygonLayer = L.geoJSON(feature, {
                            style: {
                                fillOpacity: 0, // Opacità del riempimento
                                color: "black", // Colore del bordo
                                weight: 1, // Spessore del bordo
                            },
                    });

                    polygonLayer.addTo(mainMap)
                    
                    // Rende cliccabili i radio button legati ai filtri spaziali
                    document.getElementById('local_marker').disabled = false;   
                    document.getElementById('local_color').disabled = false;
                    document.getElementById('local_heatmap').disabled = false;
                    }
                });
            } else {
                console.error("Il file GeoJSON non contiene un MultiPolygon.");
            }
        };
        reader.readAsText(file);
    }
}

//funzione per verificare se un Marker è contenuto in un polygon
function isMarkerInsidePolygon(marker, polygonFeature) {
    var polygon = L.geoJSON(polygonFeature);
    return polygon.getBounds().contains(marker.getLatLng());
}

/*
    // Funzione per gestire il caricamento del file GeoJSON
    function handleFileSelect(event) {
        const file = event.target.files[0];
    
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const geojson = JSON.parse(e.target.result);
    
                if (geojson.type === "FeatureCollection" && geojson.features) {
                    // Mostra il contenitore dei poligoni e crea la mappa dei poligoni
                    const polygonsContainer = document.getElementById("map");
                    polygonsContainer.style.display = "block";
    
                    geojson.features.forEach(function(feature) {
                        if (feature.geometry.type === "MultiPolygon") {
                            var markerCount=0; // Contatore di marker nel singolo poligono
                            // Calcola il conteggio dei marker all'interno del poligono
                            cityMarkers.forEach(function(marker){
                                if (isMarkerInsidePolygon(marker, feature)) {
                                    markerCount++;
                                }
                            })
                            // Imposta il colore in base al conteggio dei marker
                            var fillColor = "red"; // Colore predefinito se nessun marker è presente
                            if (markerCount > 0) {
                            fillColor = markerCount < 2 ? "yellow" : "green";
                            }
                            // Crea un layer con il poligono e il colore appropriato
                            var polygonLayer = L.geoJSON(feature, {
                                style: {
                                    fillColor: fillColor,
                                    fillOpacity: 0.5, // Opacità del riempimento
                                    color: "black", // Colore del bordo
                                    weight: 2, // Spessore del bordo
                                },
                        });
    
                        polygonLayer.addTo(mainMap)
                        }
                    });
    
                    // Aggiungi i marker delle città alla mappa dei poligoni
                    var cityLayer = L.layerGroup(cityMarkers);
                    cityLayer.addTo(mainMap);
                } else {
                    console.error("Il file GeoJSON non contiene un MultiPolygon.");
                }
            };
            reader.readAsText(file);
        }
    }
    */
