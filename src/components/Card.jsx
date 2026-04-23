import { QUAD, CAT_COLORS } from '../constants'

const S = {
  card: { background: "#fff", border: "1px solid #eee", borderRadius: 12, padding: "12px 14px", marginBottom: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  out:  { padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "transparent", color: "#666", cursor: "pointer", fontSize: 12 },
  pill: cat => ({ display: "inline-block", fontSize: 11, padding: "2px 8px", borderRadius: 20, background: CAT_COLORS[cat] + "22", color: CAT_COLORS[cat], fontWeight: 500 }),
  badge: q => { const qd = QUAD.find(x => x.key === q) || QUAD[3]; return { fontSize: 11, padding: "2px 8px", borderRadius: 20, background: qd.bg, color: qd.color, fontWeight: 500 }; },
  chk: d => ({ width: 18, height: 18, borderRadius: 9, border: `2px solid ${d ? "#1D9E75" : "#ccc"}`, background: d ? "#1D9E75" : "transparent", cursor: "pointer", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }),
}

export default function Card({ task, expanded, onToggleDone, onToggleSub, onEdit, onDelete, onToggleExp }) {
  const sd = task.subtasks.filter(s => s.done).length

  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={S.chk(task.done)} onClick={() => onToggleDone(task.id)}>
          {task.done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 700 }}>✓</span>}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: task.done ? "#aaa" : "#111", textDecoration: task.done ? "line-through" : "none" }}>
              {task.title}
            </span>
            <span style={S.pill(task.category)}>{task.category}</span>
            <span style={S.badge(task.quad)}>{QUAD.find(x => x.key === task.quad)?.label}</span>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: 12, color: "#888", flexWrap: "wrap" }}>
            {task.deadline && <span>Límite: {task.deadline}</span>}
            {task.subtasks.length > 0 && (
              <span style={{ cursor: "pointer" }} onClick={() => onToggleExp(task.id)}>
                Subtareas {sd}/{task.subtasks.length} {expanded ? "▲" : "▼"}
              </span>
            )}
          </div>

          {expanded && task.subtasks.map((sub, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", borderTop: "1px solid #f0f0f0", marginTop: 4 }}>
              <div style={S.chk(sub.done)} onClick={() => onToggleSub(task.id, i)}>
                {sub.done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{ fontSize: 13, color: sub.done ? "#aaa" : "#111", textDecoration: sub.done ? "line-through" : "none" }}>
                {sub.text}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button style={S.out} onClick={() => onEdit(task)}>Editar</button>
          <button style={{ ...S.out, color: "#E24B4A" }} onClick={() => onDelete(task.id)}>✕</button>
        </div>
      </div>
    </div>
  )
}
