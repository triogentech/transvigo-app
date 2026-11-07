# Driver update experience

| Situation | What the driver sees |
|---|---|
| Up to date / nothing configured / Play has no update | nothing |
| Optional update (server says newer **and** Play confirms), no active trip | Bottom sheet "Update available": message, installed vs available version, release notes, **Update now** / **Later** (Later hides that release for 24 h) |
| Mandatory, no active trip | Full-screen "Update required" — installed vs required version, reason, release notes, **Update application**. Not dismissable (Android back disabled). Cancel/failure shows an error and **Retry update** |
| Mandatory, active trip | Amber banner "Update required. Finish your current trip…"; Start Trip buttons disabled; after the trip completes the full-screen gate appears |
| Maintenance | Full-screen "Under maintenance" + **Try again** (or banner during a trip) |
| Offline | Last cached policy (for this versionCode) still applies; fetch failures fail open and retry after 2 min |
| After updating | Toast "Updated to vX.Y.Z"; policy re-fetched for the new code |

Update flow: mandatory → Play **immediate** update when allowed (else flexible, else store listing); optional → Play **flexible**; Play unavailable (sideload, Play missing) → mandatory opens the store listing.
Checks run: launch, after login, every foreground return (15-min throttle), every 30 min while open, and instantly when the API answers 426/503.
