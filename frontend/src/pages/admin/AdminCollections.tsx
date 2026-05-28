import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

export default function AdminCollections() {
  const [collections, setCollections] = useState<any[]>([]);

  useEffect(() => {
    api.get('/admin/collections').then(res => {
        setCollections(res.data);
    }).catch(() => {});
  }, []);

  return (
    <div>
        <div className="admin-card">
            <div className="admin-card-header">
                <h1 className="admin-card-title">Coleções</h1>
                <div className="admin-toolbar">
                    <div style={{ position: 'relative' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position: 'absolute', left: '12px', top: '12px'}}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input type="text" placeholder="Search" className="admin-search-input" />
                    </div>
                    <Link to="/admin/collections/new" style={{ padding: '0.6rem 1.2rem', backgroundColor: 'var(--secondary)', color: '#000', textDecoration: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}>+ Nova Coleção</Link>
                </div>
            </div>
            
            <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th style={{ width: '40px' }}><input type="checkbox" className="admin-checkbox" /></th>
                        <th>Coleção</th>
                        <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {collections.map(col => (
                        <tr key={col.id}>
                             <td><input type="checkbox" className="admin-checkbox" /></td>
                             <td>
                                <div className="entity-cell">
                                    <div className="entity-avatar">
                                        {col.cover_image ? <img src={col.cover_image} alt={col.title} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} /> : <div style={{width: '100%', height: '100%', background: '#eee', borderRadius: '8px'}}></div>}
                                    </div>
                                    <div className="entity-info">
                                        <p className="entity-name">{col.title}</p>
                                        <p className="entity-sub">#{col.id}</p>
                                    </div>
                                </div>
                            </td>
                            <td>
                                <div className="action-icons">
                                    <button title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                    <Link to={`/admin/collections/${col.id}/edit`} title="Editar"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></Link>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {collections.length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Nenhuma coleção cadastrada.</td></tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
    </div>
  );
}
