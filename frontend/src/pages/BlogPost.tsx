import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    api.get(`/posts/${slug}`).then(res => setPost(res.data)).catch(() => {});
  }, [slug]);

  if (!post) return <div style={{ padding: '6rem 0', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', color: 'var(--primary)', letterSpacing: '1px' }}>{post.title}</h1>
      <div style={{ padding: '2rem 0', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.8 }}>
        {post.content}
      </div>
    </div>
  );
}
