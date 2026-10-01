import React from 'react';
import { MapPin, Filter, Search } from 'lucide-react';
import { useZones } from '../hooks/useZones';
import { useCampusStore } from '../store/useStore';
import ZoneCard from '../components/ZoneCard';

const ZONE_TYPES = ['ALL', 'ACADEMIC', 'LAB', 'HOSTEL', 'COMMON_AREA'];

export default function Zones() {
  const { data: zones, isLoading } = useZones();
  const { zoneFilter, setZoneFilter } = useCampusStore();
  const [search, setSearch] = React.useState('');

  const filtered = zones?.filter((z: any) => {
    const matchType = zoneFilter === 'ALL' || z.type === zoneFilter;
    const matchSearch = search === '' || z.name.toLowerCase().includes(search.toLowerCase()) || z.building.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  }) || [];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            <span style={{ color: 'var(--text-primary)' }}>Campus </span>
            <span className="glow-text-blue">Zones</span>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Interactive map of all monitored campus areas
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
          <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            placeholder="Search zones..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full" style={{ paddingLeft: 36 }}
          />
        </div>
        <div className="flex gap-2">
          {ZONE_TYPES.map(t => (
            <button
              key={t}
              className={"btn btn-sm " + (zoneFilter === t ? 'btn-primary' : 'btn-ghost')}
              onClick={() => setZoneFilter(t)}
            >
              {t === 'ALL' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Zone Grid */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading campus zones...</div>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map((zone: any) => (
            <ZoneCard key={zone.id} zone={zone} />
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <MapPin size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <div style={{ fontSize: 15, fontWeight: 500 }}>No zones match your filters</div>
        </div>
      )}
    </div>
  );
}
