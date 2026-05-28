import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function AdminCollectionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [selectedArtworks, setSelectedArtworks] = useState<number[]>([]);
  const [allArtworks, setAllArtworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Busca todas as obras
    api.get('/admin/artworks').then(res => {
        setAllArtworks(res.data.data || res.data || []);
    }).catch(() => {});

    if (!isNew) {
      api.get(`/admin/collections/${id}`).then(res => {
        setFormData({
            title: res.data.title || '',
            description: res.data.description || '',
        });
        if (res.data.artworks) {
            setSelectedArtworks(res.data.artworks.map((a: any) => a.id));
        }
      }).catch(() => {
        alert('Coleção não encontrada!');
        navigate('/admin/artworks');
      });
    }
  }, [id, isNew, navigate]);

  const toggleArtwork = (artId: number) => {
      setSelectedArtworks(prev => 
          prev.includes(artId) ? prev.filter(idd => idd !== artId) : [...prev, artId]
      );
  };

  const deleteCollection = async () => {
      if (!window.confirm('Excluir completamente esta coleção? Isso não apagará as obras contidas nela, apenas desvinculará.')) return;
      try {
          await api.delete(`/admin/collections/${id}`);
          navigate('/admin/artworks');
      } catch {
          alert('Erro ao deletar coleção');
      }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
        if (isNew) {
            await api.post('/admin/collections', { ...formData, artwork_ids: selectedArtworks });
        } else {
            await api.put(`/admin/collections/${id}`, { ...formData, artwork_ids: selectedArtworks });
        }
        alert('Coleção salva com sucesso!');
        navigate('/admin/artworks');
    } catch (err: any) {
        console.error(err);
        alert('Erro ao salvar. Verifique o console.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', color: '#1B1B1B', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>{isNew ? 'Criar Coleção' : 'Editar Coleção'}</h1>
        <form onSubmit={handleSubmit} style={{ background: '#ffffff', borderRadius: '8px', padding: '2.5rem', boxShadow: 'var(--shadow-sm)', border: '1px solid #e1ded8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            <input type="text" placeholder="Nome da Coleção" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px' }} />

            <textarea placeholder="Descrição conceitual da coleção" rows={6} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required style={{ padding: '0.8rem', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }} />

            <div style={{ padding: '1.5rem', background: '#fcfcfc', border: '1px solid #eee', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', color: '#333' }}>Obras Atribuídas a esta Coleção</h3>
                {allArtworks.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {allArtworks.map(art => {
                            const isSelected = selectedArtworks.includes(art.id);
                            return (
                                <div key={art.id} onClick={() => toggleArtwork(art.id)} style={{ padding: '1rem', border: isSelected ? '2px solid var(--primary)' : '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', background: isSelected ? '#faf8f5' : '#fff', position: 'relative' }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.5rem', color: isSelected ? 'var(--primary)' : '#555' }}>
                                        {art.title}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                        #{art.id} • {art.is_sold ? 'Vendida' : 'Disponível'}
                                    </div>
                                    {isSelected && <div style={{ position: 'absolute', top: '10px', right: '10px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--primary)' }}></div>}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p style={{ color: '#888' }}>Carregando obras ou nenhuma obra cadastrada no sistema.</p>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '1rem' }}>
                {!isNew ? (
                    <button type="button" onClick={deleteCollection} style={{ padding: '0.8rem 1.5rem', background: '#fff', border: '1px solid #ff4d4f', color: '#ff4d4f', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Excluir Permanente</button>
                ) : <div></div>}
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="button" onClick={() => navigate('/admin/artworks')} style={{ padding: '0.8rem 1.5rem', border: '1px solid #ddd', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>Cancelar</button>
                    <button type="submit" disabled={loading} style={{ padding: '0.8rem 2.5rem', background: 'var(--secondary)', color: '#111', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Processando...' : 'Salvar Coleção'}</button>
                </div>
            </div>
        </form>
    </div>
  );
}
