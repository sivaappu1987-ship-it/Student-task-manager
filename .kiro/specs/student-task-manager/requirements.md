# Requirements: Student Task Manager

## Overview
A beginner-friendly full-stack task manager application where users can sign up, sign in, and manage their own personal tasks. Each user can only see and interact with their own tasks, providing complete data isolation between users.

## Functional Requirements

### FR-1: User Authentication
**Priority:** Must Have  
**Description:** Users must be able to create accounts, sign in, and sign out.

**Acceptance Criteria:**
- Users can sign up with a username and password
- Users can sign in with their credentials
- Users can sign out of their account
- Sign-up shows error when username is already taken
- Sign-in shows error when credentials are incorrect
- Password must meet minimum security requirements (8+ characters)
- Uses AuthBasic's prebuilt Authenticator UI component (not custom forms)
- Auth endpoints are created via auth.createApi()

### FR-2: Create Tasks
**Priority:** Must Have  
**Description:** Authenticated users can create new tasks with a title.

**Acceptance Criteria:**
- User can enter a task title in an input field
- User can submit the task via an "Add task" button
- Task is created with: unique ID, title, completed status (false), creation timestamp, and owner userId
- Task ID is generated using crypto.randomUUID()
- Creation timestamp uses ISO 8601 format (new Date().toISOString())
- Owner userId is extracted server-side from auth.requireAuth(context), never from client
- New task appears in the user's task list immediately after creation
- Empty titles are not allowed

### FR-3: List Tasks
**Priority:** Must Have  
**Description:** Authenticated users can view all their own tasks.

**Acceptance Criteria:**
- User sees a list of all their tasks
- Each task displays: checkbox (completion status), title, and delete button
- Tasks are retrieved using listTasks() API with userId prefix scan
- Only the authenticated user's tasks are visible (scoped by ${userId}:${taskId} key)
- Loading state is shown while tasks are being fetched
- Empty state message "No tasks yet — add one above" is shown when list is empty
- Completed tasks have strikethrough and dimmed styling
- List remains visible even when errors occur

### FR-4: Edit Task Title
**Priority:** Must Have  
**Description:** Users can edit the title of their existing tasks.

**Acceptance Criteria:**
- User can click on a task title or edit icon to enter edit mode
- User can modify the task title inline
- Changes are saved via updateTask() API
- Server re-fetches task and verifies userId matches before updating
- Updated title appears immediately in the list
- Error message is shown if update fails
- Empty titles are not allowed

### FR-5: Toggle Task Completion
**Priority:** Must Have  
**Description:** Users can mark tasks as complete or incomplete.

**Acceptance Criteria:**
- Each task has a checkbox showing its completion status
- Clicking the checkbox toggles the completed state
- Toggle action calls toggleTask() API
- Server re-fetches task and verifies userId matches before toggling
- Completed tasks get strikethrough and dimmed visual styling
- Toggle state updates immediately in the UI

### FR-6: Delete Tasks
**Priority:** Must Have  
**Description:** Users can permanently delete their tasks.

**Acceptance Criteria:**
- Each task has a delete button
- Clicking delete removes the task via deleteTask() API
- Server re-fetches task and verifies userId matches before deleting
- Task disappears from the list immediately
- No confirmation dialog is required
- Error message is shown if deletion fails

### FR-7: User Data Isolation
**Priority:** Must Have  
**Description:** Each user can only access their own tasks; complete data isolation between users.

**Acceptance Criteria:**
- All KVStore keys are prefixed with ${userId}:${taskId} format
- listTasks() uses scan({ prefix: `${user.username}:` }) to scope results
- updateTask(), toggleTask(), and deleteTask() all verify ownership by checking existing.userId === user.username
- User identifier is never accepted as a parameter from frontend
- User identifier is always read from auth.requireAuth(context) return value
- Multiple users can be logged in (different browser tabs/sessions) and each only sees their own data

### FR-8: Error Handling
**Priority:** Must Have  
**Description:** Application handles errors gracefully and provides user feedback.

**Acceptance Criteria:**
- Authentication errors show field-level error messages (wrong password, username taken)
- API call failures display error banner or inline text
- Task list remains visible when errors occur (not blanked out)
- Error messages are clear and actionable
- Network errors are handled gracefully

### FR-9: Responsive UI
**Priority:** Must Have  
**Description:** Application is mobile-first and works on small screens.

**Acceptance Criteria:**
- UI is readable and usable at 375px width and up
- Single column layout
- Plain CSS (or CSS modules), no component libraries or CSS frameworks
- Touch-friendly tap targets for mobile devices
- No horizontal scrolling required

## Non-Functional Requirements

### NFR-1: Technology Stack
**Priority:** Must Have  
**Stack Components:**
- React with TypeScript for frontend
- AWS Blocks for backend (AuthBasic, KVStore, ApiNamespace)
- Vite for build tooling
- Node.js 22+ and npm 10+ required

### NFR-2: Local Development
**Priority:** Must Have  
**Description:** Application must run entirely locally without AWS credentials.

**Acceptance Criteria:**
- npm run dev starts the application at http://localhost:3000
- All Blocks use local implementations (no AWS account needed)
- Local KVStore data stored in .bb-data/ directory
- Deleting .bb-data/ folder resets all local state
- No environment variables or secrets required for local dev

### NFR-3: Project Structure
**Priority:** Must Have  
**File Organization:**
- Backend code in: aws-blocks/index.ts (single file)
- Frontend code in: src/App.tsx
- Standard AWS Blocks project layout (not restructured)
- Type-safe API imports: import { api } from '../aws-blocks'

### NFR-4: Type Safety
**Priority:** Must Have  
**Description:** Full TypeScript type safety between frontend and backend.

**Acceptance Criteria:**
- API calls are type-safe with autocomplete
- No manual fetch/URL construction needed
- Type errors caught at compile time
- Task data model defined in TypeScript

### NFR-5: Security
**Priority:** Must Have  
**Security Requirements:**
- All API methods require authentication via auth.requireAuth(context)
- User identity is never trusted from client parameters
- Ownership verification happens server-side on all mutations
- Key-scoping prevents access to other users' data
- Defense-in-depth: both key prefixing AND explicit userId checking

## Out of Scope

The following are explicitly excluded from this implementation:

- Dashboards or analytics
- Roles, permissions, or multi-user collaboration beyond owner-only access
- Notifications (email, push, etc.)
- AI features
- File uploads or attachments
- Additional AWS Blocks (DistributedTable, Database, Realtime, FileBucket, etc.)
- State management libraries (Redux, MobX, Zustand, etc.)
- UI component libraries (Material-UI, Ant Design, etc.)
- Routing libraries (React Router, etc.)
- Multiple pages or views

## Data Model

```typescript
type Task = {
  id: string;         // crypto.randomUUID()
  title: string;      // user-provided task description
  completed: boolean; // completion status
  createdAt: string;  // ISO 8601 timestamp: new Date().toISOString()
  userId: string;     // owner identifier from auth.requireAuth()
};
```

**KVStore Key Format:** `${userId}:${taskId}`  
**Example:** `alice:550e8400-e29b-41d4-a716-446655440000`

## User Stories

### US-1: New User Sign-Up
**As a** new user  
**I want to** create an account  
**So that** I can start managing my tasks

**Acceptance:**
- I see a sign-up form when I visit the app for the first time
- I can enter a username and password
- I see an error if my username is taken
- After successful sign-up, I'm signed in automatically

### US-2: Returning User Sign-In
**As a** returning user  
**I want to** sign in to my account  
**So that** I can access my existing tasks

**Acceptance:**
- I can sign in with my username and password
- I see an error if my credentials are wrong
- After sign-in, I see my task list

### US-3: Add Daily Tasks
**As an** authenticated user  
**I want to** quickly add tasks  
**So that** I can keep track of what I need to do

**Acceptance:**
- I see an input field and "Add task" button
- I can type a task title and press Enter or click the button
- My new task appears at the bottom of my list immediately

### US-4: Mark Tasks Complete
**As an** authenticated user  
**I want to** check off completed tasks  
**So that** I can see my progress

**Acceptance:**
- Each task has a checkbox
- Clicking the checkbox marks it complete with strikethrough styling
- I can toggle tasks between complete and incomplete

### US-5: Fix Task Mistakes
**As an** authenticated user  
**I want to** edit task titles  
**So that** I can correct typos or clarify descriptions

**Acceptance:**
- I can click on a task title to edit it
- Changes save when I finish editing
- The updated title shows immediately

### US-6: Remove Tasks
**As an** authenticated user  
**I want to** delete tasks I no longer need  
**So that** my list stays clean and relevant

**Acceptance:**
- Each task has a delete button
- Clicking delete removes the task immediately
- Deleted tasks don't come back

### US-7: Privacy
**As a** user  
**I want** my tasks to be private  
**So that** other users can't see or modify them

**Acceptance:**
- When I sign in, I only see my own tasks
- Other users can't access my tasks even if they know the task IDs
- I can't see other users' tasks

## Success Metrics

- Application runs successfully with npm run dev
- Multiple users can sign up and sign in
- Each user only sees their own tasks
- All CRUD operations (create, read, update, delete) work correctly
- UI is usable on mobile devices (375px width)
- No AWS credentials or setup required for local development

## Testing Scenarios

### Scenario 1: Multi-User Isolation
1. Start the application (npm run dev)
2. Sign up as user "alice"
3. Create tasks: "Buy groceries", "Walk dog"
4. Sign out
5. Sign up as user "bob" (in same browser or different tab)
6. Create tasks: "Finish homework", "Call mom"
7. Verify bob only sees his two tasks
8. Sign out bob, sign in as alice
9. Verify alice still sees only her two original tasks

### Scenario 2: Full CRUD Workflow
1. Sign in as a user
2. Create a task "Test task"
3. Verify task appears in list with checkbox unchecked
4. Click checkbox to mark complete
5. Verify task has strikethrough styling
6. Click task title to edit, change to "Updated task"
7. Verify updated title appears
8. Click delete button
9. Verify task is removed from list

### Scenario 3: Empty and Error States
1. Sign in as a new user
2. Verify empty state message appears
3. Add a task
4. Verify empty state disappears
5. Simulate API error (disconnect network)
6. Try to add another task
7. Verify error message appears
8. Verify existing task remains visible

## Build Order

1. **Scaffold Project** - Use AWS Blocks CLI to create React template
2. **Backend Setup** - Add AuthBasic and KVStore, wire auth.createApi()
3. **API Implementation** - Create ApiNamespace with 5 CRUD methods (all behind requireAuth)
4. **Frontend UI** - Build React component with auth and task management UI
5. **Integration** - Connect UI to API with loading/empty/error handling
6. **Testing** - End-to-end testing with multiple users

## Technical Notes

### Authorization Implementation
Every API method follows this pattern:
```typescript
async methodName(params) {
  const user = await auth.requireAuth(context);
  // Use user.username (or confirmed field name) for all operations
  // Never trust userId from client parameters
}
```

### Key Scoping Strategy
- **Create:** `tasks.put(\`${user.username}:${task.id}\`, task)`
- **List:** `tasks.scan({ prefix: \`${user.username}:\` })`
- **Update/Toggle/Delete:** Re-fetch with prefixed key, verify `existing.userId === user.username`

### User Field Name
The exact field name returned by `auth.requireAuth(context)` must be confirmed after scaffolding. Check:
- TypeScript autocomplete in editor
- `@aws-blocks/blocks-auth-basic` README in node_modules
- Adjust all `user.username` references if it differs (e.g., `user.id`, `user.userId`)
