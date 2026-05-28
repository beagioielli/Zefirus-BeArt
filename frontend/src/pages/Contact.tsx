export default function Contact() {
  return (
    <div className="container" style={{ padding: '6rem 0', maxWidth: '800px' }}>
      <h1 style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem', letterSpacing: '2px' }}>CONTATO</h1>
      <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '4rem' }}>Para encomendas exclusivas ou dúvidas sobre as obras.</p>
      
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Nome Completo</label>
          <input type="text" style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--surface)', color: 'var(--text-main)' }} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>E-mail</label>
          <input type="email" style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--surface)', color: 'var(--text-main)' }} required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>Mensagem</label>
          <textarea rows={6} style={{ width: '100%', padding: '1rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--surface)', color: 'var(--text-main)', resize: 'vertical' }} required />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', marginTop: '1rem', letterSpacing: '1px' }}>ENVIAR MENSAGEM</button>
      </form>
    </div>
  );
}
