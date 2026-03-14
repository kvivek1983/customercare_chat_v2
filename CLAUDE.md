# Customer Care Chat V2

OnewayCab customer care chat application — an Angular-based admin panel for managing customer support conversations, DCO (Driver-Cum-Owner) management, and real-time chat.

## Tech Stack

- **Framework:** Angular 18 (standalone components, SCSS styles)
- **UI Library:** CoreUI 5 for Angular + Bootstrap 5
- **Charts:** @swimlane/ngx-charts, Chart.js via @coreui/angular-chartjs
- **Real-time:** socket.io-client
- **Utilities:** date-fns, lodash-es, RxJS
- **Testing:** Jasmine + Karma (unit), Playwright (e2e)
- **Production Server:** Express.js (server.js) serving the Angular SPA
- **Deployment:** Nixpacks (Node 20, npm 9)

## Commands

```bash
npm run dev        # Start dev server with auto-open (ng serve -o)
npm run build      # Production build (ng build)
npm start          # Start production Express server (node server.js)
npm test           # Run unit tests (ng test / Karma)
npm run test:e2e   # Run e2e tests (Playwright)
```

## Project Structure

```
src/app/
├── views/base/          # Main feature views
│   ├── conversations/   # Chat conversations UI
│   ├── chat-number-list/ # Chat number listing
│   ├── dashboard/       # Main dashboard
│   ├── dco-info/        # DCO details panel
│   ├── dco-active-approved-view/
│   ├── dco-pending-view/
│   ├── dco-suspend-view/
│   └── show-booking-details-by-id/
├── service/             # API & shared services
│   ├── chat.service.ts           # Chat/socket operations
│   ├── oneway-node.service.ts    # Node server API (DCO auth)
│   ├── oneway-web-api.service.ts # Main web API
│   ├── oneway-partner-enrol-api.service.ts
│   ├── py-smart-chat.service.ts  # Python smart chat API
│   └── shared.service.ts         # Shared state/utilities
├── models/              # TypeScript interfaces
│   ├── chat.model.ts
│   └── chat-config.model.ts
├── interceptors/        # HTTP interceptors
├── pipes/               # Custom pipes
├── layout/              # App layout (header, sidebar, etc.)
├── components/          # Shared/reusable components
└── auth.guard.ts        # Route guard for authentication
```

## Workflow

After solving any issue or completing a new requirement, follow this order strictly:

1. **Solve** the issue / implement the requirement
   - If the issue requires backend changes, **discuss it with the user first** and get permission before modifying the backend project (`Smart_chat_v2`)
2. **Run locally** — start the dev server (`npm run dev`) and verify that the specific issue/requirement you just worked on is actually working correctly
3. **Run Playwright e2e tests** (`npm run test:e2e`) — only proceed if all tests pass
4. **Ask permission** to commit & push
5. **Commit & push** after user approves
6. **Deploy to Vercel** (`vercel --prod`) — ask permission before deploying
7. **Verify on production** — run Playwright e2e tests against `https://customercarechatv2.vercel.app` AND manually verify that the specific issue/requirement is working correctly on production

**Vercel Production URL:** https://customercarechatv2.vercel.app

## Key Conventions

- Components use **standalone** Angular component pattern (no NgModules)
- Styling uses **SCSS**
- Routing is file-based under `views/base/routes.ts`
- Production output goes to `dist/coreui-free-angular-admin-template/browser/`
- Port defaults to `4200` (configurable via `PORT` env var)
