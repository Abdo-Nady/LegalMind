# Notebook-Style Document Chat: Frontend Design Proposal

## 0. Visual Identity: "The Trusted Counsel"

**Target Audience**: Lawyers & Executives.
**Vibe**: Classic authority, stable, trustworthy, premium.

### Color Palette

- **Primary (Authority)**: `Deep Navy (#0A2540)` - Headers, primary navigation, strong text.
- **Secondary (Premium)**: `Metallic Gold (#C5A065)` - "Premium" badges, key primary actions (sparingly).
- **Background (Marketing)**: `Premium White (#FAF9F6)` - Hero sections, clean paper feel.
- **Accent (Modernity)**: `Teal (#14B8A6)` - Success states, links, refreshing highlights.

## 1. Core Design Patterns: "The Intelligent Notebook"

To achieve the "notebook-style" feel for a 1:1 document chat, we should move beyond a simple chat overlay and create a **Side-by-Side Workspace**.

### Key UI Patterns

1.  **Split-Screen Layout (The "Canvas")**

    - **Left Panel (60%)**: Interactive PDF Viewer.
      - _Why_: The document is the source of truth. It must be readable and interactable.
    - **Right Panel (40%)**: Intelligent Chat & Notes.
      - _Why_: Chat is the "assistant" working _alongside_ the user.
    - _Notebook Feel_: Allow the right panel to toggle between "Chat Mode" (transient Q&A) and "Notes Mode" (persistent extracted insights).

2.  **Visual Grounding (Citations)**

    - **Pattern**: AI responses should include citation tags (e.g., `[Page 4]`).
    - **Interaction**: Hovering/Clicking a tag highlights the relevant text in the PDF and scrolls it into view. This builds trust and mimics the "research" workflow.

3.  **Contextual "Ask" (Right-Click Analysis)**

    - **Pattern**: User selects text in the PDF -> Floater Menu appears: "Summarize this", "Explain legal terms", "Save to notes".
    - **Interaction**: The result appears in the chat/notebook panel, preserving the connection between source and insight.

4.  **Rich-Text "Notebook" Responses**
    - Instead of plain text blobs, AI should output standardized widgets:
      - _Risk Cards_: "⚠️ High Risk Clause Detected" (Red border).
      - _Action Items_: Checkbox lists for deadlines.
      - _Diff Views_: For comparing two clauses.

## 2. Page Structure (Routing)

Since this is a Single Page Application (SPA) with React Router, we need a clean hierarchy.

### A. Dashboard (Home) - `/dashboard` (or `/`)

- **Purpose**: The "file explorer" of the notebook.
- **Key Elements**:
  - **Grid/List of Documents**: Thumbnail of the PDF + metadata (Upload date, summary status).
  - **Status Badges**: "Processing", "Ready", "Risk Analysis Complete".
  - **Upload Zone**: Prominent drag-and-drop area.

### B. The Workbench (The Core View) - `/document/:id`

- **Purpose**: The 1:1 Notebook interface.
- **Layout**:
  - **Header**: Document Title, Export Button, Toggle Panel View.
  - **Body**: Split Pane (PDF | Sidebar).
    - _Sidebar Tabs_: "Chat", "Insights/Notes", "Clause Analysis".

### C. Settings/Profile - `/settings`

- **Purpose**: User preferences (Avatar, API keys if BYOK).

### D. Authentication - `/login`, `/register`

- **Visual Style**: "Split Screen" (Premium SaaS Standard).
  - **Left Panel (Visual)**: Dark-themed, high-quality abstract 3D art or motion graphic representing "Intelligence/Clarity". Quote or value prop ("Analyze contracts in seconds").
  - **Right Panel (Interactive)**: Clean, white/light-grey (or dark glass) column for the form.
- **Structure**:
  - **Logo**: Top left of the form area.
  - **Form**: Email/Password with floating labels (Material/Premium feel).
  - **Socials**: "Continue with Google/Microsoft" (Business focus).
  - **Micro-interactions**: Password strength indicator, smooth toggle between Login/Signup states.

## 3. Reusable Components Architecture (Atomic Design)

We will build a library of components to ensure velocity and consistency.

### Atoms (Basic Building Blocks)

- `Button` (Primary, Secondary, Ghost, Danger)
- `IconButton` (for toolbar actions like "Copy", "Zoom")
- `Badge/Tag` (for Risk Levels: High/Medium/Low)
- `Spinner/Loader` (for AI thinking states)
- `Avatar` (User/Bot icons)

### Molecules (Functional Units)

- `MessageBubble`:
  - Props: `role` (user/ai), `content` (markdown), `citations` (list of coords).
  - Features: Renders Markdown, handles citation clicks.
- `CitationTag`:
  - Small clickable chip `[Pg 5]`.
- `PDFControlBar`:
  - Zoom In/Out, Page Navigation input `[ < 5 / 20 > ]`.
- `UploadCard`:
  - Dropzone visual with progress bar.

### Organisms (Complex Sections)

- `ChatPanel`:
  - Contains: `MessageList`, `MessageInput` (w/ attachment support), `TypingIndicator`.
- `PDFViewer`:
  - Wrapper around `react-pdf` (or similar).
  - Handles: Rendering pages, Text Selection events, Drawing highlights overlay.
- `NotebookSidebar`:
  - Tab controller switching between Chat and Notes.

### Layouts

- `DashboardLayout`: Sidebar + Main Content Area.
- `WorkspaceLayout`: Full-screen, no header margin (immersive).

## 4. Recommended Library Stack (Additions)

To implement this efficiently:

- **PDF Rendering**: `react-pdf` or `pdfjs-dist`.
- **Split Panes**: `react-resizable-panels` (crucial for that "IDE" feel).
- **Markdown**: `react-markdown` + `remark-gfm`.
- **Icons**: `lucide-react` (clean, modern, commonly used with shadcn/ui).
