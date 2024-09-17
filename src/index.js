import { Map, NavigationControl, MapboxDirections} from 'mapbox-gl/dist/mapbox-gl.js';
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

// Zoom, direccion, etc
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
        getRoute([-79.039117, -8.114850]);
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
                getRoute(location.coordinates);
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
                getRoute(location.coordinates);
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

// Control para mostrar posicion del usuario
map.addControl(
    new mapboxgl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        // When active the map will receive updates to the device's location as it changes.
        trackUserLocation: true,
        // Draw an arrow next to the location dot to indicate which direction the device is heading.
        showUserHeading: true
    })
);

// Posicion del usuario
function getUserLocation() {
    return new Promise((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            resolve([longitude, latitude]);
          },
          (error) => {
            reject(`Error getting location: ${error.message}`);
          },
          {
            enableHighAccuracy: true
          }
        );
      } else {
        reject('Geolocation is not supported by this browser.');
      }
    });
  }

// Ruta
async function getRoute(end) {
    try {
      // Get user's current location
      const start = await getUserLocation();
      
      // make a directions request using cycling profile
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/cycling/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
        { method: 'GET' }
      );
      const json = await query.json();
      const data = json.routes[0];
      const route = data.geometry.coordinates;
      const geojson = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: route
        }
      };
  
      // if the route already exists on the map, we'll reset it using setData
      if (map.getSource('route')) {
        map.getSource('route').setData(geojson);
      }
      // otherwise, we'll make a new request
      else {
        map.addLayer({
          id: 'route',
          type: 'line',
          source: {
            type: 'geojson',
            data: geojson
          },
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
      // add turn instructions here at the end
    } catch (error) {
      console.error(error);
    }
  }