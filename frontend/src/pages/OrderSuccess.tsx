// frontend/src/pages/OrderSuccess.tsx
import { useParams, Link } from 'react-router-dom';

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '560px', textAlign: 'center' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✦</div>
      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
        Compra Confirmada
      </h1>
      <div className="glass" style={{ padding: '2.5rem', borderRadius: '8px' }}>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '1.5rem', color: '#444' }}>
          Obrigada por adquirir esta obra exclusiva.
          Você receberá um e-mail de confirmação em breve.
        </p>
        <p style={{ color: '#666', lineHeight: 1.8, marginBottom: '2rem' }}>
          Pedido <strong>#{orderId}</strong>
          <br />
          Sua obra será preparada com todo o cuidado e enviada em breve.
          Quando ela chegar, você receberá um e-mail especial com acesso à sua Experiência exclusiva.
        </p>
        <Link to="/catalog" className="btn-primary">
          Explorar mais obras
        </Link>
      </div>
    </div>
  );
}
