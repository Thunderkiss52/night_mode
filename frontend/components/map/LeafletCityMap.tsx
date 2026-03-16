'use client';

import { useEffect } from 'react';
import { latLngBounds } from 'leaflet';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { CityMapMarker } from '@/lib/types';

type Props = {
  markers: CityMapMarker[];
  selectedCityId?: string | null;
  onSelectCity?: (cityId: string) => void;
  onAddPoint?: (lat: number, lng: number) => void;
};

const defaultCenter: [number, number] = [35, 35];

function MapViewport({ markers, selectedCityId }: { markers: CityMapMarker[]; selectedCityId?: string | null }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) {
      map.setView(defaultCenter, 2);
      return;
    }

    const selectedMarker = selectedCityId ? markers.find((marker) => marker.id === selectedCityId) : null;
    if (selectedMarker) {
      map.flyTo([selectedMarker.lat, selectedMarker.lng], Math.max(map.getZoom(), 5), { duration: 0.6 });
      return;
    }

    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 5);
      return;
    }

    map.fitBounds(
      latLngBounds(markers.map((marker) => [marker.lat, marker.lng] as [number, number])),
      { padding: [36, 36] }
    );
  }, [map, markers, selectedCityId]);

  return null;
}

function MapClickHandler({ onAddPoint }: Pick<Props, 'onAddPoint'>) {
  useMapEvents({
    click(event) {
      onAddPoint?.(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
}

export default function LeafletCityMap({ markers, selectedCityId, onSelectCity, onAddPoint }: Props) {
  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
      <MapContainer center={defaultCenter} zoom={2} scrollWheelZoom className="h-[520px] w-full">
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapViewport markers={markers} selectedCityId={selectedCityId} />
        <MapClickHandler onAddPoint={onAddPoint} />

        {markers.map((marker) => {
          const isSelected = marker.id === selectedCityId;

          return (
            <CircleMarker
              key={marker.id}
              center={[marker.lat, marker.lng]}
              radius={isSelected ? 14 : 11}
              pathOptions={{
                color: isSelected ? '#f3d46f' : '#d4af37',
                fillColor: '#d4af37',
                fillOpacity: isSelected ? 0.85 : 0.72,
                weight: isSelected ? 3 : 2
              }}
              eventHandlers={{
                click: () => onSelectCity?.(marker.id)
              }}
            >
              <Popup>
                <div className="text-black">
                  <p className="font-semibold">
                    {marker.city}, {marker.country}
                  </p>
                  <p className="text-xs">{marker.members.length} профилей в городе</p>
                  <p className="mt-1 text-xs text-black/70">
                    {marker.members
                      .slice(0, 3)
                      .map((member) => member.name)
                      .join(', ')}
                    {marker.members.length > 3 ? '…' : ''}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
