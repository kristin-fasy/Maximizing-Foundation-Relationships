// @ts-nocheck

'use client';

import React, { useEffect, useMemo, useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 10);
const STORAGE_KEY = "foundation-checklist-v1";

const QUARTERS = [
  { key: "Q1", label: "Q1 (Due Jan 31)", due: "January 31" },
  { key: "Q2", label: "Q2 (Due Apr 30)", due: "April 30" },
  { key: "Q3", label: "Q3 (Due Jul 31)", due: "July 31" },
  { key: "Q4", label: "Q4 (Due Oct 31)", due: "October 31" },
];

function currentQuarter() {
  const m = new Date().getMonth() + 1;
  if (m <= 3) return "Q1";
  if (m <= 6) return "Q2";
  if (m <= 9) return "Q3";
  return "Q4";
}

function templateTasks() {
  return [
    {
      id: uid(),
      title: "Quarterly Tasks (Due: Jul 31, Oct 31, Jan 31, Apr 30)",
      note: "Complete these by each quarter’s deadline. Use the quarter selector above to focus.",
      items: [
        { id: uid(), title: "Review Foundation Website", items: [
          { id: uid(), title: "Webinars / grantee events", items: [] },
          { id: uid(), title: "New initiatives", items: [] },
          { id: uid(), title: "Leadership changes", items: [] },
          { id: uid(), title: "Open calls for proposals", items: [] },
          { id: uid(), title: "Recent blog posts", items: [] },
        ]},
        { id: uid(), title: "Set Google Alerts (one-time; verify quarterly)", items: [
          { id: uid(), title: "\"[Foundation Name]\" in the news", items: [] },
          { id: uid(), title: "\"[Program officer’s name]\" mentions", items: [] },
          { id: uid(), title: "\"[Foundation Name]\" + RFP / grant opportunity", items: [] },
        ]},
        { id: uid(), title: "Board / Leadership Mapping (Jul–Sept 2025)", items: [
          { id: uid(), title: "Any overlapping connections between our board/leadership and theirs?", items: [] },
          { id: uid(), title: "Can our board help build or deepen the connection?", items: [] },
        ]},
        { id: uid(), title: "Review 990s (annually in July)", items: [
          { id: uid(), title: "Identify funded orgs + levels (ProPublica / Candid)", items: [] },
          { id: uid(), title: "Spot trends: new grantees, categories, multiyear commitments", items: [] },
          { id: uid(), title: "Compare our grant size vs peers", items: [] },
          { id: uid(), title: "Confirm our funding aligns with top priorities", items: [] },
        ]},
        { id: uid(), title: "Record Insights in Tracker (optional)", items: [] },
        { id: uid(), title: "Quarterly Review Questions", items: [
          { id: uid(), title: "Are we cultivating the right people (program officer + above)?", items: [] },
          { id: uid(), title: "Are we aligned with evolving priorities? How do we know?", items: [] },
          { id: uid(), title: "Have we maximized funding? If yes, what’s next?", items: [] },
        ]},
      ],
    },
    {
      id: uid(),
      title: "Growth & Expansion (Biannual / Annual)",
      note: "Focus on relationships leading up to deadlines and yearly health checks.",
      items: [
        { id: uid(), title: "Pre-Application Meetings", items: [
          { id: uid(), title: "Schedule 15-min check-ins before application deadlines", items: [] },
        ]},
        { id: uid(), title: "Partnership Review Meeting (1×/year)", items: [
          { id: uid(), title: "Schedule 30–60 min relationship health check", items: [] },
          { id: uid(), title: "How are we doing as a grantee?", items: [] },
          { id: uid(), title: "What’s changing at your foundation this year?", items: [] },
          { id: uid(), title: "How can we be a better partner?", items: [] },
          { id: uid(), title: "Additional funding options or ways to engage?", items: [] },
          { id: uid(), title: "Other foundations in youth/child welfare to approach?", items: [] },
        ]},
      ],
    },
    {
      id: uid(),
      title: "Extras (Stewardship & Relationship Building)",
      note: "Layer these in quarterly; they compound over time.",
      items: [
        { id: uid(), title: "Impact Updates (beyond the grant report)", items: [
          { id: uid(), title: "Custom PDF/video tied to their giving", items: [] },
          { id: uid(), title: "Short stories/quotes from those served", items: [] },
          { id: uid(), title: "‘Looking ahead’ section for continued/increased support", items: [] },
        ]},
        { id: uid(), title: "Quarterly Email Updates", items: [
          { id: uid(), title: "1–2 paragraphs with a strong image", items: [] },
        ]},
        { id: uid(), title: "Acknowledge Foundation Staff Milestones", items: [
          { id: uid(), title: "Birthdays / promotions / publications", items: [] },
          { id: uid(), title: "Explore automation (e.g., birthday emails from Ann)", items: [] },
        ]},
        { id: uid(), title: "Informal Check-Ins", items: [
          { id: uid(), title: "Thank-you calls / casual updates", items: [] },
        ]},
        { id: uid(), title: "One Surprise Per Quarter", items: [
          { id: uid(), title: "Handwritten note", items: [] },
          { id: uid(), title: "Short beneficiary video", items: [] },
          { id: uid(), title: "Relevant article or research brief", items: [] },
          { id: uid(), title: "Quick personal phone call", items: [] },
        ]},
      ],
    },
  ];
}

type TaskNode = { id: string; title: string; items: TaskNode[] };
type Section = { id: string; title: string; note?: string; items: TaskNode[] };

function load() { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; } }
function save(state: any) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {} }

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-gray-200">
      <div className="h-2 rounded-full bg-gray-800 transition-all" style={{ width: `${Math.round(value * 100)}%` }} />
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v:boolean)=>void; label: React.ReactNode }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <input type="checkbox" className="mt-1 h-5 w-5 rounded border-gray-300" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="leading-snug">{label}</span>
    </label>
  );
}

function getNodeState(id: string, state: any) { return state.checks[id] || false; }

function TaskNodeView({ node, state, setState, depth, filter, query } : any) {
  const checked = getNodeState(node.id, state);
  const kids = state.children[node.id] || [];

  const matchesQuery = (text: string) => !query || text.toLowerCase().includes(query.toLowerCase());
  const visibleByFilter = filter === "all" || (filter === "open" && !checked) || (filter === "done" && checked);
  const visibleByQuery = matchesQuery(node.title);

  const setNodeState = (id: string, checked: boolean, state: any, setState: any) => {
    const next = { ...state, checks: { ...state.checks, [id]: checked } };
    const descendants = new Set<string>();
    const stack = [id];
    while (stack.length) {
      const nid = stack.pop()!;
      const kids = state.children[nid] || [];
      for (const k of kids) { descendants.add(k); stack.push(k); }
    }
    for (const did of descendants) (next.checks as any)[did] = checked;
    setState(next);
  };

  const childViews = kids.map((kid: string) => (
    <TaskNodeView key={kid} node={state.nodeMap[kid]} state={state} setState={setState} depth={depth + 1} filter={filter} query={query} />
  ));
  const anyChildVisible = childViews.some((v: any) => !!v);
  const isVisible = (visibleByFilter && visibleByQuery) || anyChildVisible;
  if (!isVisible) return null;

  return (
    <div className={"space-y-2" + (depth ? " mt-2" : "") }>
      <div className="flex items-start gap-2">
        <div style={{ width: depth * 16 }} />
        <Checkbox checked={checked} onChange={(val) => setNodeState(node.id, val, state, setState)} label={<span className={checked ? "line-through text-gray-500" : ""}>{node.title}</span>} />
      </div>
      {kids.length > 0 && <div className="ml-8 space-y-2">{childViews}</div>}
    </div>
  );
}

function countSection(section: Section, state: any) {
  let total = 0, done = 0;
  const walk = (node: TaskNode) => {
    const checked = getNodeState(node.id, state);
    total += 1; if (checked) done += 1;
    const kids = state.children[node.id] || [];
    for (const k of kids) walk(state.nodeMap[k]);
  };
  for (const node of section.items) walk(node as any);
  return { done, total };
}

function buildIndex(sections: Section[]) {
  const nodeMap: Record<string, TaskNode> = {};
  const children: Record<string, string[]> = {};
  const pathMap: Record<string, string[]> = {};
  const walk = (node: TaskNode, path: string[] = []) => {
    nodeMap[node.id] = node; pathMap[node.id] = path;
    const ids = (children[node.id] = []);
    for (const child of node.items || []) { ids.push(child.id); walk(child, [...path, node.id]); }
  };
  for (const sec of sections) for (const node of sec.items) walk(node);
  return { nodeMap, children, pathMap };
}

function initialFoundation(name = "Example Foundation") {
  const sections = templateTasks();
  const index = buildIndex(sections as any);
  return { id: uid(), name, sections, checks: {} as Record<string, boolean>, ...index, quarter: currentQuarter() };
}

export default function App() {
  const [data, setData] = useState(() => (load() || { foundations: [initialFoundation("Example Foundation")], selectedId: null as string | null, filter: "all", query: "" }));
  const selected = useMemo(() => (data as any).foundations.find((x: any) => x.id === (data as any).selectedId) || (data as any).foundations[0], [data]);
  useEffect(() => save(data), [data]);

  const setSelected = (f: any) => setData((d: any) => ({ ...d, selectedId: f?.id || null }));
  const updateSelected = (updater: (f:any)=>any) => setData((d: any) => ({ ...d, foundations: (d as any).foundations.map((f:any) => (f.id === selected.id ? updater(f) : f)) }));

  const overall = useMemo(() => {
    let total = 0, done = 0;
    for (const sec of selected.sections) { const c = countSection(sec as any, selected); total += c.total; done += c.done; }
    return { total, done, pct: total ? done / total : 0 };
  }, [selected]);

  const addFoundation = () => { const name = prompt("Foundation name?"); if (!name) return; const f = initialFoundation(name); setData((d:any) => ({ ...d, foundations: [...d.foundations, f], selectedId: f.id })); };
  const renameFoundation = () => { const name = prompt("Rename foundation:", selected.name); if (!name) return; updateSelected((f:any) => ({ ...f, name })); };
  const duplicateFoundation = () => {
    const f2 = JSON.parse(JSON.stringify(selected)); f2.id = uid(); f2.name = selected.name + " (Copy)";
    const retitle = (sec:any) => { const regen = (n:any) => { n.id = uid(); n.items.forEach(regen); }; sec.items.forEach(regen); };
    f2.sections = f2.sections.map((s:any) => ({ ...s })); f2.sections.forEach(retitle);
    const index = buildIndex(f2.sections); f2.nodeMap = index.nodeMap; f2.children = index.children; f2.pathMap = index.pathMap; f2.checks = {};
    setData((d:any) => ({ ...d, foundations: [...d.foundations, f2], selectedId: f2.id }));
  };
  const deleteFoundation = () => {
    if (!confirm(`Delete "${selected.name}"? This cannot be undone.`)) return;
    setData((d:any) => { const rest = d.foundations.filter((f:any) => f.id !== selected.id);
      return { ...d, foundations: rest.length ? rest : [initialFoundation("New Foundation")], selectedId: rest[0]?.id || null }; });
  };
  const resetChecks = () => { if (!confirm("Reset all checkboxes for this foundation?")) return; updateSelected((f:any) => ({ ...f, checks: {} })); };
  const exportJSON = () => { const payload = JSON.stringify(selected, null, 2); const blob = new Blob([payload], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${selected.name.replace(/\s+/g, "-").toLowerCase()}-checklist.json`; a.click(); URL.revokeObjectURL(url); };
  const importJSON = (file: File) => { const reader = new FileReader(); reader.onload = () => { try { const parsed = JSON.parse(String(reader.result)); if (!parsed.sections || !Array.isArray(parsed.sections)) throw new Error("Bad file");
        const index = buildIndex(parsed.sections); const merged = { ...parsed, ...index, checks: parsed.checks || {} }; setData((d:any) => ({ ...d, foundations: d.foundations.map((f:any) => (f.id === selected.id ? merged : f)) })); } catch { alert("Invalid JSON file."); } }; reader.readAsText(file); };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Foundation Funding — Interactive Checklist</h1>
            <p className="text-sm text-gray-600 mt-1">Add a foundation, select a quarter, and check items off. Data saves in your browser.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={addFoundation} className="px-3 py-2 rounded-2xl bg-gray-900 text-white shadow">+ Foundation</button>
            <button onClick={duplicateFoundation} className="px-3 py-2 rounded-2xl bg-white border shadow-sm">Duplicate</button>
            <button onClick={renameFoundation} className="px-3 py-2 rounded-2xl bg-white border shadow-sm">Rename</button>
            <button onClick={deleteFoundation} className="px-3 py-2 rounded-2xl bg-white border shadow-sm">Delete</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="rounded-2xl p-4 bg-white shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Selected foundation</div>
            <select className="w-full rounded-xl border-gray-300" value={selected.id} onChange={(e) => setSelected((data as any).foundations.find((f:any) => f.id === e.target.value))}>
              {(data as any).foundations.map((f:any) => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
            <div className="mt-3 text-sm">Overall progress</div>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1"><ProgressBar value={overall.pct} /></div>
              <div className="text-sm tabular-nums w-20 text-right">{overall.done}/{overall.total}</div>
            </div>
          </div>

          <div className="rounded-2xl p-4 bg-white shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-1">Quarter focus</div>
            <div className="flex flex-wrap gap-2">
              {QUARTERS.map((q) => (
                <button key={q.key} onClick={() => updateSelected((f:any) => ({ ...f, quarter: q.key }))}
                  className={`px-3 py-2 rounded-2xl border shadow-sm ${selected.quarter === q.key ? "bg-gray-900 text-white" : "bg-white"}`} title={`Due ${q.due}`}>{q.label}</button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">Current Due Date: <span className="font-medium">{QUARTERS.find((q) => q.key === selected.quarter)?.due}</span></p>
            <div className="mt-3 flex gap-2"><button onClick={resetChecks} className="px-3 py-2 rounded-2xl bg-white border shadow-sm">Reset Quarter</button></div>
          </div>

          <div className="rounded-2xl p-4 bg-white shadow-sm border border-gray-200">
            <div className="text-sm text-gray-500 mb-2">Search & Filter</div>
            <input className="w-full rounded-xl border-gray-300" placeholder="Search tasks…" value={(data as any).query} onChange={(e) => setData((d:any) => ({ ...d, query: e.target.value }))} />
            <div className="mt-3 flex flex-wrap gap-2">
              {[ { k: "all", label: "All" }, { k: "open", label: "Open" }, { k: "done", label: "Done" } ].map((f:any) => (
                <button key={f.k} onClick={() => setData((d:any) => ({ ...d, filter: f.k }))}
                  className={`px-3 py-2 rounded-2xl border shadow-sm ${ (data as any).filter === f.k ? "bg-gray-900 text-white" : "bg-white" }`}>{f.label}</button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={exportJSON} className="px-3 py-2 rounded-2xl bg-white border shadow-sm">Export JSON</button>
              <label className="px-3 py-2 rounded-2xl bg-white border shadow-sm cursor-pointer">Import JSON
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && e.target.files[0] && importJSON(e.target.files[0])} />
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {selected.sections.map((section: Section) => (
            <SectionCard key={(section as any).id} section={section} state={selected} setState={(next:any) => updateSelected(() => next)} filter={(data as any).filter} query={(data as any).query} />
          ))}
        </div>

        <div className="mt-10 text-xs text-gray-500">
          <p>Tips: Duplicate a foundation to reuse your task structure for similar funders. Export JSON to share progress between devices; Import it to continue.</p>
        </div>
      </div>
    </div>
  );
}

function SectionCard({ section, state, setState, filter, query }: any) {
  const { done, total } = useMemo(() => countSection(section, state), [section, state]);
  const pct = total === 0 ? 0 : done / total;
  return (
    <div className="rounded-2xl p-5 bg-white shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold">{section.title}</h2>
          {section.note && <p className="text-sm text-gray-500 mt-1">{section.note}</p>}
        </div>
        <div className="w-40"><ProgressBar value={pct} /></div>
      </div>
      <div className="space-y-4">
        {section.items.map((node: TaskNode) => (
          <TaskNodeView key={(node as any).id} node={node} state={state} setState={setState} depth={0} filter={filter} query={query} />
        ))}
      </div>
    </div>
  );
}
