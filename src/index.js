import { Map, NavigationControl } from "mapbox-gl/dist/mapbox-gl.js";
import mapboxgl from "mapbox-gl";

const API_KEY = import.meta.env.VITE_API_KEY;
// Todo lo que necesita el slide panel
const slidePanel = document.getElementById("slide-panel");

const panelTitle = document.getElementById("panel-title");
const panelImg = document.getElementById("panel-img");
const panelRating = document.getElementById("panel-rating");
const panelLocation = document.getElementById("panel-location");

const closePanelBtn = document.getElementById("close-panel");

let hotelVisible = false;
let touristVisible = false;
let restaurantVisible = false;

let hotelMarkerList = [];
let touristMarkerList = [];
let restaurantMarkerList = [];

function showAllMarkers(zoom) {
  map.flyTo({
    center: [-79.039117, -8.11485],
    zoom: zoom,
    bearing: 0,
    speed: 2,
    curve: 1,
    essential: true,
  });
}

document.getElementById("restaurants-button").addEventListener("click", () => {
  showAllMarkers(14);
  if (restaurantVisible == false) {
    restaurantVisible = true;
    getRestaurants();
  } else {
    showAllMarkers(16);
    restaurantMarkerList.forEach((marker) => marker.remove());
    restaurantMarkerList = [];
    restaurantVisible = false;
  }
});

document.getElementById("hotels-button").addEventListener("click", () => {
  showAllMarkers(12);
  if (hotelVisible == false) {
    hotelVisible = true;
    getHotels();
  } else {
    showAllMarkers(16);
    hotelMarkerList.forEach((marker) => marker.remove());
    hotelMarkerList = [];
    hotelVisible = false;
  }
});

document
  .getElementById("tourist-attractions-button")
  .addEventListener("click", () => {
    if (touristVisible == false) {
      showAllMarkers(10);
      touristVisible = true;
      getTouristCenters();
    } else {
      showAllMarkers(16);
      touristMarkerList.forEach((marker) => marker.remove());
      touristMarkerList = [];
      touristVisible = false;
    }
  });

mapboxgl.accessToken = API_KEY;
const map = new Map({
  container: "map",
  center: [-74.5, 40], // -8.114850, -79.039117
  zoom: 0,
  bearing: 0,
  pitch: 0,
});

// Zoom, direccion, etc
map.addControl(new NavigationControl());

map.on("load", async () => {
  let position = await getUserLocation();
  getRoute(position);
  map.addLayer({
    id: "point",
    type: "circle",
    source: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: {
              type: "Point",
              coordinates: position,
            },
          },
        ],
      },
    },
    paint: {
      "circle-radius": 10,
      "circle-color": "#ff610f",
    },
  });
});

map.on("load", () => {
  // Animación inicial
  map.flyTo({
    center: [-79.039117, -8.11485],
    zoom: 16,
    bearing: 0,
    speed: 2,
    curve: 1,
    essential: true,
  });

  // Universidad
  map.addSource("uni", {
    type: "geojson",
    data: "/geojson/map.geojson",
  });

  map.addLayer({
    id: "UNT",
    type: "fill",
    source: "uni",
    paint: {
      // '#1abfdf' // #4e17a8 #ff610f
      "fill-color": "#ff610f",
      "fill-opacity": 0.3,
    },
  });

  // Marcadores
  // Marcador para la universidad
  const el = document.createElement("div");
  el.className = "marker";

  new mapboxgl.Marker(el)
    .setLngLat([-79.039117, -8.11485])
    .addTo(map)
    .getElement()
    .addEventListener("click", () => {
      flyingTo([-79.039117, -8.11485]);
    });
});

function showPanel() {
  if (!slidePanel.classList.contains("open")) {
    slidePanel.classList.add("open");
  }
}

function hidePanel() {
  if (slidePanel.classList.contains("open")) {
    slidePanel.classList.remove("open");
  }
}

// Funcion del marcador
function onMarkerClick(
  imgUrl,
  name,
  rating,
  location,
  numero,
  email,
  prices,
  services,
  photos,
  coordinates,
  type
) {
  // Actualizar la información en el panel
  panelTitle.innerText = name;
  panelImg.src = imgUrl;
  panelRating.innerText = "★".repeat(rating) + ` ${rating}`; // Ejemplo de calificación en estrellas
  panelLocation.innerText = location;
  if (numero != null) {
    const numeroElement = document.getElementById("panel-contact-number");
    numeroElement.querySelector("span").innerText = ` ${numero}`;
    numeroElement.style.display = "";
  } else {
    document.getElementById("panel-contact-number").style.display = "none";
  }
  if (email != null){
    const emailElement = document.getElementById("panel-contact-email");
    emailElement.querySelector("span").innerText = ` ${email}`;
    emailElement.style.display = "";
  } else {
    document.getElementById("panel-contact-email").style.display = "none";
  }

  if (type == "restaurant" || type == "tourist"){
    const pricesPanel = document.getElementById("panel-prices");
    prices.forEach((price) => {
      pricesPanel.innerText = price;
    });

    const servicesPanel = document.getElementById("panel-services");
    services.forEach((service) => {
      servicesPanel.innerText = service;
    });
  } else {
    const pricesList = document
      .getElementById("panel-prices")
      .querySelector("ul");
    pricesList.innerHTML = "";
    prices.forEach((price) => {
      const li = document.createElement("li");
      li.textContent = price;
      pricesList.appendChild(li);
    });

    // Agregar servicios al panel
    const servicesList = document
      .getElementById("panel-services")
      .querySelector("ul");
    servicesList.innerHTML = ""; // Limpiar los servicios previos
    services.forEach((service) => {
      const li = document.createElement("li");
      li.textContent = service;
      servicesList.appendChild(li);
    });
  }


  // Actualizar las fotos
  document.getElementById("photo1").src = photos[0];
  document.getElementById("photo2").src = photos[1];
  document.getElementById("photo3").src = photos[2];
  document.getElementById("photo4").src = photos[3];

  // Mostrar el panel
  showPanel();

  // Asignar el evento al botón de direcciones
  const directionsButton = document.getElementById("directions-button");
  directionsButton.onclick = () => {
    getRoute(coordinates);
    hidePanel();
  };
}

closePanelBtn.addEventListener("click", () => {
  hidePanel();
});

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
          enableHighAccuracy: true,
        }
      );
    } else {
      reject("Geolocation is not supported by this browser.");
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
      { method: "GET" }
    );
    const json = await query.json();
    const data = json.routes && json.routes[0];

    if (!data || !data.geometry || !data.geometry.coordinates.length) {
      console.error("No valid route found between the specified points");

      // Crear un popup de Mapbox
      const popup = new mapboxgl.Popup()
        .setLngLat(end)
        .setHTML("<h4>Ruta no disponible</h4><p>Estas muy lejos!</p>")
        .addTo(map);

      return;
    }

    // Check for minimal route distance
    if (data.distance < 1) {
      console.warn(
        "Start and end points are very close; minimal route detected."
      );
    }

    const route = data.geometry.coordinates;
    const geojson = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: route,
      },
    };

    // if the route already exists on the map, we'll reset it using setData
    if (map.getSource("route")) {
      map.getSource("route").setData(geojson);
    }
    // otherwise, we'll make a new request
    else {
      map.addLayer({
        id: "route",
        type: "line",
        source: {
          type: "geojson",
          data: geojson,
        },
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": "#ff610f",
          "line-width": 5,
          "line-opacity": 0.75,
        },
      });
    }
  } catch (error) {
    console.error(error);
  }
}

// Funciones para mostrar los marcadores
function getHotels() {
  // Marcadores para los hoteles
  fetch("/json/hotels-centers.json")
    .then((response) => response.json())
    .then((data) => {
      data.locations.forEach((location) => {
        const el = document.createElement("div");
        el.className = "marker-hotel";
        let hotelMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

        hotelMarkerList.push(hotelMarker);
        hotelMarker.getElement().addEventListener("click", () => {
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
            location.coordinates,
            null
          );
        });
      });
    });
}

function getTouristCenters() {
  // Marcadores para los centros turísticos
  fetch("/json/tourist-centers.json")
    .then((response) => response.json())
    .then((data) => {
      data.locations.forEach((location) => {
        const el = document.createElement("div");
        el.className = "marker-tourist";
        let touristMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

        touristMarkerList.push(touristMarker);
        touristMarker.getElement().addEventListener("click", () => {
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
            location.coordinates,
            "tourist"
          );
        });
      });
    });
}

function getRestaurants() {
  // Marcadores para los restaurantes
  fetch("/json/restaurant-centers.json")
    .then((response) => response.json())
    .then((data) => {
      data.locations.forEach((location) => {
        const el = document.createElement("div");
        el.className = "marker-restaurant";
        let restaurantMarker = new mapboxgl.Marker(el)
          .setLngLat(location.coordinates.reverse())
          .addTo(map);

        restaurantMarkerList.push(restaurantMarker);
        restaurantMarker.getElement().addEventListener("click", () => {
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
            location.coordinates,
            "restaurant"
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
    speed: 0.5,
    curve: 1,
    essential: true,
  });
}
