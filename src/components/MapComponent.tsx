
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Paciente } from '../data/mockData';

// Coordenadas aproximadas de principales ciudades y capitales departamentales de Colombia
const COORDS: Record<string, [number, number]> = {
    // Bolívar - Norte y Centro
    'CARTAGENA': [10.3910, -75.4794],
    'TURBACO': [10.3333, -75.4167],
    'ARJONA': [10.2769, -75.3524],
    'TURBANA': [10.2709, -75.4439],
    'SANTA ROSA': [10.4417, -75.3611], // Santa Rosa de Lima
    'SANTA ROSA DE LIMA': [10.4417, -75.3611],
    'VILLANUEVA': [10.4447, -75.2789],
    'SAN ESTANISLAO': [10.4000, -75.1667],
    'CLEMENCIA': [10.5667, -75.3250],
    'SANTA CATALINA': [10.6078, -75.2917],
    'MAHATES': [10.2333, -75.1833],
    'MARIA LA BAJA': [9.9814, -75.3028],
    'SOPLAVIENTO': [10.2972, -75.0806],
    'SAN CRISTOBAL': [10.3667, -75.0833],
    'CALAMAR': [10.2528, -74.9144],
    'ARROYO HONDO': [10.2167, -75.0167],
    'EL CARMEN DE BOLIVAR': [9.7167, -75.1167],
    'EL CARMEN': [9.7167, -75.1167],
    'SAN JACINTO': [9.8333, -75.1167],
    'SAN JUAN NEPOMUCENO': [9.9500, -75.0833],
    'EL GUAMO': [10.0333, -74.9833],
    'ZAMBRANO': [9.7500, -74.8333],
    'CORDOBA': [9.5889, -74.8278],
    'TETON': [9.5889, -74.8278], // Córdoba

    // Bolívar - Sur y Río
    'MAGANGUE': [9.2429, -74.7554],
    'MOMPOX': [9.2417, -74.4250],
    'SANTA CRUZ DE MOMPOX': [9.2417, -74.4250],
    'CICUCO': [9.2667, -74.6667],
    'TALAIGUA NUEVO': [9.2667, -74.5667],
    'SAN FERNANDO': [9.1667, -74.3333],
    'MARGARITA': [9.1833, -74.3000],
    'HATILLO DE LOBA': [9.0667, -74.1333],
    'BARRANCO DE LOBA': [8.9500, -74.1167],
    'SAN MARTIN DE LOBA': [8.9667, -74.0500],
    'ALTOS DEL ROSARIO': [8.7833, -74.1667],
    'EL PENON': [8.9833, -73.9833],
    'REGIDOR': [8.6667, -73.8333],
    'RIO VIEJO': [8.5833, -73.8333],
    'ARENAL': [8.4500, -73.9500],
    'MORALES': [8.2750, -73.8750],
    'SANTA ROSA DEL SUR': [7.9667, -74.0500],
    'SIMITI': [7.9667, -73.9500],
    'SAN PABLO': [7.4778, -73.9333],
    'CANTAGALLO': [7.3833, -73.9167],
    'MONTECRISTO': [8.3000, -74.4667],
    'TIQUISIO': [8.5500, -74.3333],
    'PUERTO RICO': [8.5500, -74.3333], // Cabecera de Tiquisio
    'ACHI': [8.5667, -74.5500],
    'PINILLOS': [8.9000, -74.4500],

    // Principales Caribe (Contexto)
    'BARRANQUILLA': [10.9685, -74.7813],
    'SOLEDAD': [10.9184, -74.7646],
    'SANTA MARTA': [11.2408, -74.1990],
    'SINCELEJO': [9.3047, -75.3978],
    'MONTERIA': [8.7479, -75.8814],
    'VALLEDUPAR': [10.4631, -73.2532],
    'RIOHACHA': [11.5444, -72.9072],
    'SAN ANDRES': [12.5847, -81.7006]
};

const normalize = (s: string) => s.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

interface MapComponentProps {
    pacientes: Paciente[];
}

export default function MapComponent({ pacientes }: MapComponentProps) {
    const mapContainer = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markersLayer = useRef<L.LayerGroup | null>(null);

    // Initialize Map centered on Bolivar/Caribbean
    useEffect(() => {
        if (!mapContainer.current) return;
        if (mapInstance.current) return; // Prevent double init

        const map = L.map(mapContainer.current, {
            center: [9.5, -75.0], // Centro aproximado de Bolívar
            zoom: 8, // Zoom para ver el departamento completo
            scrollWheelZoom: true
        });

        // Use standard OSM or CartoDB
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap &copy; CARTO'
        }).addTo(map);

        markersLayer.current = L.layerGroup().addTo(map);
        mapInstance.current = map;

        return () => {
            map.remove();
            mapInstance.current = null;
        };
    }, []);

    // ... (rest same logic)
    useEffect(() => {
        if (!mapInstance.current || !markersLayer.current) return;

        const layer = markersLayer.current;
        layer.clearLayers();

        const grouped = pacientes.reduce((acc, p) => {
            if (!p.municipio) return acc;
            const mun = normalize(p.municipio);
            acc[mun] = (acc[mun] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(grouped).forEach(([mun, count]) => {
            let coords = COORDS[mun];

            // Búsqueda inteligente
            if (!coords) {
                // 1. Buscar si la key contiene el municipio (ej "SANTA ROSA DE LIMA" contiene "SANTA ROSA")
                const exactKey = Object.keys(COORDS).find(k => k === mun);
                if (exactKey) {
                    coords = COORDS[exactKey];
                } else {
                    // 2. Buscar parciales
                    const partialKey = Object.keys(COORDS).find(k => k.includes(mun) || mun.includes(k));
                    if (partialKey) coords = COORDS[partialKey];
                }
            }

            if (coords) {
                const radius = Math.min(30, Math.max(5, Math.sqrt(count) * 2));

                L.circleMarker(coords, {
                    radius: radius,
                    fillColor: '#3B82F6',
                    color: '#2563EB',
                    weight: 1,
                    fillOpacity: 0.6
                })
                    .bindTooltip(`
                    <div style="font-family: system-ui; text-align: center;">
                        <div style="font-weight: bold; font-size: 13px;">${mun}</div>
                        <div style="font-size: 12px;">${count} pacientes</div>
                    </div>
                `, {
                        direction: 'top',
                        offset: [0, -5],
                        opacity: 1,
                        className: 'custom-tooltip'
                    })
                    .addTo(layer);
            }
        });

    }, [pacientes]);

    return (
        <div className="card fade-in-delay-3" style={{ height: '100%', minHeight: '400px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">Distribución Geográfica</div>
                    <div className="card-subtitle">Pacientes por municipio</div>
                </div>
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
                <div ref={mapContainer} style={{ width: '100%', height: '100%', minHeight: '300px' }} />
            </div>
        </div>
    );
}
