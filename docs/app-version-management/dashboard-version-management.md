# Dashboard: App Version Management

Location: **God Mode → Settings** (`/god/settings`, route restricted to `SUPER_ADMIN`; the API additionally rejects writes from any other role). Platform-level, not per tenant — see architecture.md.

Shows: current published version, minimum, enforcement and maintenance state, **last modified time and administrator**.
Edit: latest version + versionCode, minimum version + versionCode, "enforce minimum" switch, update message, release notes (one per line), Play URL, maintenance mode + message.
Validation (mirrors the server, which stays authoritative): semver format, integer codes, minimum ≤ latest, Play-only URL, length limits. Save is disabled while invalid.
A live table previews the outcome for the relevant installed versionCodes (e.g. 12 → No update, 11 → Optional, 9 → Mandatory).
Enabling enforcement/raising the minimum or turning on maintenance requires an explicit confirmation dialog (affects every organisation immediately).
Audit: every save is in **God Mode → Platform Audit Log** as `APP_VERSION_POLICY_UPDATED` with the submitted payload.
Note: a tenant "Operations" user cannot see or call any of this.
