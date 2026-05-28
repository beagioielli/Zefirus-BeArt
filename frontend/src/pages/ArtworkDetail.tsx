import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export default function ArtworkDetail() {
  const { id } = useParams();
  const [artwork, setArtwork] = useState<any>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  useEffect(() => {
    api.get(`/artworks/${id}`).then(res => setArtwork(res.data)).catch(() => {});
  }, [id]);

  if (!artwork) return <div style={{ textAlign: 'center', padding: '10rem 0' }}>Carregando obra...</div>;

  const allImages = artwork.media?.length > 0 ? artwork.media : [{ original_url: 'https://via.placeholder.com/800' }];
  
  const handlePrev = (e: any) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }
  const handleNext = (e: any) => {
      e.stopPropagation();
      setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }

  // Handle click on overlay image to advance smoothly
  const handleImageClick = (e: any) => {
      e.stopPropagation();
      handleNext(e);
  }

  return (
    <div style={{ backgroundColor: '#fff', minHeight: '100vh', paddingBottom: '8rem', color: '#222' }}>
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', paddingTop: '3rem' }}>
        
        {/* Responsive Grid that breaks to 1 column on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '4rem', alignItems: 'flex-start' }}>
            
            {/* LEFT COLUMN: E-commerce Pedrotti Style Images */}
            <div style={{ display: 'flex', gap: '1.5rem', flexDirection: 'row' }}>
                {/* Thumbnails vertical stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '80px', flexShrink: 0 }}>
                    {allImages.map((m: any, idx: number) => (
                        <div 
                            key={m.id || idx} 
                            onClick={() => setCurrentImageIndex(idx)}
                            style={{ 
                                width: '100%', aspectRatio: '1', cursor: 'pointer',
                                border: currentImageIndex === idx ? '2px solid #888' : '1px solid #eaeaea',
                                overflow: 'hidden'
                            }}>
                            <img src={m.original_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
                {/* Main Large Image */}
                <div style={{ flex: 1, cursor: 'zoom-in', position: 'relative' }} onClick={() => setIsGalleryOpen(true)}>
                    <img src={allImages[currentImageIndex]?.original_url} style={{ width: '100%', display: 'block', maxHeight: '80vh', objectFit: 'contain' }} />
                    
                    {artwork.is_awarded && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: '#90885C', color: '#fff', fontSize: '0.75rem', textTransform: 'uppercase', padding: '6px 12px', letterSpacing: '2px', fontWeight: 600 }}>
                            Premiada
                        </div>
                    )}
                    <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', background: 'rgba(0,0,0,0.5)', padding: '8px', borderRadius: '50%', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN: Pedrotti Detail Sidebar */}
            <div style={{ padding: '0 1rem', overflow: 'hidden' }}>

               <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', fontWeight: 600, color: '#222', fontFamily: 'var(--font-sans)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {artwork.title}
               </h1>
               
               <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                   {artwork.year && <span style={{ fontSize: '0.85rem', color: '#666' }}>Ano: {artwork.year}</span>}
                   {artwork.year && <span style={{ color: '#ccc' }}>|</span>}
                   <span style={{ fontSize: '0.85rem', color: '#666' }}>Tamanho: {artwork.dimensions}</span>
               </div>

               <div style={{ fontSize: '1.4rem', fontWeight: 600, color: '#222', marginBottom: '1rem' }}>
                  {artwork.is_sold ? <span style={{ color: '#888', fontSize: '1.2rem' }}>Acervo Particular</span> : (artwork.price ? `R$ ${Number(artwork.price).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'Sob Consulta')}
               </div>

               <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '2.5rem', lineHeight: 1.5 }}>
                  Disponibilidade: <strong style={{ color: artwork.is_sold ? '#888' : '#2e7d32' }}>{artwork.is_sold ? 'Vendida' : (artwork.availability || 'Pronta entrega')}</strong> <br/>
                  <span style={{ fontStyle: 'italic', fontSize: '0.75rem' }}>* {artwork.is_sold ? 'Esta obra já reside em uma coleção' : (artwork.edition_info || 'Peça única. Não há reproduções ou réplicas desta obra.')}</span>
               </div>

               
               <div style={{ marginTop: '3rem' }}>
                   <div style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#555', whiteSpace: 'pre-wrap' }}>
                       {artwork.description}
                   </div>
               </div>

               {/* Video (if external) */}
               {artwork.external_video_url && (
                   <div style={{ marginTop: '4rem' }}>
                       <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Processo Criativo (Vídeo)</h3>
                       <div style={{ aspectRatio: '16/9', width: '100%', background: '#eee' }}>
                           <iframe src={artwork.external_video_url.includes('watch?v=') ? artwork.external_video_url.replace('watch?v=', 'embed/') : artwork.external_video_url} width="100%" height="100%" frameBorder="0" allowFullScreen></iframe>
                       </div>
                   </div>
               )}

               {/* Reviews */}
               {artwork.reviews?.length > 0 && (
                   <div style={{ marginTop: '4rem' }}>
                       <h3 style={{ fontSize: '1.2rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Depoimentos</h3>
                       {artwork.reviews.map((r: any) => (
                           <div key={r.id} style={{ marginBottom: '1rem', padding: '1.5rem', background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                               <p style={{ fontStyle: 'italic', marginBottom: '0.8rem', color: '#555', lineHeight: 1.5 }}>"{r.sentiment_text}"</p>
                               <small style={{ fontWeight: 600, color: '#111' }}>— {r.guest_name}</small>
                           </div>
                       ))}
                   </div>
               )}
            </div>
        </div>
      </div>

      {/* Fullscreen Gallery Overlay natively built */}
      {isGalleryOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: '#ffffff', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }} onClick={() => setIsGalleryOpen(false)}>
              
              <button style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', color: '#111', border: 'none', fontSize: '2.5rem', cursor: 'pointer', width: '50px', height: '50px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsGalleryOpen(false)}>×</button>
              
              {allImages.length > 1 && (
                  <button style={{ position: 'absolute', left: '1rem', background: '#f4f4f4', color: '#111', border: 'none', fontSize: '2.5rem', cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '5px' }} onClick={handlePrev}>‹</button>
              )}
              
              <img src={allImages[currentImageIndex]?.original_url} style={{ maxHeight: '90vh', maxWidth: '85vw', objectFit: 'contain', cursor: allImages.length > 1 ? 'pointer' : 'default' }} onClick={allImages.length > 1 ? handleImageClick : (e) => e.stopPropagation()} />
              
              {allImages.length > 1 && (
                 <button style={{ position: 'absolute', right: '1rem', background: '#f4f4f4', color: '#111', border: 'none', fontSize: '2.5rem', cursor: 'pointer', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '5px' }} onClick={handleNext}>›</button>
              )}
              
              {allImages.length > 1 && (
                  <div style={{ position: 'absolute', bottom: '1.5rem', color: '#555', fontSize: '0.9rem', background: '#f4f4f4', padding: '5px 15px', borderRadius: '2px', letterSpacing: '1px' }}>
                      {currentImageIndex + 1} / {allImages.length}
                  </div>
              )}
          </div>
      )}
    </div>
  );
}
