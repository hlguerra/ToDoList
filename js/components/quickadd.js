function QuickAddModal({ user, onClose, onCreated }) {
  const [lists, setLists] = React.useState([]);
  const [loadingLists, setLoadingLists] = React.useState(true);
  const [listId, setListId] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    async function load() {
      const result = await window.APP.firebase.getAccessibleLists(user.uid);
      setLists(result);
      if (result.length > 0) setListId(result[0].id);
      setLoadingLists(false);
    }
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !listId) return;
    setSaving(true);
    setError('');
    try {
      await window.APP.firebase.createTask(listId, user.uid, { title: title.trim(), dueDate: dueDate || null });
      onCreated && onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <h2>Quick add task</h2>
        {loadingLists ? (
          <p className="loading-text">Loading lists…</p>
        ) : lists.length === 0 ? (
          <p className="empty-text">You need a list first — create one from the Lists tab.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="modal-label">List</label>
            <select value={listId} onChange={e => setListId(e.target.value)}>
              {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
            <label className="modal-label">Task</label>
            <input
              type="text"
              placeholder="What do you need to do?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
              required
            />
            <label className="modal-label">Due date (optional)</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            {error && <p className="error-text">{error}</p>}
            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" disabled={saving}>{saving ? 'Adding…' : 'Add task'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}