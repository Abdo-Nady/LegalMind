# LegalMind.ai Frontend

A premium legal document analysis platform built with React, Vite, Tailwind CSS, and shadcn/ui. The design follows the "Trusted Counsel" identity targeting lawyers and legal professionals.

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.19 | Build tool with SWC |
| Tailwind CSS | 3.4.17 | Utility-first styling |
| shadcn/ui | - | Component library (Radix UI primitives) |
| React Query | 5.83.0 | Server state management |
| React Router | 6.30.1 | Client-side routing |
| Axios | 1.13.2 | HTTP client |
| React Hook Form | 7.61.1 | Form handling |
| Zod | 3.25.76 | Schema validation |
| Framer Motion | 12.23.26 | Animations |

---

## Getting Started

### Prerequisites
- Node.js 18+ (recommend using [nvm](https://github.com/nvm-sh/nvm))
- npm or yarn

### Installation

```sh
# Clone the repository
git clone <repository-url>
cd client

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:8000/api` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | - |

### Available Scripts

```sh
npm run dev       # Start dev server (port 5173)
npm run build     # Production build
npm run build:dev # Development build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## Design System

### Color Palette (HSL)

| Token | HSL Value | Hex Approx. | Usage |
|-------|-----------|-------------|-------|
| `--primary` | 213 70% 15% | #1B2B45 | Deep Navy - Headers, navigation, authority |
| `--secondary` | 38 45% 58% | #C5A065 | Metallic Gold - Premium badges, key actions |
| `--background` | 40 33% 98% | #FBF7F0 | Cream White - Backgrounds, clean paper feel |
| `--accent` | 168 76% 40% | #1BB492 | Teal - Success states, links, highlights |
| `--destructive` | 0 72% 51% | #DC2626 | Red - Errors, high-risk indicators |
| `--warning` | 38 92% 50% | #F59E0B | Orange - Medium-risk indicators |
| `--muted` | 40 20% 94% | #F3F0EB | Muted surfaces |

### Typography

| Type | Font Family | Usage |
|------|-------------|-------|
| Headings | `DM Serif Display`, Georgia, serif | Classic legal authority |
| Body | `Inter`, system-ui, sans-serif | Modern readability |

### Theme Support
- Light mode (default)
- Dark mode (CSS class-based via `next-themes`)

### Custom Shadows

| Shadow | Usage |
|--------|-------|
| `shadow-gold` | Gold glow effect for premium elements |
| `shadow-navy` | Navy glow for authority elements |
| `shadow-teal` | Teal glow for accent highlights |
| `shadow-premium` | Subtle elevation for cards |
| `shadow-premium-hover` | Enhanced elevation on hover |

### Custom Animations

| Animation | Effect |
|-----------|--------|
| `animate-fade-in` | Fade in opacity |
| `animate-slide-up` | Slide up with fade |
| `animate-slide-down` | Slide down with fade |
| `animate-scale-in` | Scale up with fade |
| `animate-pulse-soft` | Subtle pulse effect |
| `animate-shimmer` | Shimmer loading effect |

---

## Project Structure

```
src/
├── components/
│   ├── ui/                    # 57 shadcn/ui atomic components
│   ├── layouts/               # Page layout components
│   │   ├── DashboardLayout.jsx
│   │   └── WorkspaceLayout.jsx
│   ├── chat/                  # Chat feature components
│   │   └── ChatPanel.jsx
│   ├── document/              # Document viewer components
│   │   └── PDFViewer.jsx
│   ├── ProtectedRoute.jsx     # Auth guard for protected routes
│   └── PublicRoute.jsx        # Auth guard for public routes
├── pages/                     # Route page components (8 pages)
│   ├── Index.jsx
│   ├── Login.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   ├── Dashboard.jsx
│   ├── DocumentWorkbench.jsx
│   ├── Settings.jsx
│   └── NotFound.jsx
├── contexts/
│   └── AuthContext.jsx        # Global authentication state
├── hooks/
│   ├── useAuth.js             # Auth mutations hook
│   ├── useDocumentPolling.js  # Document status polling
│   └── use-toast.js           # Toast notifications
├── services/
│   ├── auth.service.js        # Authentication API calls
│   └── document.service.js    # Document API calls
├── lib/
│   ├── axios.js               # HTTP client with interceptors
│   ├── api-endpoints.js       # API endpoint constants
│   ├── queryClient.js         # React Query configuration
│   └── utils.js               # Utility functions (cn)
├── App.jsx                    # Root component with routing
├── main.jsx                   # Entry point
└── index.css                  # Design tokens & global styles
```

---

## Pages & Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/` | `Index.jsx` | Marketing landing with interactive prompt | Public |
| `/login` | `Login.jsx` | Login/signup with Google OAuth & guest mode | Public |
| `/forgot-password` | `ForgotPassword.jsx` | Password reset request | Public |
| `/reset-password` | `ResetPassword.jsx` | Password reset confirmation | Public |
| `/dashboard` | `Dashboard.jsx` | Document grid, upload, search | Protected |
| `/document/:id` | `DocumentWorkbench.jsx` | PDF viewer + AI chat split-pane | Protected |
| `/settings` | `Settings.jsx` | User profile and preferences | Protected |
| `*` | `NotFound.jsx` | 404 fallback | Public |

---

## Components

### UI Components (`src/components/ui/`) - 57 Components

#### Core Elements
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `button.jsx` | .jsx | Primary, secondary, ghost, destructive, premium variants |
| `input.jsx` | .jsx | Form inputs with label support |
| `textarea.jsx` | .jsx | Multi-line text input |
| `label.jsx` | .jsx | Form labels |
| `checkbox.jsx` | .jsx | Checkbox input |
| `radio-group.jsx` | .jsx | Radio button groups |
| `switch.jsx` | .jsx | Toggle switches |
| `slider.jsx` | .jsx | Range slider |
| `select.jsx` | .jsx | Dropdown select |

#### Display
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `badge.jsx` | .jsx | Status badges (processing, ready, risk levels) |
| `card.jsx` | .jsx | Content containers |
| `avatar.jsx` | .jsx | User avatars |
| `avatar-icon.jsx` | .jsx | Icon-based avatars |
| `skeleton.jsx` | .jsx | Loading placeholders |
| `spinner.jsx` | .jsx | Loading indicator |
| `progress.jsx` | .jsx | Progress bars |
| `separator.jsx` | .jsx | Visual dividers |
| `aspect-ratio.jsx` | .jsx | Aspect ratio containers |

#### Navigation
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `navigation-menu.jsx` | .jsx | Main navigation |
| `menubar.jsx` | .jsx | Menu bar |
| `breadcrumb.jsx` | .jsx | Breadcrumb navigation |
| `pagination.jsx` | .jsx | Page navigation |
| `tabs.jsx` | .jsx | Tab navigation |
| `sidebar.jsx` | .jsx | Sidebar navigation |

#### Overlays & Dialogs
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `dialog.jsx` | .jsx | Modal dialogs |
| `alert-dialog.jsx` | .jsx | Confirmation dialogs |
| `sheet.jsx` | .jsx | Slide-out panels |
| `drawer.jsx` | .jsx | Bottom/side drawers |
| `popover.jsx` | .jsx | Floating popovers |
| `hover-card.jsx` | .jsx | Hover-triggered cards |
| `tooltip.jsx` | .jsx | Tooltips |
| `dropdown-menu.jsx` | .jsx | Dropdown menus |
| `context-menu.jsx` | .jsx | Right-click menus |

#### Forms
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `form.jsx` | .jsx | Form wrapper with validation |
| `input-otp.jsx` | .jsx | OTP input |
| `calendar.jsx` | .jsx | Date picker calendar |
| `command.jsx` | .jsx | Command palette |

#### Feedback
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `alert.jsx` | .jsx | Alert messages |
| `toast.jsx` | .jsx | Toast notifications (Radix) |
| `toaster.jsx` | .jsx | Toast container |
| `sonner.jsx` | .jsx | Sonner toast integration |
| `use-toast.js` | .js | Toast hook |

#### Layout
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `accordion.jsx` | .jsx | Collapsible sections |
| `collapsible.jsx` | .jsx | Collapsible content |
| `resizable.jsx` | .jsx | Resizable panels |
| `scroll-area.jsx` | .jsx | Custom scrollable areas |
| `table.jsx` | .jsx | Data tables |
| `carousel.jsx` | .jsx | Image/content carousels |

#### Data Visualization
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `chart.jsx` | .jsx | Recharts integration |

#### Toggles
| Component | Extension | Purpose |
|-----------|-----------|---------|
| `toggle.jsx` | .jsx | Toggle buttons |
| `toggle-group.jsx` | .jsx | Toggle button groups |

### Document-Specific Components

| Component | Extension | Purpose |
|-----------|-----------|---------|
| `risk-badge.jsx` | .jsx | Risk level indicators (high/medium/low) |
| `citation-tag.jsx` | .jsx | Clickable page references [Pg 5] |
| `message-bubble.jsx` | .jsx | Chat messages with markdown + citations |
| `upload-card.jsx` | .jsx | Drag-and-drop document upload |
| `pdf-control-bar.jsx` | .jsx | PDF zoom, page navigation controls |
| `insight-cards.jsx` | .jsx | Risk cards, action items, key terms |

### Feature Components

| Component | Path | Purpose |
|-----------|------|---------|
| `ChatPanel.jsx` | `components/chat/` | Tabbed sidebar (Chat/Insights/Notes) with RAG |
| `PDFViewer.jsx` | `components/document/` | Document viewer with controls |

### Layout Components

| Component | Path | Purpose |
|-----------|------|---------|
| `DashboardLayout.jsx` | `components/layouts/` | Collapsible sidebar + main content |
| `WorkspaceLayout.jsx` | `components/layouts/` | Full-screen immersive layout |

### Route Guards

| Component | Extension | Purpose |
|-----------|-----------|---------|
| `ProtectedRoute.jsx` | .jsx | Redirects unauthenticated users to login |
| `PublicRoute.jsx` | .jsx | Redirects authenticated users to dashboard |

---

## Hooks

| Hook | Extension | Purpose |
|------|-----------|---------|
| `useAuth.js` | .js | Authentication mutations (login, register, logout) |
| `useDocumentPolling.js` | .js | Polls processing documents every 3s |
| `use-toast.js` | .js | Toast notification state management |

---

## Services

| Service | Extension | Purpose |
|---------|-----------|---------|
| `auth.service.js` | .js | All authentication API calls |
| `document.service.js` | .js | All document API calls |

---

## Library Utilities

| File | Extension | Purpose |
|------|-----------|---------|
| `axios.js` | .js | HTTP client with auth interceptors |
| `api-endpoints.js` | .js | API endpoint constants |
| `queryClient.js` | .js | React Query configuration |
| `utils.js` | .js | Utility functions (`cn` for classnames) |

---

## Key Features

### Authentication
- Email/password login and registration
- Google OAuth integration
- Guest mode (limited access without account)
- JWT token management with auto-refresh
- Password reset via email

### Document Management
- Drag-and-drop PDF upload
- Document list with grid/list view toggle
- Search functionality
- Processing status tracking with polling
- Risk level visualization

### AI Document Analysis
- RAG-based chat with document context
- Citation support (clickable page references)
- Legal clause extraction
- Executive summary generation
- Resizable split-pane interface (PDF + Chat)

---

## API Integration

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/register/` | User registration |
| POST | `/accounts/login/` | Email/password login |
| POST | `/accounts/google/` | Google OAuth login |
| POST | `/accounts/logout/` | Logout |
| POST | `/accounts/token/refresh/` | Refresh access token |
| GET | `/accounts/me/` | Current user profile |
| PATCH | `/accounts/me/` | Update profile |
| POST | `/accounts/password/change/` | Change password |
| POST | `/accounts/password/reset/` | Request password reset |
| POST | `/accounts/password/reset/confirm/` | Confirm password reset |
| POST | `/accounts/profile/avatar/` | Upload avatar |
| DELETE | `/accounts/profile/avatar/` | Delete avatar |

### Document Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/documents/` | List documents (with search) |
| POST | `/ai/documents/upload/` | Upload document |
| GET | `/ai/documents/{id}/` | Get document details |
| DELETE | `/ai/documents/{id}/` | Delete document |
| POST | `/ai/documents/{id}/chat/` | Chat with document (RAG) |
| POST | `/ai/documents/{id}/clauses/` | Get legal clauses |
| POST | `/ai/documents/{id}/summary/` | Get executive summary |

### Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/sessions/` | List chat sessions |
| GET | `/ai/sessions/{id}/` | Get session details |

---

## Architecture Patterns

### State Management
- **Server State**: React Query for caching, synchronization, background refetching
- **Auth State**: React Context API for global user/auth state
- **Form State**: React Hook Form with Zod validation

### Split-Pane Workspace
The Document Workbench uses `react-resizable-panels` for a draggable split between PDF viewer (60%) and Chat panel (40%).

### Citation Linking
AI responses include `CitationTag` components. Clicking a citation scrolls to and highlights the referenced PDF page.

### Token Management
- Access and refresh tokens stored in localStorage
- Axios interceptors automatically attach tokens to requests
- 401 responses trigger automatic token refresh
- Request queue prevents multiple simultaneous refresh attempts

### Document Polling
Custom `useDocumentPolling` hook polls for processing status updates every 3 seconds until documents are ready.

---

## Dependencies

### Core Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 18.3.1 | UI framework |
| `react-dom` | 18.3.1 | React DOM rendering |
| `react-router-dom` | 6.30.1 | Client-side routing |
| `@tanstack/react-query` | 5.83.0 | Server state & caching |
| `axios` | 1.13.2 | HTTP client |

### UI & Components

| Package | Version | Purpose |
|---------|---------|---------|
| `@radix-ui/*` | various | Unstyled accessible primitives (20+ packages) |
| `class-variance-authority` | 0.7.1 | Component variant management |
| `clsx` | 2.1.1 | Conditional classnames |
| `tailwind-merge` | 2.6.0 | Tailwind class merging |
| `lucide-react` | 0.462.0 | Icon library |
| `cmdk` | 1.1.1 | Command palette |
| `vaul` | 0.9.9 | Drawer component |
| `input-otp` | 1.4.2 | OTP input |
| `embla-carousel-react` | 8.6.0 | Carousel |
| `react-day-picker` | 8.10.1 | Date picker |

### Forms & Validation

| Package | Version | Purpose |
|---------|---------|---------|
| `react-hook-form` | 7.61.1 | Form state management |
| `@hookform/resolvers` | 3.10.0 | Form validation resolvers |
| `zod` | 3.25.76 | Schema validation |

### Document Handling

| Package | Version | Purpose |
|---------|---------|---------|
| `react-pdf` | 10.2.0 | PDF rendering |
| `react-markdown` | 10.1.0 | Markdown rendering |
| `react-resizable-panels` | 2.1.9 | Split-pane layouts |

### Animation & Styling

| Package | Version | Purpose |
|---------|---------|---------|
| `framer-motion` | 12.23.26 | Animations and transitions |
| `tailwindcss` | 3.4.17 | Utility-first CSS |
| `tailwindcss-animate` | 1.0.7 | Animation utilities |
| `next-themes` | 0.3.0 | Theme switching |

### Data Visualization

| Package | Version | Purpose |
|---------|---------|---------|
| `recharts` | 2.15.4 | Charts library |
| `date-fns` | 3.6.0 | Date utilities |

### Notifications

| Package | Version | Purpose |
|---------|---------|---------|
| `sonner` | 1.7.4 | Toast notifications |

### Development

| Package | Version | Purpose |
|---------|---------|---------|
| `vite` | 5.4.19 | Build tool |
| `@vitejs/plugin-react-swc` | 3.11.0 | React SWC plugin |
| `eslint` | 9.32.0 | Linting |
| `autoprefixer` | 10.4.21 | CSS prefixing |
| `postcss` | 8.5.6 | CSS processing |
| `lovable-tagger` | 1.1.13 | Component tagging |

---

## Deployment

### Docker

```sh
docker build -t legalmind-frontend .
docker run -p 80:80 legalmind-frontend
```

### Production Build

```sh
npm run build
# Output in dist/ directory
```

---

## File Extension Summary

| Extension | Count | Usage |
|-----------|-------|-------|
| `.jsx` | 65 | React components with JSX |
| `.js` | 8 | Hooks, services, utilities |
| `.css` | 1 | Global styles and design tokens |

**Note**: This project uses JavaScript (JSX), not TypeScript.

---

## License

This project is proprietary software.
