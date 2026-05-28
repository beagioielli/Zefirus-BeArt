import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="admin-area" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F4F2EE', color: '#1B1B1B' }}>
        <aside style={{ width: '250px', backgroundColor: '#e2dfd9', color: '#1B1B1B', padding: '2rem', display: 'flex', flexDirection: 'column', borderRight: '1px solid #d4d1cb' }}>
            <Link to="/" target="_blank" style={{ fontFamily: 'var(--font-serif)', color: 'var(--primary)', marginBottom: '3rem', fontSize: '1.5rem', textDecoration: 'none', fontWeight: 500, letterSpacing: '1px' }}>
                Zefirus Art ↗
            </Link>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
                <Link to="/admin" style={{ color: '#333', textDecoration: 'none', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: location.pathname === '/admin' ? 600 : 400 }}>Dashboard</Link>
                
                <div>
                    <div style={{ color: '#333', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: '1rem' }}>Acervo</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginLeft: '1rem' }}>
                        <Link to="/admin/artworks" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem', fontWeight: location.pathname.startsWith('/admin/artworks') ? 600 : 400 }}>- Obras</Link>
                        <Link to="/admin/collections" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem', fontWeight: location.pathname.startsWith('/admin/collections') ? 600 : 400 }}>- Coleções</Link>
                    </div>
                </div>

                <div>
                    <div style={{ color: '#333', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: 600, marginBottom: '1rem' }}>Conteúdo</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginLeft: '1rem' }}>
                        <Link to="/admin/posts" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem', fontWeight: location.pathname.startsWith('/admin/posts') ? 600 : 400 }}>- Blog</Link>
                        <Link to="/admin/events" style={{ color: '#555', textDecoration: 'none', fontSize: '0.95rem', fontWeight: location.pathname.startsWith('/admin/events') ? 600 : 400 }}>- Eventos</Link>
                    </div>
                </div>

                <Link to="/admin/orders" style={{ color: '#333', textDecoration: 'none', fontSize: '1.2rem', fontFamily: 'var(--font-sans)', fontWeight: location.pathname.startsWith('/admin/orders') ? 600 : 400 }}>Pedidos</Link>

                <Link to="/" style={{ color: 'var(--secondary)', textDecoration: 'none', fontSize: '1.1rem', marginTop: '1.5rem' }}>&larr; Voltar ao Site</Link>
            </nav>
            <button onClick={logout} style={{ marginTop: 'auto', background: 'none', border: 'none', color: '#b94a48', cursor: 'pointer', textAlign: 'left', padding: 0, fontSize: '1.1rem' }}>Sair da Conta</button>
        </aside>
        <main style={{ flex: 1, padding: '3rem', backgroundColor: '#F4F2EE' }}>
            <Outlet />
        </main>
    </div>
  );
}
