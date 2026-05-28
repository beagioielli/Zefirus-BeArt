import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';

export default function Blog() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    api.get('/posts').then(res => setPosts(res.data.data || [])).catch(() => {});
  }, []);

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '4rem', letterSpacing: '2px' }}>JORNAL DO ATELIER</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '3rem' }}>
        {posts.length > 0 ? posts.map(post => (
          <div key={post.id} className="glass" style={{ padding: '2rem', borderRadius: '8px', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{post.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{post.excerpt}</p>
            <Link to={`/blog/${post.slug}`} style={{ fontWeight: 600, color: 'var(--secondary)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '1px' }}>Ler Mais &rarr;</Link>
          </div>
        )) : <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-muted)' }}>Nenhuma publicação no momento.</p>}
      </div>
    </div>
  );
}
