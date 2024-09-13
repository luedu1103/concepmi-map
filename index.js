import { Map, NavigationControl } from 'mapbox-gl/dist/mapbox-gl.js';
import mapboxgl from 'mapbox-gl';

const API_KEY = import.meta.env.VITE_API_KEY;

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

    // Marcador para la universidad
    const el = document.createElement('div');
    el.className = 'marker';    
    
    new mapboxgl.Marker(el)
    .setLngLat([-79.039117, -8.114850])
    .setPopup(
        new mapboxgl.Popup({ offset: 25 })
        .setHTML(
            '<h3>Universidad Nacional de Trujillo</h3><img src="../UNT.jpg" alt="Imagen de la Universidad Nacional de Trujillo">'
        )
    )
    .addTo(map);

    // Marcadores para los centros turísticos

    fetch('/geojson/tourist-centers.json')
    .then(response => response.json())
    .then(data => {
        
        data.locations.forEach(location => {
        const el = document.createElement('div');
        el.className = 'marker-tourist'; 
        new mapboxgl.Marker(el)
            .setLngLat(location.coordinates.reverse())
            .setPopup(new mapboxgl.Popup().setText(location.name))
            .addTo(map);
        });
    });
});