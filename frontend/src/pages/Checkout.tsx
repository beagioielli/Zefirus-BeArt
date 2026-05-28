// frontend/src/pages/Checkout.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';
import { api } from '../lib/api';

initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY as string, { locale: 'pt-BR' });

interface Address {
  zip_code: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

interface ShippingOption {
  id: string;
  name: string;
  cost: number;
  estimated_days: string;
}

interface ArtworkData {
  id: number;
  title: string;
  price: number;
}

const emptyAddress = (): Address => ({
  zip_code: '', street: '', number: '', complement: '',
  neighborhood: '', city: '', state: '',
});

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [artwork, setArtwork] = useState<ArtworkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Step 1: Dados pessoais
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCpf, setBuyerCpf] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerMessage, setBuyerMessage] = useState('');
  const [billingAddress, setBillingAddress] = useState<Address>(emptyAddress());

  // Step 2: Endereço e frete
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState<Address>(emptyAddress());
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [brickReady, setBrickReady] = useState(false);

  useEffect(() => {
    api.get(`/artworks/${id}`).then(r => {
      setArtwork({ ...r.data, price: parseFloat(r.data.price) });
      setLoading(false);
    }).catch(() => {
      setError('Obra não encontrada.');
      setLoading(false);
    });
  }, [id]);

  const fetchShipping = async (zipCode: string) => {
    if (zipCode.replace(/\D/g, '').length !== 8) return;
    setLoadingShipping(true);
    try {
      const r = await api.get('/checkout/shipping', {
        params: { artwork_id: id, zip_code: zipCode.replace(/\D/g, '') }
      });
      setShippingOptions(r.data);
    } catch {
      setShippingOptions([]);
    } finally {
      setLoadingShipping(false);
    }
  };

  const handleStep2Next = () => {
    const addr = sameAsBilling ? billingAddress : shippingAddress;
    if (addr.zip_code.replace(/\D/g, '').length === 8) {
      fetchShipping(addr.zip_code);
    }
    setStep(3);
  };

  const totalAmount = (artwork?.price ?? 0) + (selectedShipping?.cost ?? 0);

  const onPaymentSubmit = async ({ selectedPaymentMethod, formData }: any) => {
    const finalShippingAddress = sameAsBilling ? billingAddress : shippingAddress;

    const payload = {
      artwork_id:       Number(id),
      payment_method:   selectedPaymentMethod,
      buyer_name:       buyerName,
      buyer_email:      buyerEmail,
      buyer_cpf:        buyerCpf,
      buyer_phone:      buyerPhone,
      buyer_message:    buyerMessage || undefined,
      billing_address:  billingAddress,
      shipping_address: finalShippingAddress,
      shipping_option:  selectedShipping?.name ?? '',
      shipping_cost:    selectedShipping?.cost ?? 0,
      // Dados do cartão vindos do Bricks
      card_token:         formData?.token,
      payment_method_id:  formData?.payment_method_id,
      installments:       formData?.installments,
    };

    try {
      const r = await api.post('/checkout', payload);
      const { order_id, status } = r.data;

      if (status === 'approved') {
        navigate(`/pedido/${order_id}/confirmado`);
      } else {
        navigate(`/pedido/${order_id}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Erro ao processar pagamento.';
      throw new Error(msg);
    }
  };

  if (loading) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>Carregando...</div>;
  if (error || !artwork) return <div className="container" style={{ padding: '8rem 0', textAlign: 'center' }}>{error}</div>;

  const inputStyle = {
    width: '100%', padding: '0.75rem', border: '1px solid #ddd',
    borderRadius: '4px', fontSize: '1rem', boxSizing: 'border-box' as const,
    marginBottom: '1rem', fontFamily: 'var(--font-sans, sans-serif)',
  };

  const labelStyle = { display: 'block', marginBottom: '0.25rem', color: '#666', fontSize: '0.875rem' };

  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '640px' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', fontFamily: 'var(--font-serif)' }}>
        Garantindo a Obra
      </h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>{artwork.title}</p>

      {/* Steps indicator */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
        {['Dados pessoais', 'Endereço e frete', 'Pagamento'].map((label, i) => (
          <div key={i} style={{
            flex: 1, padding: '0.5rem', textAlign: 'center', fontSize: '0.8rem',
            background: step === i + 1 ? '#2c2c2c' : step > i + 1 ? '#c9a96e' : '#f5f5f5',
            color: step >= i + 1 ? '#fff' : '#999', borderRadius: '4px',
          }}>{label}</div>
        ))}
      </div>

      {/* Step 1: Dados pessoais */}
      {step === 1 && (
        <div>
          <label style={labelStyle}>Nome completo *</label>
          <input style={inputStyle} value={buyerName} onChange={e => setBuyerName(e.target.value)} />
          <label style={labelStyle}>E-mail *</label>
          <input style={inputStyle} type="email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>CPF *</label>
              <input style={inputStyle} placeholder="000.000.000-00" value={buyerCpf} onChange={e => setBuyerCpf(e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Telefone *</label>
              <input style={inputStyle} placeholder="(11) 99999-9999" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} />
            </div>
          </div>
          <label style={labelStyle}>CEP *</label>
          <input style={inputStyle} placeholder="00000-000" value={billingAddress.zip_code} onChange={e => setBillingAddress(a => ({...a, zip_code: e.target.value}))} />
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Rua *</label>
              <input style={inputStyle} value={billingAddress.street} onChange={e => setBillingAddress(a => ({...a, street: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Número *</label>
              <input style={inputStyle} value={billingAddress.number} onChange={e => setBillingAddress(a => ({...a, number: e.target.value}))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Bairro *</label>
              <input style={inputStyle} value={billingAddress.neighborhood} onChange={e => setBillingAddress(a => ({...a, neighborhood: e.target.value}))} />
            </div>
            <div>
              <label style={labelStyle}>Cidade *</label>
              <input style={inputStyle} value={billingAddress.city} onChange={e => setBillingAddress(a => ({...a, city: e.target.value}))} />
            </div>
          </div>
          <label style={labelStyle}>UF *</label>
          <input style={{...inputStyle, maxWidth: '80px'}} maxLength={2} value={billingAddress.state} onChange={e => setBillingAddress(a => ({...a, state: e.target.value.toUpperCase()}))} />
          <label style={labelStyle}>Mensagem para a artista (opcional)</label>
          <textarea style={{...inputStyle, height: '100px', resize: 'vertical'}} value={buyerMessage} onChange={e => setBuyerMessage(e.target.value)} />
          <button
            className="btn-primary"
            onClick={() => setStep(2)}
            disabled={!buyerName || !buyerEmail || !buyerCpf || !billingAddress.zip_code}
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Step 2: Endereço de entrega e frete */}
      {step === 2 && (
        <div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={sameAsBilling} onChange={e => setSameAsBilling(e.target.checked)} />
            Endereço de entrega igual ao de cobrança
          </label>
          {!sameAsBilling && (
            <>
              <label style={labelStyle}>CEP de entrega *</label>
              <input style={inputStyle} placeholder="00000-000" value={shippingAddress.zip_code} onChange={e => setShippingAddress(a => ({...a, zip_code: e.target.value}))} />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Rua *</label><input style={inputStyle} value={shippingAddress.street} onChange={e => setShippingAddress(a => ({...a, street: e.target.value}))} /></div>
                <div><label style={labelStyle}>Número *</label><input style={inputStyle} value={shippingAddress.number} onChange={e => setShippingAddress(a => ({...a, number: e.target.value}))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><label style={labelStyle}>Bairro *</label><input style={inputStyle} value={shippingAddress.neighborhood} onChange={e => setShippingAddress(a => ({...a, neighborhood: e.target.value}))} /></div>
                <div><label style={labelStyle}>Cidade *</label><input style={inputStyle} value={shippingAddress.city} onChange={e => setShippingAddress(a => ({...a, city: e.target.value}))} /></div>
              </div>
              <label style={labelStyle}>UF *</label>
              <input style={{...inputStyle, maxWidth: '80px'}} maxLength={2} value={shippingAddress.state} onChange={e => setShippingAddress(a => ({...a, state: e.target.value.toUpperCase()}))} />
            </>
          )}
          <button
            className="btn-primary"
            style={{ marginBottom: '1rem' }}
            onClick={() => {
              const zip = sameAsBilling ? billingAddress.zip_code : shippingAddress.zip_code;
              fetchShipping(zip);
            }}
            disabled={loadingShipping}
          >
            {loadingShipping ? 'Calculando...' : 'Calcular Frete'}
          </button>

          {shippingOptions.length > 0 && (
            <div>
              <label style={{ ...labelStyle, marginBottom: '0.75rem' }}>Selecione o frete:</label>
              {shippingOptions.map(opt => (
                <label key={opt.id} style={{
                  display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem',
                  border: `1px solid ${selectedShipping?.id === opt.id ? '#2c2c2c' : '#ddd'}`,
                  borderRadius: '4px', marginBottom: '0.5rem', cursor: 'pointer',
                  background: selectedShipping?.id === opt.id ? '#f9f5ef' : '#fff',
                }}>
                  <input type="radio" name="shipping" style={{ marginRight: '0.75rem' }}
                    checked={selectedShipping?.id === opt.id}
                    onChange={() => setSelectedShipping(opt)} />
                  <span style={{ flex: 1 }}>{opt.name} — {opt.estimated_days}</span>
                  <strong>R$ {opt.cost.toFixed(2).replace('.', ',')}</strong>
                </label>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button onClick={() => setStep(1)} style={{ padding: '0.75rem 1.5rem', background: 'none', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>← Voltar</button>
            <button className="btn-primary" onClick={handleStep2Next} disabled={!selectedShipping}>Continuar →</button>
          </div>
        </div>
      )}

      {/* Step 3: Pagamento com MP Bricks */}
      {step === 3 && (
        <div>
          <div style={{ background: '#f9f5ef', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span>{artwork.title}</span>
              <span>R$ {artwork.price.toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
              <span>Frete ({selectedShipping?.name})</span>
              <span>R$ {(selectedShipping?.cost ?? 0).toFixed(2).replace('.', ',')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderTop: '1px solid #ddd', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Total</span>
              <span>R$ {totalAmount.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>

          {!brickReady && (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#999', fontSize: '0.9rem' }}>
              Carregando formulário de pagamento...
            </div>
          )}
          <Payment
            key={`mp-payment-${totalAmount}`}
            initialization={{
              amount: totalAmount,
              payer: {
                firstName: buyerName.split(' ')[0],
                lastName: buyerName.split(' ').slice(1).join(' '),
                email: buyerEmail,
              },
            }}
            customization={{
              paymentMethods: {
                creditCard: 'all',
                ticket: 'all',
                bankTransfer: 'all',
              },
            }}
            onReady={() => setBrickReady(true)}
            onSubmit={onPaymentSubmit}
            onError={(err) => {
              console.error('MP Bricks error:', err);
              setBrickReady(true);
            }}
          />

          <button onClick={() => setStep(2)} style={{ marginTop: '1rem', padding: '0.75rem 1.5rem', background: 'none', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>← Voltar</button>
        </div>
      )}
    </div>
  );
}
