const ICONS = {
  home: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>,
  briefcase: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>,
  cart: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><circle cx="9" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2 3h2l2.4 12.4a2 2 0 002 1.6h9.2a2 2 0 002-1.6L21 7H6" /></svg>,
  heart: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 21s-7-4.5-9.5-9A5.5 5.5 0 0112 5a5.5 5.5 0 019.5 7c-2.5 4.5-9.5 9-9.5 9z" /></svg>,
  star: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" /></svg>,
  book: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M4 4h9a3 3 0 013 3v13H7a3 3 0 01-3-3V4z" /><path d="M20 4v13" /></svg>,
};
const ICON_KEYS = Object.keys(ICONS);
const COLOR_PRESETS = ['#2B5D5A', '#E0713D', '#7A5471', '#B98E3D', '#3B6EA5', '#8A4A4A'];

function AddListForm({ onCreate, onCancel }) {
  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState(COLOR_PRESETS[0]);
  const [icon, setIcon] = React.useState(ICON_KEYS[0]);
  const [saving, setSaving] = React.useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    await onCreate({ name: name.trim(), color, icon });
    setSaving(false);
  }

  return (
    <form className="list-form" onSubmit={handleSubmit}>
      <input type="text" placeholder="List name" value={name} onChange={e => setName(e.target.value)} required />
      <div className="picker-row">
        {COLOR_PRESETS.map(c => (
          <button type="button" key={c} className={c === color ? 'swatch selected' : 'swatch'} style={{ background: c }} onClick={() => setColor(c)} />
        ))}
      </div>
      <div className="picker-row">
        {ICON_KEYS.map(key => {
          const Icon = ICONS[key];
          return (
            <button type="button" key={key} className={key === icon ? 'icon-btn selected' : 'icon-btn'} onClick={() => setIcon(key)}>
              <Icon width={20} height={20} />
            </button>
          );
        })}
      </div>
      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create list'}</button>
      </div>
    </form>
  );
}

function ListsScreen({ user, onOpenList }) {
  const [lists, setLists] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);

  async function loadLists() {
    setLoading(true);
    const result = await window.APP.firebase.getAccessibleLists(user.uid);
    setLists(result);
    setLoading(false);
  }

  React.useEffect(() => { loadLists(); }, []);

  async function handleCreate(data) {
    await window.APP.firebase.createList(user.uid, data);
    setShowForm(false);
    await loadLists();
  }

  if (loading) return <p className="loading-text">Loading lists…</p>;

  return (
    <div className="lists-screen">
      <div className="lists-header">
        <h2>Your Lists</h2>
        <button className="btn-add-list" onClick={() => setShowForm(true)}>+ New list</button>
      </div>
      {showForm && <AddListForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />}
      {lists.length === 0 && !showForm && <p className="empty-text">No lists yet. Create your first one to get started.</p>}
      <div className="list-grid">
        {lists.map(list => {
          const Icon = ICONS[list.icon] || ICONS.home;
          return (
            <button key={list.id} className="list-tile" onClick={() => onOpenList(list)}>
              <span className="list-tile-icon" style={{ color: list.color }}><Icon width={26} height={26} /></span>
              <span className="list-tile-name">{list.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}