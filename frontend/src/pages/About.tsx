import { motion } from 'framer-motion';

export default function About() {
  return (
    <div style={{ backgroundColor: '#F4F2EE', minHeight: '100vh', paddingBottom: '8rem', color: '#1B1B1B' }}>
      
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto', paddingTop: '8rem' }}>
        
        {/* The Title Section */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1 }}>
            <h1 style={{ textAlign: 'center', fontSize: '3.5rem', marginBottom: '5rem', letterSpacing: '2px', fontFamily: 'var(--font-serif)', fontWeight: 400 }}>
              The Maison Beatriz Gioielli
            </h1>
        </motion.div>

        {/* Drop Cap & Centralized Text section */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5, delay: 0.2 }} style={{ marginBottom: '8rem' }}>
            <p style={{ fontSize: '1.15rem', lineHeight: 2, marginBottom: '2rem', textAlign: 'justify' }}>
              <span style={{ float: 'left', fontSize: '4.5rem', lineHeight: 0.8, paddingTop: '8px', paddingRight: '12px', fontFamily: 'var(--font-serif)', color: 'var(--primary)' }}>C</span>
              om mais de uma década dedicada à alta-costura das artes plásticas, Beatriz Gioielli consolida-se como um nome proeminente no cenário da arte contemporânea. Transitando perfeitamente entre o figurativo sutil e a abstração monumental, a artista capta a essência efêmera da natureza e a transpõe em telas de escala impressionante. O atelier da artista atua como um laboratório alquímico, onde pigmentos puros e materiais raros ganham significado poético, convidando colecionadores do mundo inteiro a uma profunda experiência sensorial.
            </p>
            <p style={{ fontSize: '1.15rem', lineHeight: 2, textAlign: 'justify' }}>
              Inspirada pelos movimentos expressionistas e pela leveza renascentista, cada obra assinada carrega um selo indelével de autenticidade — não apenas grafado na assinatura sobre a tela, mas na aura indiscutível que a obra projeta nos ambientes mais sofisticados do mundo.
            </p>
        </motion.div>

      </div>

      {/* Editorial Full Width Banner (Moved down) */}
      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5 }}>
        <div style={{ width: '100%', height: '70vh', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: 'url("https://images.unsplash.com/photo-1541961017774-22349e4a1262?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80")' }} />
      </motion.div>
      
      <div className="container" style={{ maxWidth: '900px', margin: '0 auto' }}>

        {/* Asymmetrical Image block */}
        <div style={{ display: 'flex', flexDirection: 'row', gap: '4rem', alignItems: 'center', margin: '8rem 0' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }} style={{ flex: 1.5 }}>
                <div style={{ width: '100%', paddingBottom: '130%', backgroundColor: '#e2dfd9', backgroundSize: 'cover', backgroundPosition: 'center', backgroundImage: 'url("https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80")', boxShadow: 'var(--shadow-md)' }} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3 }} style={{ flex: 1 }}>
                 <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)', fontWeight: 400, lineHeight: 1.3 }}>A Alquimia<br/>da Forma</h2>
                 <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#333' }}>
                    Cada pincelada transporta texturas impastos e véus que brincam com infinitas angulações da luz natural. O processo de criação é altamente intuitivo e visceral.
                 </p>
            </motion.div>
        </div>

        {/* Full Width Quote */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 1.5 }} style={{ textAlign: 'center', margin: '8rem 0 4rem 0' }}>
            <p style={{ fontSize: '2.5rem', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--primary)', lineHeight: 1.4, maxWidth: '800px', margin: '0 auto' }}>
                "A verdadeira obra não repousa no objeto, mas no silêncio e no fôlego de quem a admira."
            </p>
            <span style={{ display: 'block', marginTop: '2.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '3px' }}>— Beatriz Gioielli</span>
        </motion.div>

      </div>
    </div>
  );
}
