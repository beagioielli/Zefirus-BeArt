// frontend/src/pages/admin/AdminOrderDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';

interface Experience {
  id: number;
  dedication: string | null;
  creation_video_url: string | null;
  exhibition_history: string | null;
  unique_hash: string;
}

interface OrderDetail {
  id: number;
  status: string;
  mp_payment_method: string;
  mp_payment_id: string;
  amount: number;
  shipping_cost: number;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  buyer_cpf: string;
  buyer_message: string | null;
  shipping_status: string | null;
  shipping_option: string | null;
  shipping_tracking_code: string | null;
  experience_published_at: string | null;
  shipping_address: Record<string, string>;
  acquired_experience: Experience | null;
  artwork: { id: number; title: string; price: number };
}

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [msg, setMsg] = useState('');

  const [trackingCode, setTrackingCode] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');

  const [dedication, setDedication] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [exhibition, setExhibition] = useState('');

  useEffect(() => {
    api.get(`/admin/orders/${id}`).then(r => {
      const o = r.data;
      setOrder(o);
      setTrackingCode(o.shipping_tracking_code ?? '');
      setShippingStatus(o.shipping_status ?? 'pending');
      setDedication(o.acquired_experience?.dedication ?? '');
      setVideoUrl(o.acquired_experience?.creation_video_url ?? '');
      setExhibition(o.acquired_experience?.exhibition_history ?? '');
    });
  }, [id]);

  const saveShipping = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/orders/${id}/shipping`, {
        shipping_tracking_code: trackingCode || null,
        shipping_status: shippingStatus,
      });
      setMsg('Envio atualizado.');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const saveExperience = async (publish = false) => {
    setPublishing(publish);
    setSaving(true);
    try {
      const r = await api.put(`/admin/orders/${id}/experience`, {
        dedication,
        creation_video_url: videoUrl || null,
        exhibition_history: exhibition || null,
        publish,
      });
      setOrder(r.data);
      setMsg(publish ? 'Experiência publicada! E-mail enviado ao comprador.' : 'Experiência salva.');
    } finally {
      setSaving(false);
      setPublishing(false);
      setTimeout(() => setMsg(''), 4000);
    }
  };

  if (!order) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  const inputStyle = {
    width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #ddd',
    borderRadius: '4px', fontSize: '0.9rem', marginBottom: '0.75rem',
    boxSizing: 'border-box' as const,
  };

  const total = order.amount + (order.shipping_cost ?? 0);
  const experienceReady = dedication.trim().length > 0;
  const alreadyPublished = !!order.experience_published_at;
  const needsAttention = order.status === 'approved' && order.shipping_status === 'delivered' && !alreadyPublished;

  return (
    <div style={{ padding: '2rem', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Pedido #{order.id}</h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{order.artwork.title}</p>

      {needsAttention && (
        <div style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          ⚠️ A obra foi entregue mas a Experiência ainda não foi publicada. Preencha o conteúdo abaixo e clique em "Publicar".
        </div>
      )}

      {msg && (
        <div style={{ background: '#d1fae5', border: '1px solid #10b981', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', color: '#065f46' }}>
          {msg}
        </div>
      )}

      <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Dados do Pedido</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
          <div><span style={{ color: '#6b7280' }}>Status:</span> <strong>{order.status}</strong></div>
          <div><span style={{ color: '#6b7280' }}>Método:</span> <strong>{order.mp_payment_method.toUpperCase()}</strong></div>
          <div><span style={{ color: '#6b7280' }}>Valor:</span> R$ {order.amount.toFixed(2).replace('.', ',')}</div>
          <div><span style={{ color: '#6b7280' }}>Frete:</span> R$ {(order.shipping_cost ?? 0).toFixed(2).replace('.', ',')} ({order.shipping_option})</div>
          <div><span style={{ color: '#6b7280' }}>Total:</span> <strong>R$ {total.toFixed(2).replace('.', ',')}</strong></div>
          <div><span style={{ color: '#6b7280' }}>MP ID:</span> {order.mp_payment_id}</div>
        </div>
      </section>

      <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Comprador</h2>
        <div style={{ fontSize: '0.875rem' }}>
          <p><strong>{order.buyer_name}</strong></p>
          <p style={{ color: '#6b7280' }}>{order.buyer_email} · {order.buyer_phone} · CPF: {order.buyer_cpf}</p>
          {order.buyer_message && <p style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>"{order.buyer_message}"</p>}
          <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
            Entrega: {order.shipping_address.street}, {order.shipping_address.number} —{' '}
            {order.shipping_address.city}/{order.shipping_address.state}, CEP {order.shipping_address.zip_code}
          </p>
        </div>
      </section>

      {order.status === 'approved' && (
        <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#374151' }}>Controle de Envio</h2>
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Código de rastreio</label>
          <input style={inputStyle} value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="BR123456789BR" />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Status do envio</label>
          <select style={inputStyle} value={shippingStatus} onChange={e => setShippingStatus(e.target.value)}>
            <option value="pending">Aguardando envio</option>
            <option value="shipped">Enviado</option>
            <option value="delivered">Entregue</option>
          </select>
          <button
            onClick={saveShipping}
            disabled={saving}
            style={{ padding: '0.6rem 1.25rem', background: '#2c2c2c', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {saving ? 'Salvando...' : 'Salvar envio'}
          </button>
        </section>
      )}

      {order.acquired_experience && (
        <section style={{ background: '#f9fafb', padding: '1.5rem', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: '#374151' }}>Experiência Exclusiva</h2>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '1rem' }}>
            Hash: <code>{order.acquired_experience.unique_hash}</code>
            {alreadyPublished && <span style={{ marginLeft: '0.75rem', color: '#10b981' }}>✓ Publicada</span>}
          </p>
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Dedicatória *</label>
          <textarea style={{ ...inputStyle, height: '120px', resize: 'vertical' }} value={dedication} onChange={e => setDedication(e.target.value)} placeholder="Texto personalizado da artista para o comprador..." />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>URL do vídeo de criação</label>
          <input style={inputStyle} value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://..." />
          <label style={{ display: 'block', color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Histórico de exposições</label>
          <textarea style={{ ...inputStyle, height: '100px', resize: 'vertical' }} value={exhibition} onChange={e => setExhibition(e.target.value)} />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => saveExperience(false)}
              disabled={saving}
              style={{ padding: '0.6rem 1.25rem', background: '#fff', color: '#2c2c2c', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
            >
              Salvar rascunho
            </button>
            {!alreadyPublished && (
              <button
                onClick={() => saveExperience(true)}
                disabled={saving || !experienceReady}
                style={{ padding: '0.6rem 1.25rem', background: experienceReady ? '#c9a96e' : '#e5e7eb', color: experienceReady ? '#fff' : '#9ca3af', border: 'none', borderRadius: '4px', cursor: experienceReady ? 'pointer' : 'not-allowed' }}
              >
                {publishing ? 'Publicando...' : 'Publicar e enviar e-mail'}
              </button>
            )}
          </div>
          {!experienceReady && (
            <p style={{ fontSize: '0.8rem', color: '#f59e0b', marginTop: '0.5rem' }}>Preencha a dedicatória para publicar.</p>
          )}
        </section>
      )}
    </div>
  );
}
