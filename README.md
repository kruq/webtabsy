# Webtabsy

A personal medication tracking PWA. Lets you keep a list of medicines,
configure dose schedules (time of day, interval in days, optional end date),
record purchases, and see what's overdue or coming up over the next week.
The UI is in Polish.

This is the frontend. The backend lives in the sibling `webtabsyapi`
repository — a .NET Web API backed by Azure Cosmos DB.

## Stack

- React 18 + TypeScript, bootstrapped with Create React App (`react-scripts` 5)
- React Bootstrap for UI primitives, Bootstrap 5 for styling
- `moment` for date formatting, `lodash` for grouping helpers
- Native `fetch` for HTTP — no axios
- Service worker via Workbox (Create React App's PWA template)
- Deployed to Azure Static Web Apps (see `.github/workflows`)

## Project structure

```
src/
  App.tsx                     thin orchestrator: header, tabs, footer nav
  app/                        top-level views and data hooks
    AppHeader.tsx             header (logo, version, sync indicator)
    BottomNav.tsx             fixed bottom navigation (3 tabs)
    OverdueDosesView.tsx      "Status" tab: overdue dose groups
    OverdueDoseCard.tsx       single overdue dose card with skip/confirm
    MedicineListView.tsx      "Lista leków" tab: search, filter, list
    AddMedicineDialog.tsx     dialog used by the medicine list
    doseActions.ts            pure helper for skip/confirm dose actions
    useMedicines.ts           hook owning fetch/add/update/delete state
    useSyncTimer.ts           hook driving periodic background refresh
  medicine/                   the medicine card and its sub-pieces
    MedicineCard.tsx          per-medicine card (collapsed + expanded)
    EditableField.tsx         label + pencil + inline edit pattern
    DoseDialog.tsx, DoseList.tsx
    PurchaseDialog.tsx, PurchaseList.tsx
  schedule.component.tsx      "Grafik" tab: 6-day forward schedule
  hooks/
    useDebouncedCallback.ts   per-instance debounced callback (one timer
                              per hook instance — no cross-field collision)
  utils/
    medicineMath.ts           countAmountInCurrentPackage, countDaysOfStock
    dateFormat.ts             formatDoseTimestamp, formatYmd
  services/
    api.constants.ts          resolves API base URL (see Configuration)
    http.ts                   fetch helpers + ApiError
    mappers.ts                DTO -> domain model mapping
    medicine.service.ts       CRUD for /medicine
    overdueDoses.service.ts   GET /overduedoses/{tzOffsetHours}
  models/                     domain models (Dose, IMedicine, IPurchase, ...)
  constants.ts                shared numeric/string constants
```

## Configuration

The frontend reads its API base URL from `REACT_APP_API_URL`.
If unset, it falls back to `https://localhost:7078` for `NODE_ENV=development`
and to `https://webtabsyapi.azurewebsites.net` for production builds.

Copy `.env.example` to `.env.local` to override locally:

```
REACT_APP_API_URL=https://localhost:7078
```

The displayed app version is read from `package.json` via
`process.env.REACT_APP_VERSION`, which the npm scripts inject from
`$npm_package_version`. Bump the `version` in `package.json` to bump
what's shown in the header.

## Scripts

- `npm start` — dev server at http://localhost:3000.
- `npm run build` — production build into `build/`.
- `npm test` — Jest in interactive watch mode.
- `npm run eject` — Create React App eject (one-way; avoid).

## Notes

### Version env var on Windows

The `start`, `build` and `test` scripts inject `REACT_APP_VERSION=$npm_package_version`
so the header reads the version from `package.json`. The `$npm_package_version`
shell expansion works on bash/zsh (macOS, Linux). On Windows `cmd`, install
[`cross-env`](https://www.npmjs.com/package/cross-env) and prefix the scripts
with `cross-env REACT_APP_VERSION=%npm_package_version%` — or use Git Bash / WSL.

### Service worker

`src/service-worker.ts` is a stock CRA Workbox service worker. It also has
a periodic notification hook that calls into `src/actions.ts`, which is why
those files are kept around even though the main UI no longer uses them.

## Further reading

- [Create React App docs](https://facebook.github.io/create-react-app/docs/getting-started)
- [React docs](https://react.dev/)
