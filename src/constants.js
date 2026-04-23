export const CATS = ["Personal", "Trabajo", "Estudio", "Salud", "Otro"];

export const CAT_COLORS = {
  Personal: "#7F77DD",
  Trabajo:  "#1D9E75",
  Estudio:  "#378ADD",
  Salud:    "#D4537E",
  Otro:     "#888780",
};

export const QUAD = [
  { key: "UI",   label: "Urgente + Importante",       color: "#E24B4A", bg: "#FCEBEB" },
  { key: "NUI",  label: "No urgente + Importante",    color: "#1D9E75", bg: "#E1F5EE" },
  { key: "UNI",  label: "Urgente + No importante",    color: "#BA7517", bg: "#FAEEDA" },
  { key: "NUNI", label: "No urgente + No importante", color: "#888780", bg: "#F1EFE8" },
];

export const EMPTY_FORM = {
  title: "", category: "Personal", deadline: "",
  important: false, urgent: false, subtasks: [],
};

export function getQuad(imp, urg) {
  return imp && urg ? "UI" : imp ? "NUI" : urg ? "UNI" : "NUNI";
}

export function agendaGroups(tasks) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tom   = new Date(today); tom.setDate(today.getDate() + 1);
  const week  = new Date(today); week.setDate(today.getDate() + 7);
  const g = [
    { key: "overdue", label: "Vencidas",     color: "#E24B4A", tasks: [] },
    { key: "today",   label: "Hoy",          color: "#D4537E", tasks: [] },
    { key: "tom",     label: "Mañana",       color: "#BA7517", tasks: [] },
    { key: "week",    label: "Esta semana",  color: "#1D9E75", tasks: [] },
    { key: "later",   label: "Más adelante", color: "#378ADD", tasks: [] },
    { key: "none",    label: "Sin fecha",    color: "#888780", tasks: [] },
  ];
  tasks.filter(t => !t.done).forEach(t => {
    if (!t.deadline) { g[5].tasks.push(t); return; }
    const d = new Date(t.deadline); d.setHours(0, 0, 0, 0);
    if (d < today)                          g[0].tasks.push(t);
    else if (d.getTime() === today.getTime()) g[1].tasks.push(t);
    else if (d.getTime() === tom.getTime())   g[2].tasks.push(t);
    else if (d <= week)                       g[3].tasks.push(t);
    else                                      g[4].tasks.push(t);
  });
  return g.filter(x => x.tasks.length > 0);
}
