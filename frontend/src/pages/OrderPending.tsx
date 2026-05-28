// frontend/src/pages/OrderPending.tsx
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface OrderStatus {
  order_id: number;
  status: string;
  payment_method: string;
  pix_qr_code?: string;
  pix_qr_code_text?: string;
  boleto_url?: string;
  boleto_barcode?: string;
}

export default function OrderPending() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [copied, setCopied] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchStatus = async () => {
    try {
      const r = await api.get(`/orders/${orderId}/status`);
      setOrder(r.data);
      if (r.data.status === 'approved') {
        clearInterval(intervalRef.current!);
        navigate(`/pedido/${orderId}/confirmado`);
      }
      if (['rejected', 'cancelled'].includes(r.data.status)) {
        clearInterval(intervalRef.current!);
      }
    } catch {
      // silent fail
    }
  };

  useEffect(() => {
    fetchStatus();
    intervalRef.current = setInterval(fetchStatus, 5000);
    return () => clearInterval(intervalRef.current!);
  }, [orderId]);

  const copyPix = () => {
    if (!order?.pix_qr_code_text) return;
    navigator.clipboard.writeText(order.pix_qr_code_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!order) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Carregando...</div>;

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '560px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '1rem' }}>
        {order.payment_method === 'boleto' ? 'Seu Boleto' : 'Aguardando Pagamento'}
      </h1>

      {order.payment_method === 'pix' && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            Escaneie o QR code ou copie o código Pix para pagar.
          </p>
          {order.pix_qr_code && (
            <img
              src={`data:image/png;base64,${order.pix_qr_code}`}
              alt="QR Code Pix"
              style={{ width: '200px', height: '200px', margin: '0 auto 1.5rem' }}
            />
          )}
          {order.pix_qr_code_text && (
            <>
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
                {order.pix_qr_code_text}
              </p>
              <button className="btn-primary" onClick={copyPix}>
                {copied ? '✓ Copiado!' : 'Copiar código Pix'}
              </button>
            </>
          )}
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
            Esta página atualiza automaticamente após o pagamento.
          </p>
        </div>
      )}

      {order.payment_method === 'boleto' && (
        <div className="glass" style={{ padding: '2rem', borderRadius: '8px' }}>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>
            O boleto foi enviado para o seu e-mail. Você também pode acessá-lo pelo link abaixo.
          </p>
          {order.boleto_barcode && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', wordBreak: 'break-all', background: '#f5f5f5', padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem' }}>
              {order.boleto_barcode}
            </p>
          )}
          {order.boleto_url && (
            <a href={order.boleto_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-block' }}>
              Abrir Boleto
            </a>
          )}
          <p style={{ marginTop: '1.5rem', fontSize: '0.875rem', color: '#999' }}>
            A confirmação pode levar até 3 dias úteis após o pagamento.
          </p>
        </div>
      )}

      {['rejected', 'cancelled'].includes(order.status) && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '1.5rem', borderRadius: '8px', marginTop: '1rem' }}>
          <p style={{ color: '#dc2626' }}>Pagamento não aprovado. Por favor, tente novamente.</p>
          <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
