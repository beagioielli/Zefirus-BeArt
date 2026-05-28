import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  is_published: boolean;
  published_at: string | null;
  cover_image: string | null;
}

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/posts').then(res => {
      setPosts(res.data.data ?? res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm('Excluir este post permanentemente?')) return;
    try {
      await api.delete(`/admin/posts/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('Erro ao excluir post.');
    }
  };

  const filtered = posts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div>
      <div className="admin-card">
        <div className="admin-card-header">
          <h1 className="admin-card-title">Blog — Posts</h1>
          <div className="admin-toolbar">
            <div style={{ position: 'relative' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', left: '12px', top: '12px' }}>
                <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                placeholder="Buscar post..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <Link
              to="/admin/posts/new"
              style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--secondary)', color: '#000', textDecoration: 'none', borderRadius: '8px', fontWeight: 500, fontSize: '0.9rem' }}
            >
              + Novo Post
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Status</th>
                <th>Publicado em</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(post => (
                <tr key={post.id}>
                  <td>
                    <div className="entity-cell">
                      <div className="entity-avatar" style={{ borderRadius: '6px', overflow: 'hidden', flexShrink: 0 }}>
                        {post.cover_image
                          ? <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <div style={{ width: '100%', height: '100%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>📝</div>
                        }
                      </div>
                      <div className="entity-info">
                        <p className="entity-name">{post.title}</p>
                        <p className="entity-sub">{post.excerpt ? post.excerpt.slice(0, 60) + '...' : post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.2rem 0.65rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 500,
                      background: post.is_published ? '#d1fae5' : '#f3f4f6',
                      color: post.is_published ? '#065f46' : '#6b7280',
                    }}>
                      {post.is_published ? 'Publicado' : 'Rascunho'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('pt-BR')
                      : '—'}
                  </td>
                  <td>
                    <div className="action-icons">
                      {post.is_published && (
                        <a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" title="Ver no site">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                        </a>
                      )}
                      <button onClick={() => handleDelete(post.id)} title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                      <Link to={`/admin/posts/${post.id}/edit`} title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Nenhum post encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
