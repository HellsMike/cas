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

var heatmapLayer = L.heatLayer();

var soglia = 2; // Soglia per il cambio colorazione da giallo a verde nella colorazione a poligoni

var collectionList = []; // Lista collezioni esistenti

var selectedId; // Id della collezione selezionata per il caricamentoo di file

setCollectionAutocomplete(); 

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
                    document.getElementById('n_cluster').disabled = true;
                    document.getElementById('cluster_submit').disabled = true;

                    break;
                case 'global':
                    // Aggiunge i marker globali
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
                        markers = []

                    document.getElementById('n_cluster').disabled = true;
                    document.getElementById('cluster_submit').disabled = true;
                    addGlobalMarkers();

                    break;
                case 'local':
                    // Aggiunge i marker all'interno del GEOJSON
                    if (mainMap.hasLayer(markerLayer))
                        mainMap.removeLayer(markerLayer)
                        markers = []

                    document.getElementById('n_cluster').disabled = true;
                    document.getElementById('cluster_submit').disabled = true;
                    addLocalMarkers();

                    break;
                case 'cluster':
                    // Aggiunge i marker dei centroidi
                    document.getElementById('n_cluster').disabled = false; 
                    document.getElementById('cluster_submit').disabled = false;
                    // L'aggiunta dei marker è gestita dalla funzione chiamata dal bottone

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
                    if (mainMap.hasLayer(polygonLayerGroup))
                        mainMap.removeLayer(polygonLayerGroup)

                    if (mainMap.hasLayer(heatmapLayer))
                        mainMap.removeLayer(heatmapLayer)

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

                    if (mainMap.hasLayer(heatmapLayer))
                        mainMap.removeLayer(heatmapLayer)

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
                    colorGlobalHeatmap();

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

// Ottiene le collezioni esistenti e le imposta nell'autocomplete
function setCollectionAutocomplete() {
    fetch(backendEndpoint + '/getAllCollections')
    .then(response => response.json())
    .then(data => {
        collectionList = data;
        // Filtra la ricerca delle collezioni a tempo di utilizzo
        $( "#collection" ).autocomplete({
            source: collectionList.map(item => ({label: item.nome, value: item.id})),
            // Fa aprire il menù verso l'alto
            position: { my : "left bottom", at: "left top" },
            select: function(event, ui) {
                // Memorizza l'ID nell variabile globale
                selectedId = ui.item.value;
                event.preventDefault();
                // Imposta il campo di input sul nome dell'elemento selezionato
                $(this).val(ui.item.label);
            }
        });  
    })
    .catch(error => console.error('Error:', error));
}

// Funzione per gestire il caricamento del file GeoJSON
function handleGeoJsonSelect(event) {
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

// Cambia il tipo di input per le foto
function toggleInput(value) {
    document.getElementById('fileInput').style.display = value === 'file' ? 'block' : 'none';
    document.getElementById('directoryInput').style.display = value === 'directory' ? 'block' : 'none';
}

// Controlla se le coordinate sono accettabili
function isValidCoordinate(coordinate, min, max) {
    var value = parseFloat(coordinate);
    return !isNaN(value) && value >= min && value <= max;
}

// Crea una nuova collezione e aggiorna il selectedId
async function nuovaCollezione(collezione) {
    // Effettua la richiesta per la creazione di una nuova collezione
    let json = {
        nome: collezione
    };

    let response = await fetch(backendEndpoint + '/newCollection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(json)
    });

    let data = await response.json();
    selectedId = data[0].id;
}

// Gestisce il caricamento di file foto o cartelle
async function uploadFiles() {
    var input = document.getElementById(document.getElementById('uploadType').value === 'file' ? 'fileInput' : 'directoryInput');
    var latitude = document.getElementById('latitude').value;
    var longitude = document.getElementById('longitude').value;
    var collezione = document.getElementById('collection').value;

    // Verifica se le coordinate sono in un formato valido
    if (!isValidCoordinate(latitude, -90, 90)) {
      alert('Inserisci una latitudine valida compresa tra -90 e 90.');
      return;
    }
  
    if (!isValidCoordinate(longitude, -180, 180)) {
      alert('Inserisci una longitudine valida compresa tra -180 e 180.');
      return;
    }
  
    // Verifica se la collezione è già esistente o è necessario crearla
    if (collectionList.every(dict => dict.nome !== collezione)) {
        await nuovaCollezione(collezione);
    }

    for (var i = 0; i < input.files.length; i++) {
      var file = input.files[i];
      var fileType = file.type;
      var validImageTypes = ['image/gif', 'image/jpeg', 'image/png'];
  
      if (validImageTypes.includes(fileType)) {
        // Estrae la codifica in base64 dell'immagine
        let reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function() {
            let base64Image = reader.result.split(',')[1];
            let data = {
                latitudine: latitude,
                longitudine: longitude,
                base64image: base64Image,
                collectionId: selectedId.toString()
            };
            
            // Effettua la richiesta per l'inserimento dell'immagine
            fetch(backendEndpoint + '/insertPhoto', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        }
      } else {
        console.log('Il file ' + file.name + ' non è un\'immagine e sarà ignorato.');
      }
    }
}

// Funzione per aggiungere marker globali
function addGlobalMarkers() {
    fetch(backendEndpoint + '/getGlobalMarkers')
    .then(response => response.json())
    .then(data => {
        data.forEach(item => {
            // Crea un nuovo marker per ogni elemento in data
            var marker = L.marker([item.latitudine, item.longitudine])
            // Al click effettua la richiesta per ricevere l'immagine
            marker.on('click', function() {
                // Effettua la richiesta HTTP
                fetch(backendEndpoint + '/getImagesByPosition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({longitudine: item.longitudine, latitudine: item.latitudine}),
                })
                .then(response => response.json())
                .then(data => {
                        var markerString = '';
                        data.forEach(image => {
                            markerString += "<img src='data:image/jpeg;base64," + image.base64image + 
                            "' style='max-width: 100%; min-width: 150px; height: auto; margin-top: 0; margin-bottom: 0;' />" + 
                            "<p style='margin-top: 0; margin-bottom: 0;'>" + image.nome_collezione + "</p>";
                        })
                        // Crea un popup con l'immagine e il testo
                        this.bindPopup(markerString).openPopup();
                    }
                );
            });
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
           // Al click effettua la richiesta per ricevere l'immagine
            marker.on('click', function() {
                // Effettua la richiesta HTTP
                fetch(backendEndpoint + '/getImagesByPosition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({longitudine: item.longitudine, latitudine: item.latitudine}),
                })
                .then(response => response.json())
                .then(data => {
                        var markerString = '';
                        data.forEach(image => {
                            markerString += "<img src='data:image/jpeg;base64," + image.base64image + 
                            "' style='max-width: 100%; min-width: 150px; height: auto; margin-top: 0; margin-bottom: 0;' />" + 
                            "<p style='margin-top: 0; margin-bottom: 0;'>" + image.nome_collezione + "</p>";
                        })
                        // Crea un popup con l'immagine e il testo
                        this.bindPopup(markerString).openPopup();
                    }
                );
            });
            markers.push(marker); // Aggiungi il marker all'array
        });

        // Aggiungi i marker alla mappa principale
        markerLayer = L.layerGroup(markers);
        markerLayer.addTo(mainMap);   
    })
    .catch(error => console.error('Error:', error));
}

// Aggiunge i marker dei centroidi dei cluster
function addClusterMarkers() {
    if (mainMap.hasLayer(markerLayer)) {
        mainMap.removeLayer(markerLayer)
        markers = []
    }

    var n_cluster = document.getElementById("n_cluster").value;
    
    // Se il numero di cluster è stato dato in input esegue il kmeans con k altrimenti utilizza l'elbow method
    if (n_cluster > 0 ) {
        fetch(backendEndpoint + '/getKMeansFixated', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ k: n_cluster }),
        })
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                // Crea un nuovo marker per ogni elemento in data
                var marker = L.marker([item.latitudine, item.longitudine])
                    .bindPopup('Numero marker: ' + item.size)
                    .openPopup();
    
                markers.push(marker); // Aggiungi il marker all'array
            });
    
            // Aggiungi i marker alla mappa principale
            markerLayer = L.layerGroup(markers);
            markerLayer.addTo(mainMap);   
        })
        .catch(error => console.error('Error:', error));
    } else {
        fetch(backendEndpoint + '/getElbowKMeans')
        .then(response => response.json())
        .then(data => {
            data.forEach(item => {
                // Crea un nuovo marker per ogni elemento in data
                var marker = L.marker([item.latitudine, item.longitudine])
                    .bindPopup('Numero marker: ' + item.size)
                    .openPopup();
    
                markers.push(marker); // Aggiungi il marker all'array
            });
    
            // Aggiungi i marker alla mappa principale
            markerLayer = L.layerGroup(markers);
            markerLayer.addTo(mainMap);   
        })
        .catch(error => console.error('Error:', error));
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

// Crea la heatmap globale
function colorGlobalHeatmap() {
    fetch(backendEndpoint + '/getGlobalMarkers')
    .then(response => response.json())
    .then(data => {    
        // Crea un array di punti per la heatmap
        var heatmapPoints = [];
        
        data.forEach(item => {
            // Calcola l'intensità proporzionale al numero di elementi
            var intensity = 100;
    
            // Aggiungi ogni punto alla lista della heatmap con l'intensità calcolata
            heatmapPoints.push([item.latitudine, item.longitudine, intensity]);
        });
    
        // Crea la heatmap e aggiungila alla mappa
        heatmapLayer = L.heatLayer(heatmapPoints)
        heatmapLayer.addTo(mainMap);
    })
    .catch(error => console.error('Error:', error));
}
