function dateOnly(d) { return d ? d.slice(0, 10) : null; }
function todayStr() { return new Date().toISOString().slice(0, 10); }
function endOfWeekStr() {
  const d = new Date();
  const day = d.getDay();
  const diff = 6 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function matchesDateRange(task, range) {
  const due = dateOnly(task.dueDate);
  if (range === 'all') return true;
  if (!due) return range === 'nodate';
  const today = todayStr();
  const weekEnd = endOfWeekStr();
  if (range === 'today') return due === today;
  if (range === 'week') return due >= today && due <= weekEnd;
  if (range === 'overdue') return due < today;
  return true;
}

function MergedTaskRow({ task, list, onToggle }) {
  const Icon = (list && ICONS[list.icon]) || ICONS.home;
  const color = list ? list.color : '#999';
  return (
    <div className="task-row merged" style={{ borderLeft: `3px solid ${color}` }}>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
      <div className="task-row-body">
        <div className={task.done ? 'task-row-title done' : 'task-row-title'}>{task.title}</div>
        <div className="task-row-meta">
          {task.dueDate && <span className="task-row-due">{task.dueDate}</span>}
          <span className="tag" style={{ background: color }}>
            <Icon width={11} height={11} /> {list ? list.name : '…'}
          </span>
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ user }) {
  const [lists, setLists] = React.useState([]);
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [sortBy, setSortBy] = React.useState('dueDate');
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [dateRange, setDateRange] = React.useState('all');
  const [selectedListIds, setSelectedListIds] = React.useState(null); // null = all

  const listsById = React.useMemo(() => {
    const m = new Map();
    lists.forEach(l => m.set(l.id, l));
    return m;
  }, [lists]);

  async function loadAll() {
    setLoading(true);
    const accessibleLists = await window.APP.firebase.getAccessibleLists(user.uid);
    setLists(accessibleLists);
    const listIds = accessibleLists.map(l => l.id);
    let result = await window.APP.firebase.getMergedTasks(listIds, {
      doneFilter: showCompleted ? null : false,
      sortBy: 'dueDate',
    });
    if (sortBy === 'listName') {
      result = window.APP.firebase.sortTasksByListName(result, accessibleLists);
    }
    setTasks(result);
    setLoading(false);
  }

  React.useEffect(() => { loadAll(); }, [showCompleted, sortBy]);

  async function handleToggle(task) {
    await window.APP.firebase.toggleTaskDone(task, !task.done);
    await loadAll(); // reload so a spawned next-occurrence task appears
  }

  function toggleListFilter(listId) {
    setSelectedListIds(prev => {
      const current = prev || lists.map(l => l.id);
      const set = new Set(current);
      set.has(listId) ? set.delete(listId) : set.add(listId);
      return Array.from(set);
    });
  }

  const visibleTasks = tasks.filter(t => {
    if (selectedListIds && !selectedListIds.includes(t.listId)) return false;
    if (!matchesDateRange(t, dateRange)) return false;
    return true;
  });

  if (loading) return <p className="loading-text">Loading tasks…</p>;

  return (
    <div className="lists-screen">
      <h2>Home</h2>

      <div className="home-controls">
        <div className="control-group">
          <label>Sort</label>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="dueDate">Due date</option>
            <option value="listName">List name</option>
          </select>
        </div>
        <div className="control-group">
          <label>Due</label>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}>
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="week">This week</option>
            <option value="overdue">Overdue</option>
            <option value="nodate">No date</option>
          </select>
        </div>
        <label className="checkbox-inline">
          <input type="checkbox" checked={showCompleted} onChange={e => setShowCompleted(e.target.checked)} />
          Show completed
        </label>
      </div>

      <div className="picker-row list-filter-row">
        {lists.map(l => {
          const active = !selectedListIds || selectedListIds.includes(l.id);
          return (
            <button
              key={l.id}
              className={active ? 'filter-chip active' : 'filter-chip'}
              style={active ? { background: l.color, borderColor: l.color } : {}}
              onClick={() => toggleListFilter(l.id)}
            >
              {l.name}
            </button>
          );
        })}
      </div>

      {visibleTasks.length === 0 && <p className="empty-text">No tasks match these filters.</p>}
      {visibleTasks.map(t => (
        <MergedTaskRow key={t.id} task={t} list={listsById.get(t.listId)} onToggle={handleToggle} />
      ))}
    </div>
  );
}