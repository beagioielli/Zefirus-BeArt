import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ArtworkCard({ artwork }: { artwork: any }) {
  return (
    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={{ display: 'flex', flexDirection: 'column' }}>
      <Link to={`/catalog/${artwork.id}`} style={{ display: 'block', overflow: 'hidden', marginBottom: '1.5rem', position: 'relative' }}>
        {/* Pedrotti inspired Image height constraint */}
        <div style={{ height: '500px', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundImage: `url(${artwork.media?.[0]?.original_url || 'https://via.placeholder.com/400'})`, backgroundColor: 'transparent' }} />
        
        {/* Badges layered on image */}
        {artwork.is_awarded && (
           <div style={{ position: 'absolute', top: 15, right: 15, background: '#90885C', color: '#fff', fontSize: '0.7rem', textTransform: 'uppercase', padding: '6px 10px', letterSpacing: '1px' }}>
               Premiada
           </div>
        )}
      </Link>
      <div style={{ textAlign: 'center' }}>
        {/* Title */}
        <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem', fontWeight: 400, fontFamily: 'var(--font-serif)' }}>{artwork.title}</h3>
        
        {/* Year and Dimensions */}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem', fontStyle: 'italic', fontFamily: 'var(--font-serif)' }}>
            {artwork.year ? `${artwork.year} • ` : ''}{artwork.dimensions}
        </p>

        {/* Tags / Status */}
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: artwork.is_sold ? '#999' : '#111', fontWeight: 500 }}>
           {artwork.is_sold ? 'Acervo Particular' : 'Pronta Entrega'}
        </div>
      </div>
    </motion.div>
  );
}
