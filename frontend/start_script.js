var mainMap = L.map('map').setView([0, 0], 2);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(mainMap);

var cityMarkers = []; // Array per tenere traccia dei marker delle città

// Funzione per aggiungere marker per le città
function addCityMarkers() {
    var cities = [
        { name: "New York", coordinates: [40.7128, -74.0060] },
        { name: "Paris", coordinates: [48.8566, 2.3522] },
        { name: "Tokyo", coordinates: [35.682839, 139.759455] },
        { name: "Milano", coordinates: [45.4642, 9.1900] },
        { name: "Roma", coordinates: [41.9028, 12.4964] },
        { name: "Shangai", coordinates: [31.2304, 121.4737] },
        { name: "Dubai", coordinates: [25.276987, 55.296249] },
        { name: "Parma", coordinates: [44.8015, 10.3279] },
        { name: "Berlino", coordinates: [52.5200, 13.4050] },
        { name: "Dusseldorf", coordinates: [51.2277, 6.7735] },
        { name: "Dortmund", coordinates: [51.5134, 7.4653] },
        { name: "Madrid", coordinates: [40.4168, -3.7038] },
        { name: "Lione", coordinates: [45.75, 4.85] },
        { name: "Atene", coordinates: [37.9838, 23.7275] }
    ];

    cities.forEach(function(city) {
        var marker = L.marker(city.coordinates)
            .bindPopup(city.name)
            .openPopup();
        cityMarkers.push(marker); // Aggiungi il marker all'array
    });

    // Aggiungi i marker delle città alla mappa principale
    var cityLayer = L.layerGroup(cityMarkers);
    cityLayer.addTo(mainMap);
}

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
                        L.geoJSON(feature).addTo(polygonsMap);
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

// Chiamata alla funzione per aggiungere marker per le città
addCityMarkers();
