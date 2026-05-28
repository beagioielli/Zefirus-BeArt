import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ padding: '4rem 0', backgroundColor: '#1B1B1B', color: '#fff', textAlign: 'center', borderTop: 'none' }}>
      <div className="container">
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', color: '#fff', marginBottom: '1rem', letterSpacing: '1px' }}>
            Zefirus Art por Beatriz Gioielli
        </p>
        <p style={{ fontSize: '0.85rem', color: '#aaa' }}>
            &copy; {new Date().getFullYear()} Beatriz Gioielli. Todos os direitos reservados.
        </p>
        <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            <Link to="/admin" style={{ color: '#666', textDecoration: 'none', transition: 'color 0.2s' }}>
                Admin Login
            </Link>
        </div>
      </div>
    </footer>
  );
}
