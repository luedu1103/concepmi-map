import { Map, NavigationControl, MapboxDirections} from 'mapbox-gl/dist/mapbox-gl.js';
import mapboxgl from 'mapbox-gl';

const API_KEY = import.meta.env.VITE_API_KEY;
// Todo lo que necesita el slide panel
const slidePanel = document.getElementById('slide-panel');

const panelTitle = document.getElementById('panel-title');
const panelImg = document.getElementById('panel-img');
const panelRating = document.getElementById('panel-rating');
const panelLocation = document.getElementById('panel-location');

const closePanelBtn = document.getElementById('close-panel');

let hotelVisible = false;
let touristVisible = false;
let restaurantVisible = false;

let hotelMarkerList = [];
let touristMarkerList = [];
let restaurantMarkerList = [];

document.getElementById('restaurants-button').addEventListener('click', () => {
  if (restaurantVisible == false){
    restaurantVisible = true;
    getRestaurants();
    console.log('visible'); 
  } else {
    restaurantMarkerList.forEach(marker => marker.remove());
    restaurantMarkerList = [];
    restaurantVisible = false;
    console.log('not visible');
  }
});

document.getElementById('hotels-button').addEventListener('click', () => {
  if (hotelVisible == false){
    hotelVisible = true;
    getHotels();
  } else {
    hotelMarkerList.forEach(marker => marker.remove());
    hotelMarkerList = [];
    hotelVisible = false;
  }
});

document.getElementById('tourist-attractions-button').addEventListener('click', () => {
  if (touristVisible == false){
    touristVisible = true;
    getTouristCenters();
  } else {
    touristMarkerList.forEach(marker => marker.remove());
    touristMarkerList = [];
    touristVisible = false;
  }
});

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
});

// Panel de informacion
// function updatePanel(title, imgUrl) {
//     panelTitle.innerText = title;
//     panelImg.src = imgUrl;
// }

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

// Funcion del marcador
function onMarkerClick(imgUrl, name, rating, location, numero, email, prices, services, photos, coordinates) {
     // Actualizar la información en el panel
     panelTitle.innerText = name;
     panelImg.src = imgUrl;
     panelRating.innerText = '★'.repeat(rating) + ` ${rating}`; // Ejemplo de calificación en estrellas
     panelLocation.innerText = location;
     document.getElementById('panel-contact-number').querySelector('span').innerText = ` ${numero}`;
     document.getElementById('panel-contact-email').querySelector('span').innerText = ` ${email}`;

     const pricesList = document.getElementById('panel-prices').querySelector('ul');
     pricesList.innerHTML = '';
     prices.forEach(price => {
          const li = document.createElement('li');
          li.textContent = price;
          pricesList.appendChild(li);
     });
 
     // Agregar servicios al panel
     const servicesList = document.getElementById('panel-services').querySelector('ul');
     servicesList.innerHTML = ''; // Limpiar los servicios previos
     services.forEach(service => {
         const li = document.createElement('li');
         li.textContent = service;
         servicesList.appendChild(li);
     });
 
     // Actualizar las fotos
     document.getElementById('photo1').src = photos[0];
     document.getElementById('photo2').src = photos[1];
     document.getElementById('photo3').src = photos[2];
     document.getElementById('photo4').src = photos[3];
 
     // Mostrar el panel
     showPanel();
 
     // Asignar el evento al botón de direcciones
     const directionsButton = document.getElementById('directions-button');
     directionsButton.onclick = () => getRoute(coordinates);
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
    } catch (error) {
      console.error(error);
    }
  }

// Funciones para mostrar los marcadores
function getHotels() {
  // Marcadores para los hoteles
  fetch('/json/hotels-centers.json')
  .then(response => response.json())
  .then(data => {
      
      data.locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'marker-hotel'; 
      let hotelMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

          hotelMarkerList.push(hotelMarker);
          hotelMarker.getElement().addEventListener('click', () => {
              flyingTo(location.coordinates);
              onMarkerClick(
                  location.image,
                  location.name,
                  location.rating,
                  location.ubicacion,
                  location.contacto.numero,
                  location.contacto.email,
                  location.precios,
                  location.servicios,
                  location.fotos,
                  location.coordinates
              );
          });
        });
  });
}

function getTouristCenters() {
  // Marcadores para los centros turísticos
  fetch('/json/tourist-centers.json')
  .then(response => response.json())
  .then(data => {
      
      data.locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'marker-tourist'; 
      let touristMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

          touristMarkerList.push(touristMarker);
          touristMarker.getElement().addEventListener('click', () => {
              getRoute(location.coordinates);
              flyingTo(location.coordinates);
              onMarkerClick(
                location.image,
                location.name,
                location.rating,
                location.ubicacion,
                location.contacto.numero,
                location.contacto.email,
                location.precios,
                location.servicios,
                location.fotos,
                location.coordinates
            );
          });
      });
  });
}

function getRestaurants() {
  // Marcadores para los restaurantes
  fetch('/json/restaurant-centers.json')
  .then(response => response.json())
  .then(data => {
      
      data.locations.forEach(location => {
      const el = document.createElement('div');
      el.className = 'marker-restaurant'; 
      let restaurantMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

          restaurantMarkerList.push(restaurantMarker);
          restaurantMarker.getElement().addEventListener('click', () => {
              getRoute(location.coordinates);
              flyingTo(location.coordinates);
              onMarkerClick(
                location.image,
                location.name,
                location.rating,
                location.ubicacion,
                location.contacto.numero,
                location.contacto.email,
                location.precios,
                location.servicios,
                location.fotos,
                location.coordinates
            );
          });
      });
  });
}

function flyingTo(coordinates) {
  map.flyTo({
    center: coordinates,
    zoom: 18,
    bearing: 0,
    pitch: 60,
    speed: 0.5,
    curve: 1,
    essential: true
});
}