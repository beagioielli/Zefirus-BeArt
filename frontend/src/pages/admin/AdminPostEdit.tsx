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

export default function AdminPostEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    cover_image: '',
    published_at: '',
    is_published: false,
  });

  useEffect(() => {
    if (!isNew) {
      api.get(`/admin/posts/${id}`).then(res => {
        const d = res.data;
        setFormData({
          title: d.title ?? '',
          excerpt: d.excerpt ?? '',
          content: d.content ?? '',
          cover_image: d.cover_image ?? '',
          published_at: d.published_at ? d.published_at.slice(0, 16) : '',
          is_published: d.is_published ?? false,
        });
      }).catch(() => {
        alert('Post não encontrado.');
        navigate('/admin/posts');
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
        published_at: formData.published_at || null,
      };
      if (isNew) {
        await api.post('/admin/posts', payload);
      } else {
        await api.put(`/admin/posts/${id}`, payload);
      }
      navigate('/admin/posts');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Erro ao salvar post.';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Excluir este post permanentemente?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      navigate('/admin/posts');
    } catch {
      alert('Erro ao excluir.');
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1B1B1B', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
        {isNew ? 'Novo Post' : 'Editar Post'}
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Titulo */}
        <div style={{ background: '#fff', border: '1px solid #e1ded8', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)' }}>Conteúdo</h2>

          <div>
            <label style={labelStyle}>Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => set('title', e.target.value)}
              placeholder="Título do post"
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Resumo / Excerpt</label>
            <input
              type="text"
              value={formData.excerpt}
              onChange={e => set('excerpt', e.target.value)}
              placeholder="Breve descrição que aparece na listagem"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Conteúdo *</label>
            <textarea
              value={formData.content}
              onChange={e => set('content', e.target.value)}
              placeholder="Escreva o conteúdo completo aqui (suporta HTML)"
              rows={14}
              required
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>
        </div>

        {/* Publicação */}
        <div style={{ background: '#fff', border: '1px solid #e1ded8', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: '#333', fontFamily: 'var(--font-sans)' }}>Publicação</h2>

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
            <label style={labelStyle}>Data de Publicação</label>
            <input
              type="datetime-local"
              value={formData.published_at}
              onChange={e => set('published_at', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="checkbox"
              id="is_published"
              checked={formData.is_published}
              onChange={e => set('is_published', e.target.checked)}
              className="admin-checkbox"
            />
            <label htmlFor="is_published" style={{ fontSize: '0.95rem', color: '#333', cursor: 'pointer' }}>
              Publicar agora (visível no site)
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
              Excluir Post
            </button>
          ) : <div />}

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/admin/posts')}
              style={{ padding: '0.8rem 1.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.8rem 2.5rem', background: 'var(--secondary)', color: '#111', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 700 }}
            >
              {loading ? 'Salvando...' : isNew ? 'Criar Post' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
