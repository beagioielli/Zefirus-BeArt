import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import ArtworkCard from '../components/ArtworkCard';

export default function Home() {
  const [featuredArtworks, setFeaturedArtworks] = useState<any[]>([]);

  useEffect(() => {
    api.get('/artworks').then(res => {
      if (res.data && res.data.data) {
          setFeaturedArtworks(res.data.data.slice(0, 3));
      }
    }).catch(console.error);
  }, []);

  return (
    <div>
      {/* Editorial Hero */}
      <section style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 2rem' }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.5, ease: "easeOut" }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '2rem', letterSpacing: '4px', textTransform: 'uppercase', fontWeight: 300 }}>
            Beatriz Gioielli
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: 1.8, fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
            Explorando os limites da percepção visual através de formas puras e contrastes sutis.
          </p>
          <Link to="/catalog" className="btn-primary">Explorar Acervo</Link>
        </motion.div>
      </section>

      {/* Minimalism Artworks Layout */}
      <section className="container" style={{ padding: '4rem 0 8rem 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '4rem 2rem' }}>
          {featuredArtworks.length > 0 ? featuredArtworks.map((art) => (
             <ArtworkCard key={art.id} artwork={art} />
          )) : <div style={{textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)'}}>Carregando obras em destaque...</div>}
        </div>
      </section>
    </div>
  );
}
