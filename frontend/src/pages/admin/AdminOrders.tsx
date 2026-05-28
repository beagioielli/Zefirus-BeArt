// frontend/src/pages/admin/AdminOrders.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

interface Order {
  id: number;
  status: string;
  mp_payment_method: string;
  amount: number;
  shipping_cost: number;
  buyer_name: string;
  buyer_email: string;
  shipping_status: string | null;
  shipping_tracking_code: string | null;
  experience_published_at: string | null;
  artwork: { id: number; title: string };
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  cancelled: '#6b7280',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders').then(r => {
      setOrders(r.data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Pedidos</h1>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem' }}>#</th>
              <th style={{ padding: '0.75rem' }}>Obra</th>
              <th style={{ padding: '0.75rem' }}>Comprador</th>
              <th style={{ padding: '0.75rem' }}>Valor</th>
              <th style={{ padding: '0.75rem' }}>Pagamento</th>
              <th style={{ padding: '0.75rem' }}>Status</th>
              <th style={{ padding: '0.75rem' }}>Envio</th>
              <th style={{ padding: '0.75rem' }}>Experiência</th>
              <th style={{ padding: '0.75rem' }}>Data</th>
              <th style={{ padding: '0.75rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '0.75rem', color: '#6b7280' }}>#{order.id}</td>
                <td style={{ padding: '0.75rem' }}>{order.artwork?.title}</td>
                <td style={{ padding: '0.75rem' }}>
                  <div>{order.buyer_name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{order.buyer_email}</div>
                </td>
                <td style={{ padding: '0.75rem' }}>
                  R$ {(order.amount + (order.shipping_cost ?? 0)).toFixed(2).replace('.', ',')}
                </td>
                <td style={{ padding: '0.75rem', textTransform: 'uppercase', fontSize: '0.8rem' }}>
                  {order.mp_payment_method}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <span style={{
                    background: STATUS_COLORS[order.status] + '20',
                    color: STATUS_COLORS[order.status],
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                  }}>
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#6b7280' }}>
                  {order.shipping_status ?? '—'}
                  {order.shipping_tracking_code && <div style={{ fontSize: '0.75rem' }}>{order.shipping_tracking_code}</div>}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  {order.experience_published_at
                    ? <span style={{ color: '#10b981', fontSize: '0.8rem' }}>Publicada</span>
                    : order.status === 'approved'
                      ? <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Pendente</span>
                      : '—'}
                </td>
                <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: '#6b7280' }}>
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td style={{ padding: '0.75rem' }}>
                  <Link to={`/admin/orders/${order.id}`} style={{ color: '#2c2c2c', textDecoration: 'underline', fontSize: '0.85rem' }}>
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
