import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#111' }}>Bem-vindo, {user?.name || 'Admin'}</h1>
        <p style={{ color: '#555', fontSize: '1.2rem' }}>Você está na área administrativa do Zefirus.</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#888', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Obras Cadastradas</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>--</p>
            </div>
            <div style={{ padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ color: '#888', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>Coleções</h3>
                <p style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary)' }}>--</p>
            </div>
        </div>
    </div>
  );
}
