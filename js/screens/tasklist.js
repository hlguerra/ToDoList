function TaskRow({ task, onToggle, onDelete }) {
  return (
    <div className={task.done ? 'task-row done' : 'task-row'}>
      <input type="checkbox" checked={task.done} onChange={() => onToggle(task)} />
      <div className="task-row-body">
        <div className="task-row-title">{task.title}</div>
        {task.notes && <div className="task-row-notes">{task.notes}</div>}
        <div className="task-row-meta-line">
          {task.dueDate && <span className="task-row-due">{task.dueDate}</span>}
          {task.recurrence && <span className="recur-badge">↻ {task.recurrence}</span>}
        </div>
      </div>
      <button className="task-row-delete" onClick={() => onDelete(task)}>✕</button>
    </div>
  );
}

function AddTaskForm({ onCreate }) {
  const [title, setTitle] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [recurrence, setRecurrence] = React.useState('');
  const [expanded, setExpanded] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;
    if (recurrence && !dueDate) {
      setError('Recurring tasks need a due date.');
      return;
    }
    setError('');
    setSaving(true);
    await onCreate({ title: title.trim(), dueDate: dueDate || null, notes: notes.trim(), recurrence: recurrence || null });
    setTitle(''); setDueDate(''); setNotes(''); setRecurrence(''); setExpanded(false);
    setSaving(false);
  }

  return (
    <form className="add-task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Add a task…"
        value={title}
        onChange={e => setTitle(e.target.value)}
        onFocus={() => setExpanded(true)}
      />
      {expanded && (
        <div className="add-task-extra">
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
          <input type="text" placeholder="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          <select value={recurrence} onChange={e => setRecurrence(e.target.value)}>
            <option value="">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      )}
      {error && <p className="error-text">{error}</p>}
      <button type="submit" disabled={saving || !title.trim()}>{saving ? 'Adding…' : 'Add'}</button>
    </form>
  );
}

function SingleListView({ list, user, onBack }) {
  const [tasks, setTasks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  async function loadTasks() {
    setLoading(true);
    const result = await window.APP.firebase.getTasksForList(list.id);
    setTasks(result);
    setLoading(false);
  }

  React.useEffect(() => { loadTasks(); }, [list.id]);

  async function handleCreate(data) {
    await window.APP.firebase.createTask(list.id, user.uid, data);
    await loadTasks();
  }

  async function handleToggle(task) {
    await window.APP.firebase.toggleTaskDone(task, !task.done);
    await loadTasks(); // reload so a spawned next-occurrence task appears
  }

  async function handleDelete(task) {
    await window.APP.firebase.deleteTask(task.id);
    setTasks(tasks.filter(t => t.id !== task.id));
  }

  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);

  return (
    <div className="lists-screen">
      <button className="link-btn" onClick={onBack}>← Back to lists</button>
      <h2 style={{ color: list.color }}>{list.name}</h2>
      <AddTaskForm onCreate={handleCreate} />
      {loading ? (
        <p className="loading-text">Loading tasks…</p>
      ) : (
        <>
          {pending.length === 0 && completed.length === 0 && (
            <p className="empty-text">No tasks yet — add your first one above.</p>
          )}
          {pending.map(t => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
          {completed.length > 0 && (
            <>
              <div className="group-label">Completed</div>
              {completed.map(t => <TaskRow key={t.id} task={t} onToggle={handleToggle} onDelete={handleDelete} />)}
            </>
          )}
        </>
      )}
    </div>
  );
}