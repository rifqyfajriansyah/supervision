import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';
import type { Project } from '../services/api';

interface Props {
  projects: Project[];
  selectedId: string;
}

const MapComponent = ({ projects, selectedId }: Props) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<Map | null>(null);
  const vectorSource = useRef(new VectorSource());

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = new Map({
        target: mapRef.current,
        layers: [
          new TileLayer({
            source: new OSM({
               url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            }),
          }),
          new VectorLayer({
            source: vectorSource.current,
          }),
        ],
        view: new View({
          center: fromLonLat([118.0, -2.5]), // Center of Indonesia
          zoom: 4,
        }),
      });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.setTarget(undefined);
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    vectorSource.current.clear();
    
    projects.forEach(p => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([p.lng, p.lat])),
      });

      const isSelected = p.id === selectedId;
      const color = p.status === 'Perform' ? '#10B981' : p.status === 'Delayed' || p.status === 'Underperform' ? '#EAB308' : '#EF4444';

      feature.setStyle(
        new Style({
          image: new Circle({
            radius: isSelected ? 8 : 5,
            fill: new Fill({ color }),
            stroke: new Stroke({ color: '#fff', width: isSelected ? 2 : 1 }),
          }),
        })
      );

      vectorSource.current.addFeature(feature);
    });

    const selectedProject = projects.find(p => p.id === selectedId);
    if (selectedProject && mapInstance.current) {
      mapInstance.current.getView().animate({
        center: fromLonLat([selectedProject.lng, selectedProject.lat]),
        zoom: 8,
        duration: 1000
      });
    }

  }, [projects, selectedId]);

  return <div ref={mapRef} className="w-full h-full bg-gray-900" />;
};

export default MapComponent;
