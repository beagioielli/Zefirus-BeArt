import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Event {
  id: number;
  title: string;
  slug: string;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  is_featured: boolean;
  cover_image: string | null;
  external_url: string | null;
}

export default function AdminEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/events').then(res => {
      setEvents(res.data.data ?? res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este evento permanentemente?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch {
      alert('Erro ao excluir evento.');
    }
  };

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.location ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const isUpcoming = (dateStr: string) => new Date(dateStr) >= new Date();

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">Agenda — Eventos</h1>
          <div className="admin-toolbar">
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '12px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Buscar evento..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <Link
              to="/admin/events/new"
              style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--secondary)', color: '#000', textDecoration: 'none', borderRadius: '8px', fontWeight: 500, fontSize: '0.9rem' }}
            >
              + Novo Evento
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Local</th>
                <th>Início</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(event => {
                const upcoming = isUpcoming(event.starts_at);
                return (
                  <tr key={event.id}>
                    <td>
                      <div className="entity-cell">
                        <div className="entity-avatar" style={{ borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                          {event.cover_image
                            ? <img src={event.cover_image} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🎨</div>
                          }
                        </div>
                        <div className="entity-info">
                          <p className="entity-name">{event.title}</p>
                          {event.is_featured && (
                            <span style={{ fontSize: '0.72rem', color: '#92400e', background: '#fef3c7', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 600 }}>
                              Destaque
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#555', fontSize: '0.9rem' }}>
                      {event.location ?? '—'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#555' }}>
                      {new Date(event.starts_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.65rem',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 500,
                        background: upcoming ? '#dbeafe' : '#f3f4f6',
                        color: upcoming ? '#1e40af' : '#6b7280',
                      }}>
                        {upcoming ? 'Próximo' : 'Encerrado'}
                      </span>
                    </td>
                    <td>
                      <div className="action-icons">
                        {event.external_url && (
                          <a href={event.external_url} target="_blank" rel="noreferrer" title="Link externo">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          </a>
                        )}
                        <button onClick={() => handleDelete(event.id)} title="Excluir">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                        <Link to={`/admin/events/${event.id}/edit`} title="Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Nenhum evento encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
