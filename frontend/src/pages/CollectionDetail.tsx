import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import ArtworkCard from '../components/ArtworkCard';

export default function CollectionDetail() {
  const { slug } = useParams();
  const [col, setCol] = useState<any>(null);

  useEffect(() => {
    api.get(`/collections/${slug}`).then(res => setCol(res.data)).catch(() => {});
  }, [slug]);

  if (!col) return <div style={{ textAlign: 'center', padding: '10rem 0' }}>Carregando coleção...</div>;

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '5rem', maxWidth: '800px', margin: '0 auto 5rem' }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '2rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)', letterSpacing: '1px' }}>{col.title}</h1>
          <p style={{ fontSize: '1.2rem', lineHeight: 1.8, color: 'var(--text-muted)' }}>{col.description}</p>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '3rem' }}>
          {col.artworks?.length > 0 ? col.artworks.map((art: any) => (
            <ArtworkCard key={art.id} artwork={art} />
          )) : (
            <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>Obras ainda não reveladas para esta coleção.</p>
          )}
      </div>
    </div>
  );
}
