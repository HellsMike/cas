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

var cityMarkers = []; // Array per tenere traccia dei marker delle città

// Funzione per aggiungere marker per le città
function addCityMarkers() {
    fetch(backendEndpoint + '/getGlobalMarkers')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                // Crea un nuovo marker per ogni elemento in data
                var marker = L.marker([item.latitudine, item.longitudine])
                    .bindPopup(item.nome_collezione)
                    .openPopup();
    
                cityMarkers.push(marker); // Aggiungi il marker all'array
            });

            // Aggiungi i marker delle città alla mappa principale
            var cityLayer = L.layerGroup(cityMarkers);
            cityLayer.addTo(mainMap);   
        })
        .catch(error => console.error('Error:', error));

    // Aggiungi i marker delle città alla mappa principale
    var cityLayer = L.layerGroup(cityMarkers);
    cityLayer.addTo(mainMap);
}

// Chiamata alla funzione per aggiungere marker per le città
addCityMarkers();

// Funzione per gestire il caricamento del file GeoJSON
function handleFileSelect(event) {
    const file = event.target.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const geojson = JSON.parse(e.target.result);

            if (geojson.type === "FeatureCollection" && geojson.features) {
                // Nascondi la mappa principale
                mainMap.remove();

                // Mostra il contenitore dei poligoni e crea la mappa dei poligoni
                const polygonsContainer = document.getElementById("polygons-container");
                polygonsContainer.style.display = "block";
                
                const polygonsMap = L.map('polygons').setView([0, 0], 2);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(polygonsMap);

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

                    polygonLayer.addTo(polygonsMap)
                    }
                });

                // Aggiungi i marker delle città alla mappa dei poligoni
                var cityLayer = L.layerGroup(cityMarkers);
                cityLayer.addTo(polygonsMap);
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
