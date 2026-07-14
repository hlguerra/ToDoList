function SignInScreen() {
  const [email, setEmail] = React.useState('');
  const [status, setStatus] = React.useState('idle');
  const [errorMsg, setErrorMsg] = React.useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('sending');
    try {
      await window.APP.firebase.sendMagicLink(email);
      setStatus('sent');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="auth-card">
        <h1>Check your email</h1>
        <p>We sent a sign-in link to <strong>{email}</strong>. Open it on this device to finish signing in.</p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1>ToDoList</h1>
      <p>Enter your email to get a sign-in link — no password needed.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send sign-in link'}
        </button>
      </form>
      {status === 'error' && <p className="error-text">{errorMsg}</p>}
    </div>
  );
}

function MainApp({ user, onSignOut }) {
  const [activeTab, setActiveTab] = React.useState('home');
  const [openList, setOpenList] = React.useState(null);
  const [showQuickAdd, setShowQuickAdd] = React.useState(false);
  return (
    <div className="app-shell">
      <header className="app-header">
        <span>{user.email}</span>
        <button className="link-btn" onClick={onSignOut}>Sign out</button>
      </header>
      <main className="app-main">
        {activeTab === 'home' && <HomeScreen user={user} />}
        {activeTab === 'lists' && !openList && <ListsScreen user={user} onOpenList={setOpenList} />}
        {activeTab === 'lists' && openList && (
          <SingleListView list={openList} user={user} onBack={() => setOpenList(null)} />
        )}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setOpenList(null); }} onAddClick={() => setShowQuickAdd(true)} />
      {showQuickAdd && (
        <QuickAddModal
          user={user}
          onClose={() => setShowQuickAdd(false)}
          onCreated={() => window.location.reload()}
        />
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = React.useState(null);
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    async function init() {
      if (window.APP.firebase.isMagicLinkUrl()) {
        await window.APP.firebase.completeMagicLinkSignIn();
      }
      window.APP.firebase.watchAuthState(u => { setUser(u); setChecking(false); });
    }
    init();
  }, []);

  if (checking) return <div className="centered-screen"><div className="auth-card"><p>Loading…</p></div></div>;

  return user
    ? <MainApp user={user} onSignOut={() => window.APP.firebase.logOut()} />
    : <div className="centered-screen"><SignInScreen /></div>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);