import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function AdminArtworkEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dimensions: '',
    price: '',
    stock: 1,
    is_sold: false,
    is_archived: false,
    is_awarded: false,
    year: '',
    art_collection_id: '',
    external_video_url: '',
    meli_category_id: '',
    meli_condition: 'new',
    meli_listing_type: 'gold_special',
    availability: 'Pronta entrega',
    edition_info: '',
    shipping_weight: '',
    shipping_height: '',
    shipping_width: '',
    shipping_length: ''
  });

  const [collections, setCollections] = useState<any[]>([]);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [filesToAdd, setFilesToAdd] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/collections').then(res => setCollections(res.data)).catch(() => {});

    if (!isNew) {
      api.get(`/admin/artworks/${id}`).then(res => {
        const d = res.data;
        setFormData({
            title: d.title || '',
            description: d.description || '',
            dimensions: d.dimensions || '',
            price: d.price ? String(d.price).replace('.', ',') : '',
            stock: d.stock || 1,
            is_sold: !!d.is_sold,
            is_archived: !!d.is_archived,
            is_awarded: !!d.is_awarded,
            year: d.year || '',
            art_collection_id: d.art_collection_id || '',
            external_video_url: d.external_video_url || '',
            meli_category_id: d.meli_category_id || '',
            meli_condition: d.meli_condition || 'new',
            meli_listing_type: d.meli_listing_type || 'gold_special',
            availability: d.availability || 'Pronta entrega',
            edition_info: d.edition_info || '',
            shipping_weight: d.shipping_weight != null ? String(d.shipping_weight) : '',
            shipping_height: d.shipping_height != null ? String(d.shipping_height) : '',
            shipping_width: d.shipping_width != null ? String(d.shipping_width) : '',
            shipping_length: d.shipping_length != null ? String(d.shipping_length) : ''
        });
        setExistingMedia(d.media || []);
      }).catch(() => {
        alert('Obra não encontrada!');
        navigate('/admin/artworks');
      });
    }
  }, [id, isNew, navigate]);

  const handleFileChange = (e: any) => {
      if (e.target.files) {
          setFilesToAdd(Array.from(e.target.files));
      }
  };

  const removeMedia = async (mediaId: number) => {
      if (!window.confirm('Tem certeza que quer apagar esta mídia permanentemente?')) return;
      try {
          await api.delete(`/admin/artworks/${id}/media/${mediaId}`);
          setExistingMedia(existingMedia.filter(m => m.id !== mediaId));
      } catch {
          alert('Erro ao excluir mídia');
      }
  };

  const deleteArtwork = async () => {
      if (!window.confirm('Excluir completamente esta obra (e suas fotos) do banco? Isso não pode ser desfeito. Use ARQUIVAR se quiser apenas esconder.')) return;
      try {
          await api.delete(`/admin/artworks/${id}`);
          navigate('/admin/artworks');
      } catch {
          alert('Erro ao deletar obra');
      }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const payload = new FormData();
    Object.keys(formData).forEach(key => {
        if (key === 'price') return; // handled separately
        const val = (formData as any)[key];
        if (val !== null && val !== '') {
            payload.append(key, val);
        }
    });

    const priceFloat = formData.price ? parseFloat(formData.price.replace(/\./g, '').replace(',', '.')) : null;
    if (priceFloat !== null && !isNaN(priceFloat)) {
        payload.set('price', priceFloat.toString());
    }

    payload.set('is_sold', formData.is_sold ? "1" : "0");
    payload.set('is_archived', formData.is_archived ? "1" : "0");
    payload.set('is_awarded', formData.is_awarded ? "1" : "0");

    filesToAdd.forEach(file => {
        payload.append('photos[]', file);
    });

    try {
        if (isNew) {
            await api.post('/admin/artworks', payload, { headers: { 'Content-Type': 'multipart/form-data' }});
        } else {
            payload.append('_method', 'PUT');
            await api.post(`/admin/artworks/${id}`, payload, { headers: { 'Content-Type': 'multipart/form-data' }});
        }
        alert('Obra salva com sucesso!');
        navigate('/admin/artworks');
    } catch (err: any) {
        console.error(err);
        alert('Erro ao salvar. Verifique se os campos estão preenchidos de forma correta.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#111' }}>{isNew ? 'Criar Nova Obra' : 'Editar Obra'}</h1>
        <form onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: '8px', padding: '2.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <input type="text" placeholder="Título da Obra" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Dimensões (Ex: 100x80cm)" value={formData.dimensions} onChange={e => setFormData({...formData, dimensions: e.target.value})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                <input type="text" placeholder="Ano (Opcional)" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <textarea placeholder="Descrição inspiradora" rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <select value={formData.availability} onChange={e => setFormData({...formData, availability: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <option value="Pronta entrega">Disponibilidade: Pronta entrega</option>
                    <option value="Sob encomenda">Disponibilidade: Sob encomenda</option>
                </select>
                <input type="text" placeholder="Info de Edição (Ex: Peça única. / 1 de 10 peças)" value={formData.edition_info} onChange={e => setFormData({...formData, edition_info: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <input type="text" placeholder="Preço (Ex: 1500,00) (Opcional)" value={formData.price} onChange={e => {
                    const cleaned = e.target.value.replace(/[^0-9,]/g, '');
                    setFormData({...formData, price: cleaned});
                }} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />

                <input type="number" placeholder="Estoque" value={formData.stock || ''} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                
                <select value={formData.art_collection_id} onChange={e => setFormData({...formData, art_collection_id: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <option value="">Sem Coleção</option>
                    {collections.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
            </div>
            
            <input type="url" placeholder="URL do Vídeo Externo no Vimeo/Youtube (opcional)" value={formData.external_video_url} onChange={e => setFormData({...formData, external_video_url: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />

            <div style={{ display: 'flex', gap: '3rem', padding: '1.5rem', background: '#f8f8f8', border: '1px solid #eee', borderRadius: '8px', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="checkbox" checked={formData.is_sold} onChange={e => setFormData({...formData, is_sold: e.target.checked})} style={{ width: 18, height: 18 }} />
                    Sinalizar Obra como Vendida
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', fontWeight: 500 }}>
                    <input type="checkbox" checked={formData.is_awarded} onChange={e => setFormData({...formData, is_awarded: e.target.checked})} style={{ width: 18, height: 18 }} />
                    Sinalizar Obra como Premiada (Selo Destaque)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', color: '#ff6b6b', fontWeight: 500 }}>
                    <input type="checkbox" checked={formData.is_archived} onChange={e => setFormData({...formData, is_archived: e.target.checked})} style={{ width: 18, height: 18 }} />
                    Arquivar (Ocultar do Público)
                </label>
            </div>

            <hr style={{ margin: '0', borderColor: '#eee' }} />

            <div>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>Configurações Integração Mercado Livre</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                    <input type="text" placeholder="ID da Categoria (Ex: MLB4374)" value={formData.meli_category_id} onChange={e => setFormData({...formData, meli_category_id: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />
                    
                    <select value={formData.meli_condition} onChange={e => setFormData({...formData, meli_condition: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="new">Condição: Novo</option>
                        <option value="used">Condição: Usado</option>
                    </select>

                    <select value={formData.meli_listing_type} onChange={e => setFormData({...formData, meli_listing_type: e.target.value})} style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }}>
                        <option value="gold_special">Anúncio Clássico</option>
                        <option value="gold_pro">Anúncio Premium (Sem Juros)</option>
                    </select>
                </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#666' }}>Dados de embalagem (para cálculo de frete)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label>Peso (kg)</label>
                  <input
                    type="number" step="0.1" min="0"
                    value={formData.shipping_weight}
                    onChange={e => setFormData({ ...formData, shipping_weight: e.target.value })}
                    style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                <div>
                  <label>Altura embalagem (cm)</label>
                  <input
                    type="number" min="0"
                    value={formData.shipping_height}
                    onChange={e => setFormData({ ...formData, shipping_height: e.target.value })}
                    style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                <div>
                  <label>Largura embalagem (cm)</label>
                  <input
                    type="number" min="0"
                    value={formData.shipping_width}
                    onChange={e => setFormData({ ...formData, shipping_width: e.target.value })}
                    style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                </div>
                <div>
                  <label>Comprimento embalagem (cm)</label>
                  <input
                    type="number" min="0"
                    value={formData.shipping_length}
                    onChange={e => setFormData({ ...formData, shipping_length: e.target.value })}
                    style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <hr style={{ margin: '0', borderColor: '#eee' }} />

            <div>
                <h3 style={{ marginBottom: '1rem', color: '#333' }}>Mídia Acoplada (Upload de Fotos Secundárias/Detalhes)</h3>
                {!isNew && existingMedia.length > 0 && (
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                        {existingMedia.map(m => (
                            <div key={m.id} style={{ position: 'relative', width: '150px', height: '150px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                                <img src={m.original_url} alt="media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button type="button" onClick={() => removeMedia(m.id)} style={{ position: 'absolute', top: 5, right: 5, background: 'red', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>X</button>
                            </div>
                        ))}
                    </div>
                )}
                <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" style={{ padding: '1rem', border: '2px dashed #ddd', borderRadius: '8px', width: '100%', display: 'block', background: '#fafafa', cursor: 'pointer' }} />
            </div>

            <hr style={{ margin: '0', borderColor: '#eee' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem' }}>
                {!isNew ? (
                    <button type="button" onClick={deleteArtwork} style={{ padding: '0.8rem 1.5rem', background: '#fff', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Excluir Permanente</button>
                ) : <div></div>}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/admin/artworks')} style={{ padding: '0.8rem 1.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                    <button type="submit" disabled={loading} style={{ padding: '0.8rem 2.5rem', background: 'var(--secondary)', color: '#111', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Processando...' : 'Salvar Obra'}</button>
                </div>
            </div>
        </form>
    </div>
  );
}
