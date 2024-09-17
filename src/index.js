import { Map, NavigationControl } from 'mapbox-gl/dist/mapbox-gl.js';
import mapboxgl from 'mapbox-gl';

const API_KEY = import.meta.env.VITE_API_KEY;
const slidePanel = document.getElementById('slide-panel');
const panelTitle = document.getElementById('panel-title');
const panelImg = document.getElementById('panel-img');
const panelDescription = document.getElementById('panel-description');
const closePanelBtn = document.getElementById('close-panel');

mapboxgl.accessToken = API_KEY;
const map = new Map({
    container: 'map',
    center: [-74.5, 40], // -8.114850, -79.039117
    zoom: 0,
    bearing: 0,
    pitch: 0,
});

map.addControl(new NavigationControl());

map.on('load', () => {
    // Animación inicial
    map.flyTo({
        center: [-79.039117, -8.114850],
        zoom: 16,
        bearing: 0,
        pitch: 60,
        speed: 2,
        curve: 1,
        essential: true
    });

    // Geojson's
    // Lugares turísticos
    map.addSource('route', {
        'type': 'geojson',
        'data': '/geojson/map-tourist.geojson' 
    });

    map.addLayer({
        'id': 'route',
        'type': 'fill',
        'source': 'route',
        'paint': {
            // '#1abfdf' // #4e17a8 #ff610f
            'fill-color': '#4e17a8',
            'fill-opacity': 0.3,
        }
    });
    
    // Universidad
    map.addSource('uni', {
        'type': 'geojson',
        'data': '/geojson/map.geojson' 
    })

    map.addLayer({
        'id': 'UNT',
        'type': 'fill',
        'source': 'uni',
        'paint': {
            // '#1abfdf' // #4e17a8 #ff610f
            'fill-color': '#ff610f',
            'fill-opacity': 0.3,
        }
    })

    // Hoteles
    map.addSource('hotel', {
        'type': 'geojson',
        'data': '/geojson/map-hotels.geojson' 
    })

    map.addLayer({
        'id': 'hotel',
        'type': 'fill',
        'source': 'hotel',
        'paint': {
            // '#1abfdf' // #4e17a8 #ff610f
            'fill-color': '#1abfdf',
            'fill-opacity': 0.3,
        }
    })

    // Marcadores
    // Marcador para la universidad
    const el = document.createElement('div');
    el.className = 'marker';    
    
    new mapboxgl.Marker(el)
    .setLngLat([-79.039117, -8.114850])
    .addTo(map)
    .getElement().addEventListener('click', () => {
        showRouteToMarker([-79.039117, -8.114850]);
        map.flyTo({
            center: [-79.039117, -8.114850],
            zoom: 15,
            bearing: 0,
            pitch: 60,
            speed: 0.5,
            curve: 1,
            essential: true
        });
        onMarkerClick(
            'Universidad Nacional de Trujillo',
            '../UNT.jpg',
            'This is the National University of Trujillo, one of the most important universities in the region.'
        );
    });

    // Marcadores para los centros turísticos
    fetch('/json/tourist-centers.json')
    .then(response => response.json())
    .then(data => {
        
        data.locations.forEach(location => {
        const el = document.createElement('div');
        el.className = 'marker-tourist'; 
        new mapboxgl.Marker(el)
            .setLngLat(location.coordinates.reverse())
            .addTo(map)
            .getElement().addEventListener('click', () => {
                showRouteToMarker(location.coordinates);
                map.flyTo({
                    center: location.coordinates,
                    zoom: 15,
                    bearing: 0,
                    pitch: 60,
                    speed: 0.5,
                    curve: 1,
                    essential: true
                });
                onMarkerClick(
                    location.name,
                    location.image,  // Hotel image
                    location.description  // Hotel description
                );
            });
        });
    });

    // Marcadores para los hoteles
    fetch('/json/hotels-centers.json')
    .then(response => response.json())
    .then(data => {
        
        data.locations.forEach(location => {
        const el = document.createElement('div');
        el.className = 'marker-hotel'; 
        new mapboxgl.Marker(el)
            .setLngLat(location.coordinates.reverse())
            .addTo(map)
            .getElement().addEventListener('click', () => {
                showRouteToMarker(location.coordinates);
                map.flyTo({
                    center: location.coordinates,
                    zoom: 15,
                    bearing: 0,
                    pitch: 60,
                    speed: 0.5,
                    curve: 1,
                    essential: true
                });
                onMarkerClick(
                    location.name,
                    location.image,  // Hotel image
                    location.description  // Hotel description
                );
            });
        });
    });
});

// Panel de informacion
function updatePanel(title, imgUrl, description) {
    panelTitle.innerText = title;
    panelImg.src = imgUrl;
    panelDescription.innerText = description;
}

function showPanel() {
    if (!slidePanel.classList.contains('open')) {
        slidePanel.classList.add('open');
    }
}

function hidePanel() {
    if (slidePanel.classList.contains('open')) {
        slidePanel.classList.remove('open');
    }
}

function onMarkerClick(title, imgUrl, description) {
    updatePanel(title, imgUrl, description);
    showPanel();
}

closePanelBtn.addEventListener('click', () => {
    hidePanel();
});

// Posicion del usuario
function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve([position.coords.longitude, position.coords.latitude]);
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            reject(new Error("Geolocation is not supported by this browser."));
        }
    });
}

// Direcciones
map.addControl(new NavigationControl());

// Add Directions Control
const directions = new MapboxDirections({
    accessToken: mapboxgl.accessToken,
    unit: 'metric'
});
map.addControl(directions, 'top-left');

async function showRouteToMarker(markerLngLat) {
    try {
        const userLocation = await getUserLocation();
        directions.setOrigin(userLocation);
        directions.setDestination(markerLngLat);
    } catch (error) {
        console.error("Error getting user location:", error);
    }
}