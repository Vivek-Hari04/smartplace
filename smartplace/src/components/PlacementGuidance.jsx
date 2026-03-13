import { useState, useEffect } from "react";
import axios from "axios";

export default function PlacementGuidance({ accessToken, userRole }) {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [newDiscussion, setNewDiscussion] = useState({ title: "", content: "", company_tag: "" });
  const [replyContent, setReplyContent] = useState("");

  const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/alumni`,
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const res = await api.get("discussions");
      setDiscussions(res.data);
    } catch (err) {
      console.error("Error fetching discussions:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussionDetails = async (id) => {
    try {
      const res = await api.get(`discussions/${id}`);
      setSelectedDiscussion(res.data);
    } catch (err) {
      console.error("Error fetching discussion details:", err);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const handleCreateDiscussion = async (e) => {
    e.preventDefault();
    try {
      await api.post("discussions", newDiscussion);
      setIsModalOpen(false);
      setNewDiscussion({ title: "", content: "", company_tag: "" });
      fetchDiscussions();
    } catch (err) {
      alert("Failed to post doubt");
    }
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    try {
      await api.post(`discussions/${selectedDiscussion.id}/replies`, { content: replyContent });
      setReplyContent("");
      fetchDiscussionDetails(selectedDiscussion.id);
    } catch (err) {
      alert("Failed to post reply");
    }
  };

  if (loading) return <div className="loading-spinner">Loading discussions...</div>;

  return (
    <div className="placement-guidance">
      <div className="tab-header" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
        <h3>Placement Guidance Forum</h3>
        {userRole === 'student' && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>Post a Doubt</button>
        )}
      </div>

      <div className="discussions-list">
        {discussions.length === 0 ? (
          <div className="content-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--text-secondary)' }}>No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          discussions.map(d => (
            <div key={d.id} className="content-card mb-4" style={{ cursor: 'pointer', marginBottom: '1rem' }} onClick={() => fetchDiscussionDetails(d.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{d.title}</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    By {d.fname} {d.lname} • {new Date(d.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {d.company_tag && d.company_tag.split(',').map((tag, idx) => (
                    <span key={idx} className="status-badge verified" style={{ textTransform: 'none' }}>
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {d.content}
              </p>
              
              {userRole === 'alumni' && (
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', textAlign: 'right' }}>
                  <button className="btn btn-secondary btn-sm">View & Provide Guidance →</button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Discussion Details & Guidance Modal */}
      {selectedDiscussion && (
        <div className="modal-overlay" onClick={() => setSelectedDiscussion(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', gap: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', lineHeight: '1.3' }}>{selectedDiscussion.title}</h2>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => setSelectedDiscussion(null)}
                style={{ padding: '0.4rem 0.8rem', minWidth: 'auto' }}
              >
                ✕ Close
              </button>
            </div>
            
            <div className="discussion-main" style={{ 
              padding: '1.25rem', 
              background: 'var(--bg-tertiary)', 
              borderRadius: '12px', 
              marginBottom: '2rem',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedDiscussion.fname} {selectedDiscussion.lname}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(selectedDiscussion.created_at).toLocaleDateString()}
                </span>
              </div>
              <p style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', margin: 0, lineHeight: '1.6' }}>
                {selectedDiscussion.content}
              </p>
            </div>

            <div className="modal-sections" style={{ display: 'grid', gridTemplateColumns: userRole === 'alumni' ? '1fr 1fr' : '1fr', gap: '2rem' }}>
              <div className="replies-section">
                <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Community Guidance
                  <span style={{ fontSize: '0.8rem', background: 'var(--bg-primary)', padding: '0.2rem 0.6rem', borderRadius: '12px' }}>
                    {selectedDiscussion.replies?.length || 0}
                  </span>
                </h3>
                <div className="replies-container" style={{ 
                  maxHeight: '400px', 
                  overflowY: 'auto', 
                  paddingRight: '0.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}>
                  {selectedDiscussion.replies?.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-primary)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
                      <p style={{ margin: 0 }}>No guidance provided yet.</p>
                    </div>
                  ) : (
                    selectedDiscussion.replies?.map(r => (
                      <div key={r.id} style={{ 
                        padding: '1rem', 
                        background: 'var(--bg-primary)', 
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.fname} {r.lname}</span>
                          {r.role === 'alumni' && (
                            <span className="status-badge verified" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                              Alumni • {r.current_company}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{r.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {userRole === 'alumni' && (
                <div className="reply-form-section" style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
                  <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Provide Your Guidance</h3>
                  <form onSubmit={handlePostReply}>
                    <textarea 
                      className="form-input" 
                      rows="8" 
                      placeholder="Share your experience or answer the doubt..." 
                      value={replyContent}
                      onChange={e => setReplyContent(e.target.value)}
                      required
                      style={{ background: 'var(--bg-primary)', resize: 'none', marginBottom: '1.5rem' }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem' }}>
                      Post Your Answer
                    </button>
                  </form>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                    Your advice helps students prepare better for their placements.
                  </p>
                </div>
              )}
            </div>

            {userRole !== 'alumni' && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(74, 222, 128, 0.05)', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(74, 222, 128, 0.1)' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
                  Only verified alumni can provide guidance on placement doubts.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Discussion Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: 0 }}>Post a Placement Doubt</h2>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '0.4rem 0.8rem', minWidth: 'auto' }}
              >
                ✕ Close
              </button>
            </div>
            <form onSubmit={handleCreateDiscussion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="detail-group label">Topic / Question Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. How to prepare for Google's System Design round?" 
                  value={newDiscussion.title}
                  onChange={e => setNewDiscussion({...newDiscussion, title: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="detail-group label">Related Tags (Optional)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. DSA, Google, SDE (Separated by commas)" 
                  value={newDiscussion.company_tag}
                  onChange={e => setNewDiscussion({...newDiscussion, company_tag: e.target.value})}
                />
              </div>
              <div>
                <label className="detail-group label">Detailed Content</label>
                <textarea 
                  className="form-input" 
                  rows="5" 
                  placeholder="Be specific with your doubts so alumni can help better..." 
                  value={newDiscussion.content}
                  onChange={e => setNewDiscussion({...newDiscussion, content: e.target.value})}
                  required
                />
              </div>
              <div className="action-row">
                <button type="submit" className="btn btn-primary">Post to Forum</button>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .mb-4 { margin-bottom: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
        .discussion-main p { line-height: 1.6; }
      `}</style>
    </div>
  );
}
