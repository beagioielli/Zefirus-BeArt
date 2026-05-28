import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav style={{ position: 'sticky', top: 0, zIndex: 50, padding: '1.5rem 0', backgroundColor: '#fff', borderBottom: '1px solid #eaeaea' }}>
      <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', paddingBottom: '1.5rem', borderBottom: '1px solid #f4f4f4', marginBottom: '1rem' }}>
            <div style={{ flex: 1 }}></div>
            <Link to="/" style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: '1.6rem', fontWeight: 600, color: 'var(--primary)', letterSpacing: '1px', textDecoration: 'none', whiteSpace: 'nowrap' }}>
               Zefirus Art por Beatriz Gioielli
            </Link>
            <div style={{ flex: 1 }}></div>
        </div>
        
        <div style={{ display: 'flex', gap: '3rem', fontSize: '0.85rem', fontWeight: 400, color: '#333', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>Início</Link>
          <Link to="/catalog" style={{ textDecoration: 'none', color: 'inherit' }}>Obras Catalogadas</Link>
          <Link to="/collections" style={{ textDecoration: 'none', color: 'inherit' }}>Coleções</Link>
          <Link to="/about" style={{ textDecoration: 'none', color: 'inherit' }}>A Artista</Link>
          <Link to="/contact" style={{ textDecoration: 'none', color: 'inherit' }}>Contato</Link>
        </div>
        
      </div>
    </nav>
  );
}
