import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function Events() {
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    api.get('/events').then(res => setEvents(res.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '4rem', letterSpacing: '2px' }}>AGENDA DE EVENTOS</h1>
      <div style={{ display: 'grid', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
        {events.length > 0 ? events.map(ev => (
          <div key={ev.id} className="glass" style={{ display: 'flex', gap: '2rem', padding: '2rem', borderRadius: '8px', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
             <div style={{ textAlign: 'center', minWidth: '120px', borderRight: '1px solid var(--border)', paddingRight: '2rem' }}>
                <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 600, color: 'var(--secondary)', lineHeight: 1 }}>
                    {new Date(ev.starts_at).getDate()}
                </span>
                <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    {new Date(ev.starts_at).toLocaleString('pt-BR', { month: 'short' })}
                </span>
             </div>
             <div>
                 <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>{ev.title}</h2>
                 <p style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 500 }}>📍 {ev.location}</p>
                 <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{ev.description}</p>
             </div>
          </div>
        )) : <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Nenhum evento futuro anunciado. Assine a newsletter para ser informado primeiro.</p>}
      </div>
    </div>
  );
}
