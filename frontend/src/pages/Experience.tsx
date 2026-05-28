import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';

export default function Experience() {
  const { hash } = useParams();
  const [exp, setExp] = useState<any>(null);

  useEffect(() => {
    api.get(`/experience/${hash}`).then(res => setExp(res.data)).catch(() => {});
  }, [hash]);

  if (!exp) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#050505', color: '#bba36d' }}>Buscando a essência...</div>;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#f0f0f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }}>
      {/* Background with blurred artwork */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: `url(${exp.artwork?.media?.[0]?.original_url || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(30px) opacity(0.2)', zIndex: -1 }} />
      
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ textAlign: 'center', maxWidth: '800px', width: '100%' }}>
        <h1 style={{ fontSize: '3rem', color: '#bba36d', marginBottom: '1rem', fontFamily: 'var(--font-serif)' }}>Experiência Exclusiva</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.8 }}>Um momento único compartilhado eternamente através de "{exp.artwork?.title}".</p>
        
        <div style={{ padding: '3rem', border: '1px solid rgba(187, 163, 109, 0.3)', backgroundColor: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)' }}>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#bba36d' }}>Para {exp.buyer_name}</h2>
            {exp.dedication && (
                <p style={{ fontStyle: 'italic', fontSize: '1.5rem', lineHeight: 2, marginBottom: '3rem', fontFamily: 'var(--font-serif)' }}>
                    "{exp.dedication}"
                </p>
            )}
            <p style={{ fontSize: '1rem', color: '#aaa', maxWidth: '600px', margin: '0 auto' }}>
                As raízes da obra e sua história agora fazem parte da sua jornada. Obrigado por apoiar a arte verdadeira.
            </p>
            
            {exp.artwork?.media?.find((m:any) => m.collection_name === 'certificates') && (
                <a href={exp.artwork.media.find((m:any) => m.collection_name === 'certificates').original_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-block', marginTop: '3rem', background: 'transparent', border: '1px solid #bba36d', color: '#bba36d' }}>
                    BAIXAR CERTIFICADO DE AUTENTICIDADE
                </a>
            )}
        </div>
      </motion.div>
    </div>
  );
}
