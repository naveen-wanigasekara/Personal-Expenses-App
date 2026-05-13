import { useState, useEffect } from "react";
import { X, Edit2, Trash2, ArrowDown, ArrowUp, Plus } from "lucide-react";
import CategoryFormModal from "./CategoryFormModal.jsx";

export default function CategoriesModal({ userCats, onClose, onAdd, onEdit, onDelete }) {
  const [tab, setTab] = useState("expense");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  const [editingCat, setEditingCat] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const cats = tab === "expense" ? userCats.expense : userCats.income;

  return (
    <div className="backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-hd">
          <h2>Categories</h2>
          <button className="close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="mode-toggle" style={{ marginBottom: 12 }}>
          <div className={`mode-slider ${tab === "expense" ? "left" : "right"}`} />
          <button className={tab === "expense" ? "active" : ""} onClick={() => setTab("expense")}>
            <ArrowDown size={13} strokeWidth={2.5} /> Expense
          </button>
          <button className={tab === "income" ? "active" : ""} onClick={() => setTab("income")}>
            <ArrowUp size={13} strokeWidth={2.5} /> Income
          </button>
        </div>

        <div className="manage-cat-list">
          {cats.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.id} className="manage-cat-row">
                <div className="manage-cat-icon" style={{ background: `${c.color}26`, color: c.color }}>
                  <Icon size={16} strokeWidth={2} />
                </div>
                <span className="manage-cat-label">{c.label}</span>
                <button className="manage-cat-btn" onClick={() => setEditingCat({ ...c, type: tab })} aria-label="Edit">
                  <Edit2 size={14} />
                </button>
                <button className="manage-cat-btn danger" onClick={() => onDelete(tab, c.id)} aria-label="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        <button className="save-btn" style={{ marginTop: 8 }} onClick={() => setShowAdd(true)}>
          <Plus size={15} /> Add category
        </button>

        <div style={{ height: 16 }} />

        {editingCat && (
          <CategoryFormModal
            editing={editingCat}
            initialType={tab}
            onClose={() => setEditingCat(null)}
            onSave={(type, updated) => { onEdit(type, editingCat.id, updated); setEditingCat(null); }}
          />
        )}

        {showAdd && (
          <CategoryFormModal
            initialType={tab}
            onClose={() => setShowAdd(false)}
            onSave={(type, cat) => { onAdd(type, cat); setShowAdd(false); }}
          />
        )}
      </div>
    </div>
  );
}
