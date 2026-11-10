"use client";

import dynamic from "next/dynamic";

const MapApp = dynamic(() => import("@/components/map/MapApp"), {
  ssr: false,
  loading: () => (
    <div className="boot-screen" role="status">
      Загрузка карты Калининграда…
    </div>
  ),
});

export function MapLoader() {
  return <MapApp />;
}
