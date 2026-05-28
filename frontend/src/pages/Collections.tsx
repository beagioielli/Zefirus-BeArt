import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Collections() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    api.get('/collections').then(res => setCollections(res.data)).catch(() => {});
  }, []);

  return (
    <div className="container" style={{ padding: '6rem 0' }}>
      <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '4rem', letterSpacing: '2px', textTransform: 'uppercase' }}>Coleções</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '3rem' }}>
        {collections.length > 0 ? collections.map(col => (
          <motion.div whileHover={{ y: -5 }} key={col.id} className="glass" style={{ padding: '3rem', borderRadius: '8px', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '1rem', fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>{col.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{col.description ? col.description.substring(0, 100) + '...' : ''}</p>
            <Link to={`/collections/${col.slug}`} className="btn-primary" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Ver Coleção</Link>
          </motion.div>
        )) : <p style={{ textAlign: 'center', gridColumn: '1/-1', color: 'var(--text-muted)' }}>Nenhuma coleção lançada no momento.</p>}
      </div>
    </div>
  );
}
