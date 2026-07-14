function BottomNav({ activeTab, onTabChange, onAddClick }) {
  return (
    <nav className="bottom-nav">
      <button className={activeTab === 'home' ? 'nav-btn active' : 'nav-btn'} onClick={() => onTabChange('home')}>Home</button>
      <button className="nav-fab" onClick={onAddClick}>+</button>
      <button className={activeTab === 'lists' ? 'nav-btn active' : 'nav-btn'} onClick={() => onTabChange('lists')}>Lists</button>
    </nav>
  );
}