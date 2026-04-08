import { useState, useEffect, useRef } from "react";
import { Coffee, MapPin, Store, Calendar, Clock, Users, Star, ChefHat, CheckCircle2, Leaf } from "lucide-react";
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
      const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, dragging: false, scrollWheelZoom: false }).setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);
      const icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="#f59e0b"/><circle cx="14" cy="13" r="6" fill="white"/></svg>`,
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

const MENU = [
  { name: 'Zaalouk with Fresh Spinach', desc: 'Smoked eggplant blended with local spinach leaves, garlic, and cold-pressed olive oil.', price: '85 MAD', source: 'Agrinova Green Coop' },
  { name: 'Organic Beet Leaf Salad', desc: 'Blanched beet leaves, caramelized walnuts, and local goat cheese with citrus vinaigrette.', price: '75 MAD', source: 'Atlas Harvest' },
  { name: 'Turnip Green Tagine', desc: 'Slow-cooked lamb tagine enriched with robust turnip greens and preserved lemon.', price: '140 MAD', source: 'Agrinova Green Coop' },
];

export default function RestaurantPage() {
  const [bookingState, setBookingState] = useState<'idle' | 'booking' | 'confirmed'>('idle');
  const [time, setTime] = useState('19:00');
  const [guests, setGuests] = useState('2');

  return (
    <div className="pt-16 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 space-y-6">

        {/* Profile Header */}
        <div className="bg-background border border-border rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-start">
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md">
            <Coffee className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground mb-1">Le Marrakech Organic</h1>
            <div className="flex flex-wrap items-center gap-3 mb-3 text-sm">
              <span className="flex items-center gap-1 font-semibold"><Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> 4.9 <span className="text-muted-foreground font-normal">(128 reviews)</span></span>
              <span className="flex items-center gap-1 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /> Gueliz, Marrakech</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Elevating traditional Moroccan cuisine through sustainable sourcing. We partner with local cooperatives for vibrant, leaf-centric dishes that nourish body and community.
            </p>
          </div>
          <button
            onClick={() => setBookingState('booking')}
            className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm shrink-0 mt-2 sm:mt-0"
          >
            Book a Table
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Menu */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-500" /> Seasonal Menu
              </h3>
              <div className="divide-y divide-border">
                {MENU.map((item, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{item.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">{item.desc}</p>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                        <Leaf className="w-2.5 h-2.5" /> {item.source}
                      </span>
                    </div>
                    <span className="font-bold text-foreground text-sm shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Partner Cooperatives */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-500" /> Partner Cooperatives
              </h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: 'Agrinova Green Coop', type: 'Certified Organic', initials: 'AG' },
                  { name: 'Atlas Harvest', type: 'Sustainable Farming', initials: 'AH' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-emerald-500/30 hover:shadow-sm transition-all cursor-pointer group">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-center justify-center font-bold text-sm group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                      {item.initials}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm group-hover:text-emerald-600 transition-colors">{item.name}</h4>
                      <p className="text-[11px] text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Booking Widget */}
            <div className="bg-background border border-border rounded-2xl p-5">
              <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Reservations
              </h3>

              {bookingState === 'idle' && (
                <button onClick={() => setBookingState('booking')} className="w-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 font-semibold py-3 rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all text-sm">
                  Check Availability
                </button>
              )}

              {bookingState === 'booking' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</label>
                    <div className="flex items-center bg-muted border border-border rounded-xl px-3 py-2.5">
                      <Calendar className="w-4 h-4 text-muted-foreground mr-2" />
                      <input type="date" className="bg-transparent text-sm w-full outline-none" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Time</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['18:00', '19:00', '20:00', '21:00'].map(t => (
                        <button
                          key={t}
                          onClick={() => setTime(t)}
                          className={cn(
                            "py-2 rounded-lg border text-xs font-semibold transition-all",
                            time === t ? "bg-amber-500 border-amber-500 text-white" : "bg-background border-border hover:border-amber-300 text-foreground"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Guests</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {['2', '3', '4', '5+'].map(g => (
                        <button
                          key={g}
                          onClick={() => setGuests(g)}
                          className={cn(
                            "py-2 rounded-lg border text-xs font-semibold transition-all",
                            guests === g ? "bg-muted text-foreground border-primary/30" : "bg-background border-border text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setBookingState('confirmed')}
                    className="w-full bg-amber-500 text-white font-semibold py-3 rounded-xl hover:bg-amber-600 transition-colors text-sm"
                  >
                    Confirm Booking
                  </button>
                </div>
              )}

              {bookingState === 'confirmed' && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold mb-1">Table Confirmed!</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    {guests} guests · {time} · {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                  <button onClick={() => setBookingState('idle')} className="text-xs text-amber-500 font-semibold hover:underline">
                    Make another booking
                  </button>
                </div>
              )}
            </div>

            {/* Map */}
            <div className="bg-background border border-border rounded-2xl p-4">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" /> Location
              </h3>
              <div className="w-full h-44 rounded-xl overflow-hidden border border-border">
                <MiniMap lat={31.6295} lng={-7.9811} label="Le Marrakech Organic" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Avenue Mohammed V, Gueliz, Marrakech</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
