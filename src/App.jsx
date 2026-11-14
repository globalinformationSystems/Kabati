import { useMemo, useState } from 'react';

const initialWorkloads = [
  { id: 'web', name: 'storefront', image: 'nginx:1.27', namespace: 'production', replicas: 3, status: 'Running', kind: 'Deployment' },
  { id: 'api', name: 'catalog-api', image: 'node:22-alpine', namespace: 'production', replicas: 2, status: 'Running', kind: 'Deployment' },
  { id: 'worker', name: 'queue-worker', image: 'python:3.12-slim', namespace: 'jobs', replicas: 1, status: 'Pending', kind: 'Deployment' }
];

const templates = [
  { title: 'Nginx web app', category: 'Web', image: 'nginx:1.27', replicas: 2, description: 'A lightweight web server with two replicas.' },
  { title: 'Node.js API', category: 'API', image: 'node:22-alpine', replicas: 2, description: 'Starter workload for a containerized Node.js API.' },
  { title: 'Python worker', category: 'Jobs', image: 'python:3.12-slim', replicas: 1, description: 'A small Python worker workload.' },
  { title: 'Redis cache', category: 'Data', image: 'redis:7-alpine', replicas: 1, description: 'A sample Redis deployment for development.' }
];

const safeName = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'my-app';

function makeManifest({ name, image, namespace, replicas }) {
  const appName = safeName(name);
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
  namespace: ${namespace}
  labels:
    app: ${appName}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
        - name: ${appName}
          image: ${image}
          ports:
            - containerPort: 80
`;
}

export default function App() {
  const [page, setPage] = useState('Sandbox');
  const [workloads, setWorkloads] = useState(initialWorkloads);
  const [selectedId, setSelectedId] = useState('web');
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState('');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState({ name: '', image: 'nginx:1.27', namespace: 'default', replicas: 2 });
  const [copied, setCopied] = useState(false);

  const selected = useMemo(
    () => workloads.find((item) => item.id === selectedId) || workloads[0],
    [workloads, selectedId]
  );

  const manifest = useMemo(() => (selected ? makeManifest(selected) : ''), [selected]);

  const filteredTemplates = templates.filter((item) =>
    `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(query.toLowerCase())
  );

  function createDeployment(event) {
    event.preventDefault();
    const name = safeName(form.name);
    if (!name || !form.image.trim()) return;

    const deployment = {
      ...form,
      name,
      image: form.image.trim(),
      replicas: Number(form.replicas),
      id: `${name}-${Date.now()}`,
      status: 'Ready',
      kind: 'Deployment'
    };

    setWorkloads((current) => [deployment, ...current]);
    setSelectedId(deployment.id);
    setShowForm(false);
    setPage('Sandbox');
    setNotice(`Deployment manifest for “${name}” created in this sandbox.`);
    setForm({ name: '', image: 'nginx:1.27', namespace: 'default', replicas: 2 });
  }

  function addTemplate(template) {
    const deployment = {
      id: `${safeName(template.title)}-${Date.now()}`,
      name: safeName(template.title),
      image: template.image,
      namespace: 'default',
      replicas: template.replicas,
      status: 'Ready',
      kind: 'Deployment'
    };

    setWorkloads((current) => [deployment, ...current]);
    setSelectedId(deployment.id);
    setPage('Sandbox');
    setNotice(`“${template.title}” added to the sandbox as a draft manifest.`);
  }

  async function copyManifest() {
    try {
      await navigator.clipboard.writeText(manifest);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setNotice('Clipboard access is unavailable. Copy the YAML manually.');
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setPage('Sandbox'); }}>
          <span className="brand-icon">k</span>
          <span>
            <b>kabati</b>
            <small>CLUSTER WORKSPACE</small>
          </span>
        </a>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="navigation" aria-label="Main navigation">
          <button className={page === 'Sandbox' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('Sandbox')}>
            <span>◈</span> Sandbox <kbd>⌘ 1</kbd>
          </button>
          <button className={page === 'Warehouse' ? 'nav-link active' : 'nav-link'} onClick={() => setPage('Warehouse')}>
            <span>▤</span> Warehouse <kbd>⌘ 2</kbd>
          </button>
        </nav>

        <div className="sidebar-spacer" />

        <div className="cluster-card">
          <div className="cluster-top"><span className="pulse" /> <b>Sandbox cluster</b></div>
          <p>Local preview · no live cluster connected</p>
          <div className="cluster-foot"><span>DEVELOPMENT</span><span>● Offline</span></div>
        </div>

        <div className="profile">
          <div className="avatar">K</div>
          <div>
            <b>Kabati workspace</b>
            <small>Starter plan</small>
          </div>
          <span className="dots">···</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <b>{page}</b></div>
          <div className="top-actions">
            <span className="environment"><i /> Demo environment</span>
            <button className="icon-button" aria-label="Notifications">♧<sup /></button>
            <div className="avatar small-avatar">K</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="page-heading">
            <div>
              <div className="eyebrow">KUBERNETES WORKSPACE <span className="live-dot" /> SANDBOX</div>
              <h1>{page === 'Sandbox' ? 'Build with confidence.' : 'Your deployment warehouse.'}</h1>
              <p>
                {page === 'Sandbox'
                  ? 'Explore workloads and shape your next deployment in a safe, local preview.'
                  : 'Reusable starter configurations, ready to add to your sandbox.'}
              </p>
            </div>

            <div className="heading-buttons">
              <button className="button secondary" onClick={() => setNotice('Export your selected YAML from the manifest preview.')}>↗ <span>Export</span></button>
              <button className="button primary" onClick={() => setShowForm(true)}>＋ <span>Create deployment</span></button>
            </div>
          </section>

          {notice && (
            <div className="notice" role="status">
              <span>✓</span>
              {notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss">×</button>
            </div>
          )}

          {page === 'Sandbox' ? (
            <>
              <section className="stats-grid" aria-label="Sandbox summary">
                <article className="stat-card">
                  <div className="stat-top"><span>WORKLOADS</span><span className="stat-icon blue">◈</span></div>
                  <strong>{workloads.length.toString().padStart(2, '0')}</strong>
                  <small><b className="positive">+1</b> in this session</small>
                  <div className="sparkline blue-line"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>

                <article className="stat-card">
                  <div className="stat-top"><span>DESIRED PODS</span><span className="stat-icon violet">▦</span></div>
                  <strong>{workloads.reduce((sum, item) => sum + Number(item.replicas), 0).toString().padStart(2, '0')}</strong>
                  <small>Across all deployments</small>
                  <div className="sparkline purple-line"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>

                <article className="stat-card">
                  <div className="stat-top"><span>NAMESPACES</span><span className="stat-icon orange">▧</span></div>
                  <strong>{new Set(workloads.map((item) => item.namespace)).size.toString().padStart(2, '0')}</strong>
                  <small>Organized environments</small>
                  <div className="sparkline orange-line"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>

                <article className="stat-card">
                  <div className="stat-top"><span>MANIFESTS</span><span className="stat-icon green">⌘</span></div>
                  <strong>{workloads.length.toString().padStart(2, '0')}</strong>
                  <small><span className="status-indicator" /> Ready to review</small>
                  <div className="sparkline green-line"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
                </article>
              </section>

              <section className="workload-section">
                <div className="section-header">
                  <div>
                    <span className="section-kicker">SANDBOX</span>
                    <h2>Workloads <span className="count-badge">{workloads.length}</span></h2>
                  </div>
                  <button className="button outline" onClick={() => setShowForm(true)}>＋ New deployment</button>
                </div>

                <div className="workload-layout">
                  <div className="workload-list">
                    <div className="list-toolbar">
                      <span>NAME <small>↕</small></span>
                      <span>STATUS</span>
                      <span>NAMESPACE</span>
                      <span>REPLICAS</span>
                    </div>

                    {workloads.map((item) => (
                      <button
                        key={item.id}
                        className={selectedId === item.id ? 'workload-row selected' : 'workload-row'}
                        onClick={() => setSelectedId(item.id)}
                      >
                        <span className="workload-name">
                          <span className="workload-glyph">▣</span>
                          <span>
                            <b>{item.name}</b>
                            <small>{item.kind} · {item.image}</small>
                          </span>
                        </span>
                        <span className={`badge ${item.status.toLowerCase()}`}><i />{item.status}</span>
                        <span className="namespace">{item.namespace}</span>
                        <span className="replicas">{item.replicas}/{item.replicas} <small>⌘</small></span>
                      </button>
                    ))}

                    <button className="add-row" onClick={() => setShowForm(true)}>＋ Add a deployment</button>
                  </div>

                  {selected && (
                    <aside className="manifest-panel">
                      <div className="manifest-title">
                        <div>
                          <span className="section-kicker">MANIFEST PREVIEW</span>
                          <h3>{selected.name}</h3>
                        </div>
                        <button className="icon-button more" aria-label="More options">···</button>
                      </div>

                      <div className="manifest-meta">
                        <span className="badge ready"><i />{selected.status}</span>
                        <span>{selected.namespace}</span>
                        <span>{selected.replicas} replicas</span>
                      </div>

                      <div className="code-toolbar">
                        <span><i /> YAML</span>
                        <button onClick={copyManifest}>{copied ? '✓ Copied' : '▢ Copy'}</button>
                      </div>

                      <pre className="code-block"><code>{manifest}</code></pre>

                      <div className="preview-note">
                        <span>ⓘ</span>
                        <p>This is a preview only. No cluster is connected, so nothing has been applied.</p>
                      </div>
                    </aside>
                  )}
                </div>
              </section>

              <section className="bottom-note">
                <span className="note-icon">✳</span>
                <div>
                  <b>Safe by design</b>
                  <p>Kabati previews deployment manifests locally. Connect a cluster integration later to apply resources.</p>
                </div>
                <button onClick={() => setPage('Warehouse')}>Explore templates <span>→</span></button>
              </section>
            </>
          ) : (
            <section className="warehouse-section">
              <div className="warehouse-toolbar">
                <div>
                  <span className="section-kicker">STARTER COLLECTION</span>
                  <h2>Templates <span className="count-badge">{filteredTemplates.length}</span></h2>
                </div>
                <label className="search-box">
                  <span>⌕</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search templates..." />
                </label>
              </div>

              <div className="template-grid">
                {filteredTemplates.map((template) => (
                  <article className="template-card" key={template.title}>
                    <div className="template-top">
                      <span className="template-icon">{template.category === 'Data' ? '◉' : template.category === 'Jobs' ? '⌘' : '▣'}</span>
                      <span className="template-category">{template.category}</span>
                    </div>
                    <h3>{template.title}</h3>
                    <p>{template.description}</p>
                    <div className="template-details">
                      <span>▣ {template.image}</span>
                      <span>↗ {template.replicas} replicas</span>
                    </div>
                    <button className="button outline full" onClick={() => addTemplate(template)}>＋ Add to sandbox</button>
                  </article>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="empty-state">No templates match “{query}”. Try another search.</div>
              )}
            </section>
          )}
        </div>
      </main>

      {showForm && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <div className="modal-heading">
              <div>
                <span className="section-kicker">SANDBOX BUILDER</span>
                <h2 id="create-title">Create deployment</h2>
                <p>Configure a draft workload and preview its Kubernetes manifest.</p>
              </div>
              <button className="icon-button" onClick={() => setShowForm(false)} aria-label="Close">×</button>
            </div>

            <form onSubmit={createDeployment}>
              <label>
                Deployment name
                <input required minLength="2" maxLength="50" pattern="[a-zA-Z0-9][a-zA-Z0-9-]*" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. payments-api" />
                <small>Use letters, numbers, and hyphens.</small>
              </label>

              <label>
                Container image
                <input required value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="e.g. nginx:1.27" />
              </label>

              <div className="form-row">
                <label>
                  Namespace
                  <input required value={form.namespace} onChange={(event) => setForm({ ...form, namespace: event.target.value })} placeholder="default" />
                </label>

                <label>
                  Replicas
                  <input type="number" required min="1" max="20" value={form.replicas} onChange={(event) => setForm({ ...form, replicas: event.target.value })} />
                </label>
              </div>

              <div className="form-preview">
                <span>MANIFEST SUMMARY</span>
                <code>{form.replicas} replicas · {form.image || 'container image'} · {form.namespace || 'default'}</code>
              </div>

              <div className="modal-actions">
                <button type="button" className="button secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="button primary">Create draft</button>
              </div>

              <p className="form-disclaimer">Creates a local preview only; it does not deploy to a Kubernetes cluster.</p>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}