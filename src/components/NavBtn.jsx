export default function NavBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      className={`nav-btn ${active ? "active" : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
    >
      <Icon size={18} strokeWidth={active ? 2.5 : 2} />
      <span>{label}</span>
    </button>
  );
}
