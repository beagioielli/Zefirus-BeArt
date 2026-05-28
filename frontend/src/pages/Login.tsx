import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('admin@zefirus.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate('/admin');
    } catch (err) {
      setError('Credenciais inválidas ou acesso negado.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#fff' }}>
        <div style={{ maxWidth: '400px', width: '100%', margin: '0 auto', padding: '3rem', border: '1px solid #333', background: '#111', borderRadius: '8px' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', fontFamily: 'var(--font-serif)', color: 'var(--secondary)' }}>Zefirus Admin</h1>
            {error && <p style={{ color: 'red', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '1rem', border: '1px solid #333', background: '#222', color: '#fff', borderRadius: '4px' }} />
                <div style={{ position: 'relative' }}>
                    <input type={showPassword ? 'text' : 'password'} placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '1rem', paddingRight: '3rem', border: '1px solid #333', background: '#222', color: '#fff', borderRadius: '4px', width: '100%', boxSizing: 'border-box' }} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#999', cursor: 'pointer', fontSize: '0.85rem' }}>
                        {showPassword ? 'ocultar' : 'mostrar'}
                    </button>
                </div>
                <button type="submit" style={{ padding: '1rem', backgroundColor: 'var(--secondary)', color: '#000', fontWeight: 'bold', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Entrar</button>
            </form>
        </div>
    </div>
  );
}
