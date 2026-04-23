import { useState, useEffect } from 'react'
import { db } from './lib/supabase'
import { CATS, QUAD, EMPTY_FORM, getQuad, agendaGroups } from './constants'
import Card from './components/Card'

const S = {
  wrap:    { padding: 16, maxWidth: 720, margin: "0 auto" },
  hdr:     { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  h1:      { fontSize: 20, fontWeight: 600, color: "#111" },
  tabs:    { display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" },
  tab:     a => ({ padding: "6px 14px", borderRadius: 20, border: "1px solid #ddd", background: a ? "#111" : "transparent", color: a ? "#fff" : "#666", cursor: "pointer", fontSize: 13 }),
  btn:     { padding: "8px 18px", borderRadius: 8, border: "none", background: "#111", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  out:     { padding: "6px 12px", borderRadius: 8, border: "1px solid #ddd", background: "transparent", color: "#666", cursor: "pointer", fontSize: 12 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 },
  modal:   { background: "#fff", borderRadius: 16, boxShadow: "0 8px 40px rgba(0,0,0,0.18)", padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto" },
  inp:     { width: "100%", padding: "9px 11px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#111", fontSize: 14, marginBottom: 10, outline: "none" },
  lbl:     { fontSize: 13, color: "#666", display: "block", marginBottom: 4 },
  badge:   q => { const qd = QUAD.find(x => x.key === q) || QUAD[3]; return { fontSize: 11, padding: "2px 8px", borderRadius: 20, background: qd.bg, color: qd.color, fontWeight: 500 }; },
}

export default function App() {
  const [tasks,     setTasks]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [view,      setView]      = useState("lista")
  const [showForm,  setShowForm]  = useState(false)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [newSub,    setNewSub]    = useState("")
  const [filterCat, setFilterCat] = useState("Todas")
  const [editId,    setEditId]    = useState(null)
  const [expanded,  setExpanded]  = useState({})

  useEffect(() => {
    load()
    const sub = db.channel("t")
      .on("postgres_changes", { event: "*", schema: "public", table: "tareas" }, load)
      .subscribe()
    return () => sub.unsubscribe()
  }, [])

  async function load() {
    const { data } = await db.from("tareas").select("*").order("created_at")
    if (data) setTasks(data)
    setLoading(false)
  }

  function openNew() { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); setNewSub("") }
  function openEdit(t) {
    setForm({ title: t.title, category: t.category, deadline: t.deadline || "", important: t.important, urgent: t.urgent, subtasks: [...t.subtasks] })
    setEditId(t.id); setShowForm(true); setNewSub("")
  }
  function addSub() {
    if (!newSub.trim()) return
    setForm(f => ({ ...f, subtasks: [...f.subtasks, { text: newSub.trim(), done: false }] }))
    setNewSub("")
  }
  function removeSub(i) { setForm(f => ({ ...f, subtasks: f.subtasks.filter((_, j) => j !== i) })) }

  async function submit() {
    if (!form.title.trim()) return
    const p = { title: form.title, category: form.category, deadline: form.deadline || null, important: form.important, urgent: form.urgent, subtasks: form.subtasks, quad: getQuad(form.important, form.urgent), done: false }
    if (editId) await db.from("tareas").update(p).eq("id", editId)
    else        await db.from("tareas").insert(p)
    await load()
    setShowForm(false)
  }

  async function toggleDone(id) {
    const t = tasks.find(x => x.id === id)
    await db.from("tareas").update({ done: !t.done }).eq("id", id)
    await load()
  }
  async function toggleSub(tid, si) {
    const t = tasks.find(x => x.id === tid)
    const subs = t.subtasks.map((s, i) => i === si ? { ...s, done: !s.done } : s)
    await db.from("tareas").update({ subtasks: subs }).eq("id", tid)
    await load()
  }
  async function del(id) {
    await db.from("tareas").delete().eq("id", id)
    await load()
  }
  function toggleExp(id) { setExpanded(e => ({ ...e, [id]: !e[id] })) }

  const filtered = filterCat === "Todas" ? tasks : tasks.filter(t => t.category === filterCat)
  const pending  = filtered.filter(t => !t.done)
  const done     = filtered.filter(t => t.done)

  const cardProps = { onToggleDone: toggleDone, onToggleSub: toggleSub, onEdit: openEdit, onDelete: del, onToggleExp: toggleExp }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "#888", fontSize: 14 }}>
      Cargando...
    </div>
  )

  return (
    <div style={S.wrap}>
      <div style={S.hdr}>
        <h1 style={S.h1}>Mis tareas</h1>
        <button style={S.btn} onClick={openNew}>+ Nueva tarea</button>
      </div>

      <div style={S.tabs}>
        {["Lista", "Agenda", "Matriz"].map(v => (
          <button key={v} style={S.tab(view === v.toLowerCase())} onClick={() => setView(v.toLowerCase())}>{v}</button>
        ))}
        <div style={{ flex: 1 }} />
        <select style={{ ...S.out, padding: "6px 10px" }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          {["Todas", ...CATS].map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {view === "agenda" && (
        <>
          {agendaGroups(filtered).length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>No hay tareas pendientes.</div>}
          {agendaGroups(filtered).map(g => (
            <div key={g.key} style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: g.color }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: g.color }}>{g.label}</span>
                <div style={{ flex: 1, height: 1, background: "#eee" }} />
                <span style={{ fontSize: 12, color: "#aaa" }}>{g.tasks.length} tarea{g.tasks.length !== 1 ? "s" : ""}</span>
              </div>
              {g.tasks.map(t => <Card key={t.id} task={t} expanded={expanded[t.id]} {...cardProps} />)}
            </div>
          ))}
        </>
      )}

      {view === "lista" && (
        <>
          {pending.length === 0 && done.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", fontSize: 14 }}>No hay tareas. ¡Crea una!</div>}
          {pending.map(t => <Card key={t.id} task={t} expanded={expanded[t.id]} {...cardProps} />)}
          {done.length > 0 && (
            <>
              <div style={{ fontSize: 12, color: "#aaa", margin: "16px 0 8px", fontWeight: 500 }}>COMPLETADAS ({done.length})</div>
              {done.map(t => <Card key={t.id} task={t} expanded={expanded[t.id]} {...cardProps} />)}
            </>
          )}
        </>
      )}

      {view === "matriz" && (
        <>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>Matriz de Eisenhower — tareas pendientes</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {QUAD.map(q => {
              const qt = tasks.filter(t => t.quad === q.key && !t.done && (filterCat === "Todas" || t.category === filterCat))
              return (
                <div key={q.key} style={{ background: q.bg, borderRadius: 8, padding: 12, minHeight: 80, border: `1px solid ${q.color}33` }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: q.color, marginBottom: 6 }}>{q.label}</div>
                  {qt.length === 0 && <div style={{ fontSize: 12, color: q.color + "99" }}>Sin tareas</div>}
                  {qt.map(t => (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5, background: "#fff", border: `1px solid ${q.color}55`, borderRadius: 6, padding: "5px 8px" }}>
                      <div style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${q.color}`, flexShrink: 0, cursor: "pointer" }} onClick={() => toggleDone(t.id)} />
                      <span style={{ fontSize: 13, color: "#222", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                      {t.deadline && <span style={{ fontSize: 10, color: q.color, flexShrink: 0 }}>{t.deadline.slice(5)}</span>}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </>
      )}

      {showForm && (
        <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div style={S.modal}>
            <h2 style={{ margin: "0 0 16px", fontWeight: 600, fontSize: 16, color: "#111" }}>{editId ? "Editar tarea" : "Nueva tarea"}</h2>

            <label style={S.lbl}>Título</label>
            <input style={S.inp} value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Nombre de la tarea"
              onKeyDown={e => { if (e.key === "Enter") submit() }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={S.lbl}>Categoría</label>
                <select style={{ ...S.inp, marginBottom: 0 }} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={S.lbl}>Fecha límite</label>
                <input type="date" style={{ ...S.inp, marginBottom: 0 }} value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: "flex", gap: 20, margin: "14px 0" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: "#111" }}>
                <input type="checkbox" checked={form.important} onChange={e => setForm(f => ({ ...f, important: e.target.checked }))} />
                Importante
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer", color: "#111" }}>
                <input type="checkbox" checked={form.urgent} onChange={e => setForm(f => ({ ...f, urgent: e.target.checked }))} />
                Urgente
              </label>
            </div>

            {(form.important || form.urgent) && (
              <div style={{ ...S.badge(getQuad(form.important, form.urgent)), display: "inline-block", marginBottom: 12 }}>
                {QUAD.find(x => x.key === getQuad(form.important, form.urgent))?.label}
              </div>
            )}

            <label style={S.lbl}>Subtareas</label>
            {form.subtasks.map((sub, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ flex: 1, fontSize: 13, color: "#111" }}>{sub.text}</span>
                <button style={{ ...S.out, color: "#E24B4A", padding: "2px 8px" }} onClick={() => removeSub(i)}>✕</button>
              </div>
            ))}

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <input style={{ ...S.inp, marginBottom: 0, flex: 1 }} value={newSub}
                onChange={e => setNewSub(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addSub() }}
                placeholder="Añadir subtarea..." />
              <button style={S.out} onClick={addSub}>+</button>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button style={S.out} onClick={() => setShowForm(false)}>Cancelar</button>
              <button style={S.btn} onClick={submit}>{editId ? "Guardar cambios" : "Crear tarea"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
