# DSH Session Files & Diffs plugin

A per-session **Files** view tab for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web UI. It shows every file change made in a session, as unified diffs, in two switchable modes:

- **Timeline** — chronological change entries grouped under the user chat message that prompted them (collapsible, light-blue header cards; collapsed headers still list the affected file paths).
- **File** — one cumulative diff per file (base → final) when the file was created in this session; pre-existing files fall back to the per-change hunk list, because the session log only carries context hunks, not the file's prior full content. Created files are marked `new file`.

Diffs come from the session's own persisted tool-result metadata (the same hunks the inline write/edit cards render), so the view works after page reloads and replays. Paths are shown relative to the session workspace.

It is a **UI-only plugin**: it reads the session's conversation snapshot and renders it. No host code, no file writes, no network, no approval prompts beyond the one-time browser authorization of the plugin itself.

## Install

The plugin is delivered as a *dynamic Cordis plugin*: an LLM agent running in a DSH session reads this repo and installs it for you. No npm, no build, no profile edits.

1. Open any session on your DSH harness.
2. Send your agent this instruction (or your own equivalent):

   > Read `plugin-client.js` in this repo, then install it on this DSH harness as a dynamic Cordis plugin: call `cordis_define` with `plugin.kind: "new"`, `idPrefix: "fdiff"`, a short name and purpose, and `code.client` set to the exact contents of `plugin-client.js`. Then call `cordis_run` with the returned pluginId/packageId (mode `run`) and wait for the browser approval.

3. Approve the plugin activation prompt in the UI (single check mark is enough).
4. Open any session and pick the **Files** tab in the header — it renders rightmost, after Chat and Trajectory.

That's it. To update, repeat with a newer `plugin-client.js` and `cordis_define` with `plugin.kind: "existing"` + the current pluginId, then `cordis_run` (mode `update`).

## Caveats

- **Session-local**: a dynamic plugin lives only in the current harness process and session. After a harness restart it is gone; re-run the two install steps to restore it. For permanent distribution, port the code into a real `dsh.client` web-module package (profile `dsh.profile.bundles` + `node_modules`) — the code is written so that port is mechanical, and a shipped package can drop the CSS hack below.
- **Tab-order CSS hack**: dynamic plugins are pinned by the harness at the lowest slot-priority tier, so the Files tab would render leftmost in the view ring. `plugin-client.js` therefore ships a small stylesheet rule that visually reorders the header tablist via flex `order` (scoped to `[role="tablist"]`/`[role="tab"]`). If a future harness version changes the header markup, the rule stops matching and the tab simply returns to leftmost — harmless, but worth knowing.
- **API coupling**: the plugin targets the harness APIs as of `@deepseek-ai/dsh` `0.1.0-rc.7` (`conversation.view` slot, `useSession`/`useSessions` standard props, `ToolResultNode.meta.diffs`). If a harness update changes these, the installing agent can repair the code from the runtime errors.

## License

[MIT](LICENSE) — Copyright (c) 2026 tanaka. You may use, copy, modify, and redistribute this plugin (and its derivatives) under the terms of the MIT license; see `LICENSE` for details.

## Files

- `plugin-client.js` — the complete `code.client` payload (a plain-JS Cordis plugin body). This is the only file the install step needs.
- `README.md` — this file.
- `LICENSE` — the MIT license under which this plugin is distributed.
