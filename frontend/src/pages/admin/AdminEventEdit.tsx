import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem 1rem',
  border: '1px solid #ddd',
  borderRadius: '6px',
  fontSize: '0.95rem',
  fontFamily: 'var(--font-sans)',
  background: '#fff',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 600,
  color: '#555',
  marginBottom: '0.4rem',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '1.5rem',
};

export default function AdminEventEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    starts_at: '',
    ends_at: '',
    cover_image: '',
    external_url: '',
    is_featured: false,
  });

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/events/${id}`).then(res => {
        const d = res.data;
        setFormData({
          title: d.title ?? '',
          description: d.description ?? '',
          location: d.location ?? '',
          starts_at: d.starts_at ? d.starts_at.slice(0, 16) : '',
          ends_at: d.ends_at ? d.ends_at.slice(0, 16) : '',
          cover_image: d.cover_image ?? '',
          external_url: d.external_url ?? '',
          is_featured: d.is_featured ?? false,
        });
      }).catch(() => {
        alert('Evento não encontrado.');
        navigate('/admin/events');
      });
    }
  }, [id, isNew, navigate]);

  const set = (field: string, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
      };
      if (isNew) {
        await api.post('/admin/events', payload);
      } else {
        await api.put(`/admin/events/${id}`, payload);
      }
      navigate('/admin/events');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao salvar evento.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este evento permanentemente?')) return;
    try {
      await api.delete(`/admin/events/${id}`);
      navigate('/admin/events');
    } catch {
      alert('Erro ao excluir.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1B1B1B', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        {isNew ? 'Novo Evento' : 'Editar Evento'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Informações principais */}
        <div style={{ background: '#fff', border: '1px solid #e1ded8', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)' }}>Informações do Evento</h2>

          <div>
            <label style={labelStyle}>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Nome do evento"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Descrição</label>
            <textarea
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Detalhes sobre o evento..."
              rows={5}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={labelStyle}>Local / Endereço</label>
            <input
              type="text"
              value={formData.location}
              onChange={e => set('location', e.target.value)}
              placeholder="Ex: Galeria Sesc Paulista, São Paulo - SP"
              style={inputStyle}
            />
          </div>

          <div style={row}>
            <div>
              <label style={labelStyle}>Data de Início *</label>
              <input
                type="datetime-local"
                value={formData.starts_at}
                onChange={e => set('starts_at', e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Data de Término</label>
              <input
                type="datetime-local"
                value={formData.ends_at}
                onChange={e => set('ends_at', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Mídia e links */}
        <div style={{ background: '#fff', border: '1px solid #e1ded8', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)' }}>Mídia & Opções</h2>

          <div>
            <label style={labelStyle}>Imagem de Capa (URL)</label>
            <input
              type="url"
              value={formData.cover_image}
              onChange={e => set('cover_image', e.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
            {formData.cover_image && (
              <img
                src={formData.cover_image}
                alt="preview"
                style={{ marginTop: '0.75rem', width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #eee' }}
              />
            )}
          </div>

          <div>
            <label style={labelStyle}>Link Externo (Ingresso / Info)</label>
            <input
              type="url"
              value={formData.external_url}
              onChange={e => set('external_url', e.target.value)}
              placeholder="https://sympla.com.br/..."
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="is_featured"
              checked={formData.is_featured}
              onChange={e => set('is_featured', e.target.checked)}
              className="admin-checkbox"
            />
            <label htmlFor="is_featured" style={{ fontSize: '0.95rem', color: '#333', cursor: 'pointer' }}>
              Evento em destaque (aparece em posição privilegiada)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '2rem' }}>
          {!isNew ? (
            <button
              type="button"
              onClick={handleDelete}
              style={{ padding: '0.8rem 1.5rem', background: '#fff', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
            >
              Excluir Evento
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/events')}
              style={{ padding: '0.8rem 1.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.8rem 2.5rem', background: 'var(--secondary)', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
            >
              {loading ? 'Salvando...' : isNew ? 'Criar Evento' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
