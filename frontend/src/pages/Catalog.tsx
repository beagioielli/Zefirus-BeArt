import { useState, useEffect } from 'react';
import ArtworkCard from '../components/ArtworkCard';
import { api } from '../lib/api';

export default function Catalog() {
  const [filter, setFilter] = useState('all');
  const [artworks, setArtworks] = useState<any[]>([]);

  useEffect(() => {
    api.get('/artworks').then(res => setArtworks(res.data.data || [])).catch(() => {});
  }, []);

  const filtered = artworks.filter(art => {
    if (filter === 'all') return true;
    if (filter === 'available') return !art.is_sold;
    if (filter === 'sold') return art.is_sold;
    return true;
  });

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '2.5rem', letterSpacing: '3px', textTransform: 'uppercase', fontWeight: 300, marginBottom: '3rem' }}>Acervo</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {['all', 'available', 'sold'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? 'var(--primary)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--text-muted)',
                border: '1px solid',
                borderColor: filter === f ? 'var(--primary)' : 'var(--border)',
                padding: '0.6rem 1.8rem',
                borderRadius: '30px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {f === 'all' && 'Todos'}
              {f === 'available' && 'Disponíveis'}
              {f === 'sold' && 'Vendidas'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '5rem 3rem' }}>
        {filtered.map(art => (
          <ArtworkCard key={art.id} artwork={art} />
        ))}
        {filtered.length === 0 && <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>Nenhuma obra encontrada.</div>}
      </div>
    </div>
  );
}
