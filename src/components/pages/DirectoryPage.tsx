import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { MapPin, Search, Store, Coffee, Star, ChevronRight, Leaf, Navigation } from "lucide-react";

// ── Leaflet dynamic import + CSS injection ──
// We inject Leaflet's CSS once via a <link> tag and load the library dynamically
// to avoid SSR/bundler issues.

const LOCATIONS = [
  { id: 1, type: 'cooperative' as const, name: 'Agrinova Green Coop', distance: '1.2 km', rating: 4.8, tags: ['Organic', 'Wholesale'], color: 'bg-emerald-500', desc: 'Certified organic cooperative providing fresh spinach, beet leaves, and fennel fronds.', lat: 33.9716, lng: -6.8498 },
  { id: 2, type: 'restaurant' as const, name: 'Le Marrakech Organic', distance: '3.4 km', rating: 4.9, tags: ['Fine Dining', 'Vegan'], color: 'bg-amber-500', desc: 'Award-winning restaurant featuring leaf-centric Moroccan cuisine.', lat: 31.6295, lng: -7.9811 },
  { id: 3, type: 'cooperative' as const, name: 'Atlas Harvest Leaf Co.', distance: '5.0 km', rating: 4.5, tags: ['Sustainable'], color: 'bg-teal-500', desc: 'Family-run harvest cooperative specializing in turnip greens and carrot tops.', lat: 34.0209, lng: -6.8417 },
  { id: 4, type: 'restaurant' as const, name: 'Oasis Roots Cafe', distance: '2.1 km', rating: 4.7, tags: ['Casual', 'Local'], color: 'bg-orange-500', desc: 'Cozy cafe serving smoothie bowls and salads with locally sourced greens.', lat: 33.5731, lng: -7.5898 },
  { id: 5, type: 'cooperative' as const, name: 'Souss Valley Greens', distance: '8.3 km', rating: 4.6, tags: ['Export Quality'], color: 'bg-green-600', desc: 'Large-scale cooperative exporting premium Moroccan herbs and edible leaves.', lat: 30.4278, lng: -9.5981 },
  { id: 6, type: 'restaurant' as const, name: 'Dar El Feuille', distance: '1.8 km', rating: 4.8, tags: ['Traditional'], color: 'bg-rose-500', desc: 'Traditional riad restaurant offering tagines and salads with heritage leaf varieties.', lat: 34.0331, lng: -5.0003 },
];

function LeafletMap({ locations, activeFilter }: { locations: typeof LOCATIONS; activeFilter: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Inject Leaflet CSS if not already present
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    // Dynamically import leaflet
    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;

      // Create map centered on Morocco
      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: true,
      }).setView([32.5, -6.5], 6);

      // Add zoom control to bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Fix the map size after render
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when locations or filter changes
  useEffect(() => {
    import('leaflet').then((L) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      // Clear old markers
      markersRef.current.forEach(m => map.removeLayer(m));
      markersRef.current = [];

      const filtered = locations.filter(loc =>
        activeFilter === 'all' || loc.type === activeFilter
      );

      filtered.forEach(loc => {
        const iconColor = loc.type === 'cooperative' ? '#10b981' : '#f59e0b';
        const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="${iconColor}"/><circle cx="16" cy="15" r="7" fill="white"/><text x="16" y="19" text-anchor="middle" font-size="12" fill="${iconColor}">${loc.type === 'cooperative' ? '🌿' : '☕'}</text></svg>`;
        const icon = L.divIcon({
          html: iconSvg,
          className: '',
          iconSize: [32, 40],
          iconAnchor: [16, 40],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: system-ui; min-width: 160px;">
              <strong style="font-size: 13px;">${loc.name}</strong><br/>
              <span style="font-size: 11px; color: #666;">${loc.type === 'cooperative' ? 'Cooperative' : 'Restaurant'} · ⭐ ${loc.rating}</span><br/>
              <span style="font-size: 11px; color: #888;">${loc.desc.slice(0, 80)}…</span>
            </div>
          `);
        markersRef.current.push(marker);
      });

      // Fit bounds if there are markers
      if (filtered.length > 0) {
        const bounds = L.latLngBounds(filtered.map(l => [l.lat, l.lng] as [number, number]));
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      }
    });
  }, [locations, activeFilter]);

  return <div ref={mapRef} className="w-full h-full" />;
}

export default function DirectoryPage() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'cooperative' | 'restaurant'>('all');
  const [search, setSearch] = useState('');

  const filtered = LOCATIONS.filter(loc =>
    (activeFilter === 'all' || loc.type === activeFilter) &&
    loc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pt-16 min-h-screen">
      {/* Header */}
      <div className="px-4 md:px-8 pt-6 pb-4 max-w-6xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Local Directory</h1>
        <p className="text-sm text-muted-foreground mb-5">Discover cooperatives and restaurants across Morocco</p>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name..."
              className="w-full bg-background border border-border rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
            />
          </div>
          <div className="flex gap-1.5 bg-muted/50 p-1 rounded-xl border border-border">
            {(['all', 'cooperative', 'restaurant'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all",
                  activeFilter === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f === 'all' ? 'All' : f === 'cooperative' ? 'Cooperatives' : 'Restaurants'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pb-8 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Real OpenStreetMap */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="sticky top-20 rounded-2xl border border-border overflow-hidden h-[350px] lg:h-[calc(100vh-160px)] shadow-sm">
              <LeafletMap locations={LOCATIONS} activeFilter={activeFilter} />
            </div>
          </div>

          {/* Cards List */}
          <div className="lg:col-span-3 order-1 lg:order-2 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </p>

            {filtered.map(loc => (
              <div
                key={loc.id}
                className="group bg-background border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary/20 transition-all cursor-pointer flex gap-4 items-start"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm", loc.color)}>
                  {loc.type === 'cooperative' ? <Store className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{loc.name}</h3>
                    <div className="flex items-center gap-0.5 bg-muted px-1.5 py-0.5 rounded text-xs font-semibold shrink-0">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {loc.rating}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{loc.desc}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {loc.tags.map(tag => (
                        <span key={tag} className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-md">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {loc.distance}
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-3" />
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No locations match your search</p>
                <button onClick={() => { setSearch(''); setActiveFilter('all'); }} className="text-sm text-primary mt-2 hover:underline">Reset filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
