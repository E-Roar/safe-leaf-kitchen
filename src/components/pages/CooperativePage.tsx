import { useState, useEffect, useRef } from "react";
import { Store, MapPin, Phone, Mail, Award, Leaf, ChevronRight, Star, Coffee } from "lucide-react";
import { cn } from "@/lib/utils";

function MiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    import('leaflet').then((L) => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([lat, lng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      const icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#10b981"/><circle cx="14" cy="13" r="6" fill="white"/></svg>`,
        className: '', iconSize: [28, 36], iconAnchor: [14, 36],
      });
      L.marker([lat, lng], { icon }).addTo(map).bindPopup(label);
      mapInstanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    });

    return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
  }, [lat, lng, label]);

  return <div ref={mapRef} className="w-full h-full" />;
}

export default function CooperativePage() {
  const [activeTab, setActiveTab] = useState<'products' | 'partners'>('products');

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Profile Header */}
        <div className="bg-background border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
            <Store className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground">Agrinova Green Coop</h1>
              <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                <Award className="w-3 h-3" /> Certified Organic
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
              Community-driven agricultural cooperative specializing in sustainable harvesting of nutrient-dense botanical leaves. Empowering local farmers through modern traceability.
            </p>
            <div className="flex flex-wrap gap-2 text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg"><MapPin className="w-3 h-3 text-primary" /> Route d'Agadir, km 15</span>
              <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg"><Phone className="w-3 h-3 text-primary" /> +212 5XX XX XX XX</span>
              <span className="flex items-center gap-1.5 bg-muted px-3 py-1.5 rounded-lg"><Mail className="w-3 h-3 text-primary" /> contact@agrinova.ma</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-muted/50 p-1 rounded-xl border border-border w-fit">
              <button
                onClick={() => setActiveTab('products')}
                className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-all", activeTab === 'products' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Available Leaves
              </button>
              <button
                onClick={() => setActiveTab('partners')}
                className={cn("px-4 py-2 rounded-lg text-xs font-semibold transition-all", activeTab === 'partners' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
              >
                Partner Restaurants
              </button>
            </div>

            {/* Products Tab */}
            {activeTab === 'products' && (
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: 'Fresh Spinach', stock: '250 kg', price: '15 MAD/kg', desc: 'Rich in iron, perfectly crisp' },
                  { name: 'Organic Beet Leaves', stock: '80 kg', price: '12 MAD/kg', desc: 'Earthy, nutrient-dense greens' },
                  { name: 'Fennel Fronds', stock: '45 kg', price: '20 MAD/kg', desc: 'Aromatic and wild-harvested' },
                  { name: 'Turnip Greens', stock: '120 kg', price: '10 MAD/kg', desc: 'Bold traditional Moroccan staple' },
                ].map((item, i) => (
                  <div key={i} className="bg-background border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/20 transition-all cursor-pointer group">
                    <div className="flex items-start gap-3 mb-2">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                        <Leaf className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <span className="font-bold text-primary text-sm shrink-0">{item.price}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">In Stock: {item.stock}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Partners Tab */}
            {activeTab === 'partners' && (
              <div className="space-y-3">
                {[
                  { name: 'Le Marrakech Organic', type: 'Fine Dining', rating: 4.9 },
                  { name: 'Oasis Roots Cafe', type: 'Casual Vegan', rating: 4.7 },
                ].map((item, i) => (
                  <div key={i} className="bg-background border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-amber-500/20 transition-all group">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold group-hover:text-amber-600 transition-colors">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.type} · <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 inline mb-0.5" /> {item.rating}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar: Real Map */}
          <div className="space-y-4">
            <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" /> Farm Location
              </h3>
              <div className="w-full h-48 rounded-xl overflow-hidden border border-border">
                <MiniMap lat={30.4278} lng={-9.5981} label="Agrinova Green Coop" />
              </div>
              <button className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                Get Directions
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
