// Inizializza la mappa con una vista su una posizione iniziale
var map = L.map('map').setView([51.505, -0.09], 13);

// Aggiungi un layer di mappa (ad esempio, OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Aggiungi un marker alla mappa
L.marker([51.5, -0.09]).addTo(map)
    .bindPopup('Odio CAS!')
    .openPopup();
