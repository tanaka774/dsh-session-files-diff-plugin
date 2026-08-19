// DSH Session Files & Diffs — dynamic Cordis plugin client payload.
//
// This file is the exact `code.client` value for `cordis_define`:
// a plain-JavaScript function body that returns the browser-half Cordis Plugin.
// Do not add imports, JSX, or TypeScript — the dynamic evaluator provides
// `ctx`, `React`, `styles`, `console` and the injected `slots`/`sessions` services.

const CSS = `
.fd-view { height: 100%; display: flex; flex-direction: column; min-height: 0; }
.fd-scroll { flex: 1 1 auto; min-height: 0; overflow: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 6px; }
.fd-summary { color: var(--dsw-alias-label-secondary); font-size: 12px; margin: 2px 4px 6px; }
.fd-empty { color: var(--dsw-alias-label-secondary); font-size: 13px; padding: 24px 4px; }
.fd-older { align-self: flex-start; margin: 2px 4px 6px; padding: 4px 10px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: inherit; font-size: 12px; cursor: pointer; }
.fd-older:disabled { opacity: 0.6; cursor: default; }
.fd-toggle { align-self: flex-start; display: inline-flex; gap: 2px; margin: 2px 4px 6px; padding: 2px; border: 1px solid var(--dsw-alias-border-l1); border-radius: 6px; background: var(--dsw-alias-bg-layer-1); }
.fd-toggle button { border: none; background: none; color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; padding: 3px 10px; border-radius: 4px; cursor: pointer; }
.fd-toggle button.fd-toggle-active { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.fd-section-user { display: flex; flex-direction: column; align-items: stretch; gap: 4px; width: 100%; padding: 8px 10px; border: 1px solid color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent); border-radius: 8px; background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, var(--dsw-alias-bg-layer-1)); color: var(--dsw-alias-label-primary); font: inherit; font-size: 13px; text-align: left; cursor: pointer; }
.fd-section-user:hover { border-color: var(--dsw-alias-brand-primary); }
.fd-section-user-row { display: flex; align-items: center; gap: 8px; }
.fd-section-user-chevron { flex: none; width: 1em; color: var(--dsw-alias-label-secondary); transition: transform 0.15s ease; }
.fd-section-user.fd-section-open .fd-section-user-chevron { transform: rotate(90deg); }
.fd-section-user-text { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500; }
.fd-section-user-count { flex: none; color: var(--dsw-alias-label-secondary); font-size: 12px; }
.fd-section-user-files { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; color: var(--dsw-alias-label-secondary); }
.fd-section-user.fd-section-closed { background: color-mix(in srgb, var(--dsw-alias-brand-primary) 6%, var(--dsw-alias-bg-layer-2)); }
.fd-section-user.fd-section-closed .fd-section-user-text { color: var(--dsw-alias-label-secondary); font-weight: 400; }
.fd-change { display: flex; align-items: baseline; gap: 8px; width: 100%; padding: 6px 8px; border: none; border-radius: 6px; background: none; color: var(--dsw-alias-label-primary); font: inherit; text-align: left; cursor: pointer; }
.fd-change:hover { background: var(--dsw-alias-bg-layer-2); }
.fd-change-index { flex: none; min-width: 3ch; color: var(--dsw-alias-label-secondary); font-size: 12px; text-align: right; }
.fd-change-path { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 13px; }
.fd-hunk { border: 1px solid var(--dsw-alias-border-l1); border-radius: 8px; background: var(--dsw-alias-bg-layer-1); overflow: hidden; }
.fd-line { display: flex; gap: 10px; padding: 0 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.7; }
.fd-sign { flex: none; width: 1ch; color: var(--dsw-alias-label-secondary); user-select: none; }
.fd-text { white-space: pre; overflow-wrap: anywhere; }
.fd-line-add { background: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent); }
.fd-line-del { background: color-mix(in srgb, var(--dsw-alias-state-error-primary) 12%, transparent); }
.fd-line-add .fd-sign { color: var(--dsw-alias-state-success-primary); }
.fd-line-del .fd-sign { color: var(--dsw-alias-state-error-primary); }
/* The dynamic Guard pins non-chain registrations at the lowest priority tier, so the
   Files tab sorts leftmost in the view ring. Reorder the tablist visually with flex
   order, scoped to the semantic tablist/tab roles, so the dynamic tab renders last. */
[role='tablist'] { display: flex; }
[role='tablist'] > [role='tab']:nth-child(1) { order: 3; }
[role='tablist'] > [role='tab']:nth-child(2) { order: 1; }
[role='tablist'] > [role='tab']:nth-child(3) { order: 2; }
`

let viewMode = 'session'

return {
  inject: ['slots', 'sessions'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    const isFileDiff = (d) => d !== null && typeof d === 'object' && typeof d.path === 'string' && typeof d.newText === 'string'

    const relativize = (path, cwd) => {
      if (cwd === undefined || cwd === '') return path
      const root = cwd.replace(/[/\\]+$/, '')
      if (path.startsWith(`${root}/`) || path.startsWith(`${root}\\`)) return path.slice(root.length + 1)
      return path
    }

    const extractHunks = (node) => {
      if (node.kind !== 'tool-result' || node.isError) return null
      const meta = node.meta
      if (meta !== null && typeof meta === 'object' && Array.isArray(meta.diffs)) {
        const diffs = meta.diffs.filter(isFileDiff)
        if (diffs.length > 0) return diffs
      }
      const result = node.resultView
      if (result !== null && result.card === 'diff' && Array.isArray(result.diffs)) {
        const diffs = result.diffs.filter(isFileDiff)
        if (diffs.length > 0) return diffs
      }
      const call = node.callView
      if (call !== null && call.card === 'diff' && Array.isArray(call.diffs)) {
        return call.diffs.filter(isFileDiff)
      }
      return null
    }

    const userText = (node) => {
      let text = ''
      for (const block of node.content) {
        if (block !== null && typeof block === 'object' && block.type === 'text' && typeof block.text === 'string') {
          text += (text === '' ? '' : ' ') + block.text
        }
      }
      const trimmed = text.trim()
      return trimmed.length > 160 ? `${trimmed.slice(0, 160)}…` : trimmed
    }

    const buildSections = (nodes, cwd) => {
      const sections = []
      let current = null
      for (const node of nodes) {
        if (node.kind === 'user') {
          current = { user: userText(node), changes: [] }
          sections.push(current)
          continue
        }
        const diffs = extractHunks(node)
        if (diffs === null) continue
        if (current === null) {
          current = { user: null, changes: [] }
          sections.push(current)
        }
        for (const d of diffs) current.changes.push({ path: relativize(d.path, cwd), oldText: d.oldText, newText: d.newText })
      }
      return sections
    }

    const buildGroups = (nodes, cwd) => {
      const groups = []
      const byPath = new Map()
      for (const node of nodes) {
        const diffs = extractHunks(node)
        if (diffs === null) continue
        for (const d of diffs) {
          const path = relativize(d.path, cwd)
          let group = byPath.get(path)
          if (group === undefined) {
            group = { path, hunks: [] }
            byPath.set(path, group)
            groups.push(group)
          }
          group.hunks.push({ oldText: d.oldText, newText: d.newText })
        }
      }
      return groups
    }

    const splitLines = (text) => {
      const body = text.endsWith('\n') ? text.slice(0, -1) : text
      return body === '' ? [] : body.split('\n')
    }

    const hunkLines = (oldText, newText) => {
      const oldLines = oldText === null ? [] : splitLines(oldText)
      const newLines = splitLines(newText)
      let start = 0
      while (start < oldLines.length && start < newLines.length && oldLines[start] === newLines[start]) start += 1
      let oldEnd = oldLines.length
      let newEnd = newLines.length
      while (oldEnd > start && newEnd > start && oldLines[oldEnd - 1] === newLines[newEnd - 1]) { oldEnd -= 1; newEnd -= 1 }
      const out = []
      for (let i = 0; i < start; i += 1) out.push({ kind: 'ctx', text: oldLines[i] })
      for (let i = start; i < oldEnd; i += 1) out.push({ kind: 'del', text: oldLines[i] })
      for (let i = start; i < newEnd; i += 1) out.push({ kind: 'add', text: newLines[i] })
      for (let i = oldEnd; i < oldLines.length; i += 1) out.push({ kind: 'ctx', text: oldLines[i] })
      return out
    }

    const Hunk = ({ hunk }) => {
      const lines = hunkLines(hunk.oldText, hunk.newText)
      const rows = lines.map((line, index) => React.createElement('div', { key: index, className: `fd-line fd-line-${line.kind}` },
        React.createElement('span', { className: 'fd-sign' }, line.kind === 'add' ? '+' : line.kind === 'del' ? '-' : ' '),
        React.createElement('span', { className: 'fd-text' }, line.text)))
      return React.createElement('div', { className: 'fd-hunk' }, ...rows)
    }

    const ChangeEntry = ({ entry, index }) => {
      const [open, setOpen] = React.useState(true)
      const header = React.createElement('button', { type: 'button', className: 'fd-change', onClick: () => setOpen(!open) },
        React.createElement('span', { className: 'fd-change-index' }, `#${index + 1}`),
        React.createElement('span', { className: 'fd-change-path' }, entry.path))
      if (!open) return header
      return React.createElement(React.Fragment, null, header, React.createElement(Hunk, { hunk: entry }))
    }

    const FileGroup = ({ group }) => {
      const [open, setOpen] = React.useState(true)
      const count = group.hunks.length
      const header = React.createElement('button', { type: 'button', className: 'fd-change', onClick: () => setOpen(!open) },
        React.createElement('span', { className: 'fd-change-path' }, group.path),
        React.createElement('span', { className: 'fd-change-index' }, `${count} change${count === 1 ? '' : 's'}`))
      if (!open) return header
      return React.createElement(React.Fragment, null, header, ...group.hunks.map((hunk, index) => React.createElement(Hunk, { key: index, hunk })))
    }

    const Section = ({ section, startIndex }) => {
      const [open, setOpen] = React.useState(true)
      const count = section.changes.length
      const uniquePaths = []
      const seen = new Set()
      for (const change of section.changes) {
        if (!seen.has(change.path)) {
          seen.add(change.path)
          uniquePaths.push(change.path)
        }
      }
      if (section.user === null) return React.createElement(React.Fragment, null, ...section.changes.map((change, index) => React.createElement(ChangeEntry, { key: `${startIndex + index}`, entry: change, index: startIndex + index })))
      const header = React.createElement('button', { type: 'button', className: open ? 'fd-section-user fd-section-open' : 'fd-section-user fd-section-closed', onClick: () => setOpen(!open) },
        React.createElement('span', { className: 'fd-section-user-row' },
          React.createElement('span', { className: 'fd-section-user-chevron' }, '▸'),
          React.createElement('span', { className: 'fd-section-user-text' }, section.user),
          React.createElement('span', { className: 'fd-section-user-count' }, `${count} change${count === 1 ? '' : 's'}`)),
        open ? null : React.createElement('span', { className: 'fd-section-user-files' }, uniquePaths.join(' · ')))
      if (!open) return header
      return React.createElement(React.Fragment, null, header, ...section.changes.map((change, index) => React.createElement(ChangeEntry, { key: `${startIndex + index}`, entry: change, index: startIndex + index })))
    }

    const FilesView = ({ useSession, useSessions, sessionId, loadOlder }) => {
      const nodes = useSession((snapshot) => snapshot.nodes)
      const hasMore = useSession((snapshot) => snapshot.hasMore)
      const loadingOlder = useSession((snapshot) => snapshot.loadingOlder)
      const cwd = useSessions((list) => list.byId[sessionId]?.cwd)
      const [mode, setMode] = React.useState(viewMode)
      const pickMode = (next) => { viewMode = next; setMode(next) }
      const sections = React.useMemo(() => buildSections(nodes, cwd), [nodes, cwd])
      const groups = React.useMemo(() => buildGroups(nodes, cwd), [nodes, cwd])
      const changeCount = mode === 'session'
        ? sections.reduce((sum, section) => sum + section.changes.length, 0)
        : groups.reduce((sum, group) => sum + group.hunks.length, 0)
      const fileCount = mode === 'session'
        ? new Set(sections.flatMap((section) => section.changes.map((change) => change.path))).size
        : groups.length

      const body = []
      if (hasMore) body.push(React.createElement('button', { key: 'older', type: 'button', className: 'fd-older', disabled: loadingOlder, onClick: () => { loadOlder() } }, loadingOlder ? 'Loading older history…' : 'Load older history'))
      body.push(React.createElement('div', { key: 'toggle', className: 'fd-toggle' },
        React.createElement('button', { type: 'button', className: mode === 'session' ? 'fd-toggle-active' : '', onClick: () => pickMode('session') }, 'Session'),
        React.createElement('button', { type: 'button', className: mode === 'file' ? 'fd-toggle-active' : '', onClick: () => pickMode('file') }, 'File')))
      if (changeCount === 0) {
        body.push(React.createElement('div', { key: 'empty', className: 'fd-empty' }, 'No file changes in this session.'))
      } else {
        body.push(React.createElement('div', { key: 'summary', className: 'fd-summary' }, `${changeCount} change${changeCount === 1 ? '' : 's'} across ${fileCount} file${fileCount === 1 ? '' : 's'}`))
        if (mode === 'session') {
          let number = 0
          for (const section of sections) {
            if (section.changes.length === 0) continue
            body.push(React.createElement(Section, { key: `s-${number}`, section, startIndex: number }))
            number += section.changes.length
          }
        } else {
          for (const group of groups) body.push(React.createElement(FileGroup, { key: group.path, group }))
        }
      }
      return React.createElement('div', { className: 'fd-view' },
        React.createElement('div', { className: 'fd-scroll' }, ...body))
    }

    ctx.effect(() => styles.insert(CSS))

    slots.inject('conversation.view', () => slots.register({
      name: 'conversation.view',
      id: 'files',
      order: 20,
      label: () => 'Files',
      inject: (sessionId) => {
        const session = ctx.sessions.binding(sessionId)?.session
        if (session === undefined) throw new Error(`files view: session "${sessionId}" is unavailable`)
        return {
          loadOlder: () => session.loadOlder(),
        }
      },
    }, FilesView))
  },
}
