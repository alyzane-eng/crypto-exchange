import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const CATEGORIES = [
  { id: 'all', label: 'All Posts', icon: '🌐' },
  { id: 'trading-tips', label: 'Trading Tips', icon: '📈' },
  { id: 'news', label: 'Market News', icon: '📰' },
  { id: 'analysis', label: 'Analysis', icon: '🔍' },
  { id: 'discussion', label: 'Discussion', icon: '💬' },
  { id: 'beginners', label: 'Beginners', icon: '🎓' },
];

export default function Forum() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'discussion' });
  const [search, setSearch] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetchPosts();
  }, [category]);

  const fetchPosts = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/forum/posts?category=${category}`);
      setPosts(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const fetchComments = async (postId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/forum/posts/${postId}/comments`);
      setComments(res.data);
    } catch (err) { console.error(err); }
  };

  const handleLike = async (postId) => {
    try {
      await axios.post(`http://localhost:5000/api/forum/posts/${postId}/like`);
      fetchPosts();
    } catch (err) { console.error(err); }
  };

  const handleNewPost = async () => {
    if (!newPost.title || !newPost.content) return;
    try {
      await axios.post('http://localhost:5000/api/forum/posts', {
        userId: user.id,
        userName: user.name,
        category: newPost.category,
        title: newPost.title,
        content: newPost.content,
      });
      setNewPost({ title: '', content: '', category: 'discussion' });
      setShowNew(false);
      fetchPosts();
    } catch (err) { console.error(err); }
  };

  const handleComment = async () => {
    if (!newComment || !selectedPost) return;
    try {
      await axios.post(`http://localhost:5000/api/forum/posts/${selectedPost.id}/comments`, {
        userId: user.id,
        userName: user.name,
        content: newComment,
      });
      setNewComment('');
      fetchComments(selectedPost.id);
    } catch (err) { console.error(err); }
  };

  const openPost = (post) => {
    setSelectedPost(post);
    fetchComments(post.id);
  };

  const filtered = posts.filter(p =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.content?.toLowerCase().includes(search.toLowerCase())
  );

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Community Forum</h1>
            <p style={styles.subtitle}>Share tips, analysis and discuss crypto markets with your class</p>
          </div>
          <button style={styles.newPostBtn} onClick={() => setShowNew(true)}>
            + New Post
          </button>
        </div>

        <div style={styles.layout}>

          {/* Left sidebar */}
          <div style={styles.sidebar}>
            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>Categories</div>
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  style={{
                    ...styles.catBtn,
                    background: category === cat.id ? '#f0b90b15' : 'transparent',
                    color: category === cat.id ? '#f0b90b' : '#848e9c',
                    borderLeft: category === cat.id ? '3px solid #f0b90b' : '3px solid transparent',
                  }}
                  onClick={() => setCategory(cat.id)}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div style={styles.sideCard}>
              <div style={styles.sideTitle}>Your Stats</div>
              <div style={styles.userStatRow}>
                <div style={styles.userAvatar}>{user?.name?.charAt(0).toUpperCase()}</div>
                <div>
                  <div style={{ color: '#eaecef', fontSize: '14px', fontWeight: '600' }}>{user?.name}</div>
                  <div style={{ color: '#474d57', fontSize: '12px' }}>Community Member</div>
                </div>
              </div>
              <div style={styles.statRow}>
                <span style={styles.statLabel}>Posts</span>
                <span style={styles.statVal}>{posts.filter(p => p.user_id === user?.id).length}</span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={styles.main}>

            {/* Search */}
            <div style={styles.searchBar}>
              <span>🔍</span>
              <input
                style={styles.searchInput}
                placeholder="Search posts..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* New Post Modal */}
            {showNew && (
              <div style={styles.newPostCard}>
                <div style={styles.newPostHeader}>
                  <h3 style={{ color: '#eaecef', margin: 0 }}>Create New Post</h3>
                  <button style={styles.closeBtn} onClick={() => setShowNew(false)}>✕</button>
                </div>
                <select
                  style={styles.select}
                  value={newPost.category}
                  onChange={e => setNewPost({ ...newPost, category: e.target.value })}
                >
                  {CATEGORIES.filter(c => c.id !== 'all').map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                  ))}
                </select>
                <input
                  style={styles.postInput}
                  placeholder="Post title..."
                  value={newPost.title}
                  onChange={e => setNewPost({ ...newPost, title: e.target.value })}
                />
                <textarea
                  style={styles.postTextarea}
                  placeholder="Share your trading tips, analysis, or start a discussion..."
                  value={newPost.content}
                  onChange={e => setNewPost({ ...newPost, content: e.target.value })}
                  rows={5}
                />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button style={styles.cancelBtn} onClick={() => setShowNew(false)}>Cancel</button>
                  <button style={styles.submitBtn} onClick={handleNewPost}>Post</button>
                </div>
              </div>
            )}

            {/* Posts */}
            {loading ? (
              <div style={styles.loading}>Loading posts...</div>
            ) : filtered.length === 0 ? (
              <div style={styles.empty}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>💬</div>
                <p>No posts yet. Be the first to share!</p>
                <button style={styles.submitBtn} onClick={() => setShowNew(true)}>
                  Create First Post
                </button>
              </div>
            ) : (
              <div style={styles.postsList}>
                {filtered.map(post => {
                  const cat = CATEGORIES.find(c => c.id === post.category);
                  return (
                    <div
                      key={post.id}
                      style={styles.postCard}
                      onClick={() => openPost(post)}
                    >
                      <div style={styles.postTop}>
                        <span style={styles.catTag}>
                          {cat?.icon} {cat?.label || post.category}
                        </span>
                        <span style={styles.timeTag}>{timeAgo(post.created_at)}</span>
                      </div>
                      <h3 style={styles.postTitle}>{post.title}</h3>
                      <p style={styles.postPreview}>
                        {post.content?.length > 150 ? post.content.slice(0, 150) + '...' : post.content}
                      </p>
                      <div style={styles.postBottom}>
                        <div style={styles.authorRow}>
                          <div style={styles.authorAvatar}>
                            {post.user_name?.charAt(0).toUpperCase()}
                          </div>
                          <span style={styles.authorName}>{post.user_name}</span>
                        </div>
                        <div style={styles.postActions}>
                          <button
                            style={styles.likeBtn}
                            onClick={e => { e.stopPropagation(); handleLike(post.id); }}
                          >
                            👍 {post.likes || 0}
                          </button>
                          <span style={styles.commentCount}>
                            💬 Reply
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div style={styles.modalOverlay} onClick={() => setSelectedPost(null)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <span style={styles.catTag}>
                  {CATEGORIES.find(c => c.id === selectedPost.category)?.icon} {selectedPost.category}
                </span>
                <h2 style={styles.modalTitle}>{selectedPost.title}</h2>
                <div style={styles.modalMeta}>
                  By <strong style={{ color: '#f0b90b' }}>{selectedPost.user_name}</strong> · {timeAgo(selectedPost.created_at)}
                </div>
              </div>
              <button style={styles.closeBtn} onClick={() => setSelectedPost(null)}>✕</button>
            </div>
            <div style={styles.modalContent}>{selectedPost.content}</div>
            <div style={styles.modalLike}>
              <button
                style={styles.likeBtn}
                onClick={() => handleLike(selectedPost.id)}
              >
                👍 {selectedPost.likes || 0} Likes
              </button>
            </div>

            <div style={styles.commentsSection}>
              <h3 style={styles.commentsTitle}>💬 Comments ({comments.length})</h3>
              {comments.map((c, i) => (
                <div key={i} style={styles.comment}>
                  <div style={styles.commentAvatar}>
                    {c.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.commentBody}>
                    <div style={styles.commentAuthor}>{c.user_name}</div>
                    <div style={styles.commentText}>{c.content}</div>
                    <div style={styles.commentTime}>{timeAgo(c.created_at)}</div>
                  </div>
                </div>
              ))}

              <div style={styles.addComment}>
                <input
                  style={styles.commentInput}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleComment()}
                />
                <button style={styles.submitBtn} onClick={handleComment}>Reply</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#0b0e11', fontFamily: "'Segoe UI', sans-serif", color: '#eaecef' },
  container: { maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#eaecef', margin: 0 },
  subtitle: { color: '#848e9c', fontSize: '14px', marginTop: '4px' },
  newPostBtn: { background: '#f0b90b', border: 'none', borderRadius: '8px', color: '#1e2329', padding: '10px 20px', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
  layout: { display: 'grid', gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : '220px 1fr', gap: '16px' },
  sidebar: { display: window.innerWidth <= 768 ? 'none' : 'flex', flexDirection: 'column', gap: '16px' },
  sideCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '16px' },
  sideTitle: { color: '#848e9c', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' },
  catBtn: { width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500', textAlign: 'left', marginBottom: '2px', transition: 'all 0.15s' },
  userStatRow: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' },
  userAvatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#f0b90b', color: '#1e2329', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '700' },
  statRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px' },
  statLabel: { color: '#848e9c' },
  statVal: { color: '#eaecef', fontWeight: '600' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  searchBar: { display: 'flex', alignItems: 'center', gap: '10px', background: '#1e2329', border: '1px solid #2b3139', borderRadius: '8px', padding: '10px 16px' },
  searchInput: { flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#eaecef', fontSize: '14px' },
  newPostCard: { background: '#1e2329', border: '1px solid #f0b90b33', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' },
  newPostHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeBtn: { background: 'transparent', border: 'none', color: '#848e9c', fontSize: '18px', cursor: 'pointer' },
  select: { background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '6px', color: '#eaecef', padding: '8px 12px', fontSize: '13px', outline: 'none' },
  postInput: { background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '8px', color: '#eaecef', padding: '10px 14px', fontSize: '15px', outline: 'none', fontWeight: '600' },
  postTextarea: { background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '8px', color: '#eaecef', padding: '10px 14px', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: "'Segoe UI', sans-serif", lineHeight: '1.6' },
  cancelBtn: { background: 'transparent', border: '1px solid #2b3139', borderRadius: '6px', color: '#848e9c', padding: '8px 20px', fontSize: '13px', cursor: 'pointer' },
  submitBtn: { background: '#f0b90b', border: 'none', borderRadius: '6px', color: '#1e2329', padding: '8px 20px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  loading: { textAlign: 'center', padding: '60px', color: '#848e9c' },
  empty: { textAlign: 'center', padding: '60px', color: '#848e9c', background: '#1e2329', borderRadius: '12px' },
  postsList: { display: 'flex', flexDirection: 'column', gap: '12px' },
  postCard: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: 'border-color 0.15s' },
  postTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  catTag: { background: '#2b3139', color: '#f0b90b', fontSize: '11px', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' },
  timeTag: { color: '#474d57', fontSize: '12px' },
  postTitle: { color: '#eaecef', fontSize: '17px', fontWeight: '700', margin: '0 0 8px 0' },
  postPreview: { color: '#848e9c', fontSize: '14px', lineHeight: '1.6', margin: '0 0 14px 0' },
  postBottom: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  authorRow: { display: 'flex', alignItems: 'center', gap: '8px' },
  authorAvatar: { width: '24px', height: '24px', borderRadius: '50%', background: '#f0b90b', color: '#1e2329', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' },
  authorName: { color: '#848e9c', fontSize: '13px' },
  postActions: { display: 'flex', gap: '12px', alignItems: 'center' },
  likeBtn: { background: '#2b3139', border: 'none', borderRadius: '6px', color: '#848e9c', padding: '5px 12px', fontSize: '13px', cursor: 'pointer' },
  commentCount: { color: '#848e9c', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' },
  modal: { background: '#1e2329', border: '1px solid #2b3139', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', gap: '12px' },
  modalTitle: { color: '#eaecef', fontSize: '20px', fontWeight: '700', margin: '8px 0 4px 0' },
  modalMeta: { color: '#474d57', fontSize: '13px' },
  modalContent: { color: '#848e9c', fontSize: '15px', lineHeight: '1.8', marginBottom: '16px', padding: '16px', background: '#161a1e', borderRadius: '8px' },
  modalLike: { marginBottom: '20px' },
  commentsSection: { borderTop: '1px solid #2b3139', paddingTop: '20px' },
  commentsTitle: { color: '#eaecef', fontSize: '16px', fontWeight: '600', marginBottom: '16px' },
  comment: { display: 'flex', gap: '10px', marginBottom: '14px' },
  commentAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#2b3139', color: '#f0b90b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0 },
  commentBody: { flex: 1, background: '#161a1e', borderRadius: '8px', padding: '10px 14px' },
  commentAuthor: { color: '#f0b90b', fontSize: '13px', fontWeight: '600', marginBottom: '4px' },
  commentText: { color: '#848e9c', fontSize: '14px', lineHeight: '1.5' },
  commentTime: { color: '#474d57', fontSize: '11px', marginTop: '4px' },
  addComment: { display: 'flex', gap: '8px', marginTop: '16px' },
  commentInput: { flex: 1, background: '#0b0e11', border: '1px solid #2b3139', borderRadius: '8px', color: '#eaecef', padding: '10px 14px', fontSize: '14px', outline: 'none' },
};