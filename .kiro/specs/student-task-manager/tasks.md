# Implementation Plan: Student Task Manager

## Overview

This plan implements a full-stack task management application using AWS Blocks Building Blocks, React, and TypeScript. The implementation follows a local-first development approach with complete user data isolation. The build order follows the requirements specification: scaffold project → backend setup → API implementation → frontend UI → integration → testing.

## Tasks

- [x] 1. Project scaffolding and setup
  - [x] 1.1 Verify AWS Blocks CLI installation and project structure
    - Confirm project was scaffolded with React template
    - Verify directory structure: `aws-blocks/`, `src/`, `test/`
    - Confirm `package.json` has required dependencies
    - _Requirements: NFR-1, NFR-2, NFR-3_

  - [x] 1.2 Verify development environment setup
    - Test `npm run dev` starts local server at http://localhost:3000
    - Confirm `.bb-data/` directory is created on first run
    - Verify Vite HMR (hot module reload) works
    - _Requirements: NFR-2_

- [x] 2. Backend setup with Building Blocks
  - [x] 2.1 Implement AuthBasic and KVStore blocks in aws-blocks/index.ts
    - Create Scope with id 'student-task-manager'
    - Add AuthBasic block with 8-character minimum password policy
    - Configure session duration to 24 hours (86400 seconds)
    - Add KVStore block for task storage
    - Export authApi via auth.createApi()
    - _Requirements: FR-1, NFR-1_

  - [x] 2.2 Define Task TypeScript type
    - Create Task interface with id, title, completed, createdAt, userId fields
    - Use string types for id (UUID), title, createdAt (ISO 8601), userId
    - Use boolean type for completed status
    - _Requirements: FR-2, Data Model_

- [x] 3. Backend API implementation
  - [x] 3.1 Implement createTask API method
    - Create ApiNamespace with id 'api'
    - Implement createTask(title: string) method
    - Call auth.requireAuth(context) to get authenticated user
    - Validate title is non-empty (throw error if empty)
    - Generate task ID using crypto.randomUUID()
    - Create task object with userId from auth context (never from client)
    - Store in KVStore with key format: `${user.username}:${taskId}`
    - Return Task object
    - _Requirements: FR-2, FR-7_

  - [x] 3.2 Implement listTasks API method
    - Implement listTasks() method returning Promise<Task[]>
    - Call auth.requireAuth(context) to get authenticated user
    - Use tasks.scan({ prefix: `${user.username}:` }) to retrieve user's tasks
    - Extract task values from scan entries
    - Sort tasks by createdAt timestamp (oldest first)
    - Return sorted task array
    - _Requirements: FR-3, FR-7_

  - [x] 3.3 Implement updateTask API method
    - Implement updateTask(taskId: string, title: string) method
    - Call auth.requireAuth(context) to get authenticated user
    - Validate title is non-empty
    - Fetch existing task using key `${user.username}:${taskId}`
    - Verify task exists and userId matches authenticated user
    - Create updated task object with new title
    - Save updated task to KVStore
    - Return updated Task object
    - _Requirements: FR-4, FR-7_

  - [x] 3.4 Implement toggleTask API method
    - Implement toggleTask(taskId: string) method
    - Call auth.requireAuth(context) to get authenticated user
    - Fetch existing task with user-scoped key
    - Verify ownership (existing.userId === user.username)
    - Create updated task with toggled completed status
    - Save to KVStore and return updated task
    - _Requirements: FR-5, FR-7_

  - [x] 3.5 Implement deleteTask API method
    - Implement deleteTask(taskId: string) method returning Promise<void>
    - Call auth.requireAuth(context) to get authenticated user
    - Construct key: `${user.username}:${taskId}`
    - Fetch existing task to verify ownership
    - Throw error if task not found or userId mismatch
    - Delete task from KVStore using tasks.delete(key)
    - _Requirements: FR-6, FR-7_

  - [x] 3.6 Export API namespace
    - Export api constant from aws-blocks/index.ts
    - Ensure type-safe exports for frontend consumption
    - _Requirements: NFR-3, NFR-4_

- [x] 4. Checkpoint - Verify backend implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Frontend UI implementation
  - [x] 5.1 Create App root component in src/App.tsx
    - Import authApi and api from '../aws-blocks'
    - Import AccountMenuBar and AuthenticatedContent from '@aws-blocks/blocks/ui'
    - Implement App component with AccountMenuBar
    - Use AuthenticatedContent wrapper with authenticatedView and unauthenticatedView props
    - Create placeholder SignInPrompt component for unauthenticated state
    - _Requirements: FR-1, NFR-3, NFR-4_

  - [x] 5.2 Create TaskManager main component
    - Define state: tasks (Task[]), loading (boolean), error (string | null)
    - Define state: newTaskTitle (string), editingTaskId (string | null), editingTitle (string)
    - Implement useEffect to load tasks on mount via api.listTasks()
    - Implement loadTasks function with error handling
    - Create container structure with task input area and task list area
    - _Requirements: FR-3, FR-8_

  - [x] 5.3 Implement task creation UI and logic
    - Create TaskInput component with input field and "Add task" button
    - Implement handleCreateTask function calling api.createTask()
    - Validate non-empty title on client side
    - Clear input field after successful creation
    - Update tasks state with new task
    - Handle errors and display error messages
    - Support Enter key submission
    - _Requirements: FR-2, FR-8_

  - [x] 5.4 Implement task list display
    - Create TaskList component receiving tasks array as prop
    - Display empty state message when tasks.length === 0: "No tasks yet — add one above"
    - Map over tasks to render TaskItem components
    - Apply conditional styling for completed tasks (strikethrough, dimmed)
    - Show loading state while tasks are being fetched
    - Ensure list remains visible even when errors occur
    - _Requirements: FR-3, FR-8_

  - [x] 5.5 Implement task item component with actions
    - Create TaskItem component with task prop
    - Render checkbox for completion status
    - Render task title (clickable for edit mode) or input field (when editing)
    - Render delete button
    - Implement handleToggleComplete calling api.toggleTask()
    - Implement handleEditStart to enter edit mode
    - Implement handleEditSave calling api.updateTask()
    - Implement handleDelete calling api.deleteTask()
    - Update parent state after each operation
    - _Requirements: FR-4, FR-5, FR-6_

- [x] 6. Error handling implementation
  - [x] 6.1 Implement error display components
    - Create ErrorBanner component with message and dismiss button
    - Style error banner with red background and border
    - Add error state to TaskManager and display ErrorBanner when error exists
    - Implement error dismissal functionality
    - _Requirements: FR-8_

  - [x] 6.2 Add error handling to all API calls
    - Wrap all api method calls in try-catch blocks
    - Set error state with user-friendly messages
    - Handle authentication errors (401) with appropriate feedback
    - Handle validation errors (400) with field-level messages
    - Ensure task list remains visible when errors occur
    - _Requirements: FR-8_

- [x] 7. Styling and responsive design
  - [x] 7.1 Create mobile-first CSS styles
    - Create CSS file or CSS modules for components
    - Implement single-column layout
    - Set minimum width support to 375px
    - Use plain CSS (no frameworks or component libraries)
    - Style AccountMenuBar area
    - Style task input field and button
    - Style task list with checkbox, title, and delete button
    - _Requirements: FR-9, NFR-3_

  - [x] 7.2 Implement completion styling
    - Add CSS for completed tasks: strikethrough text decoration
    - Add dimmed/muted color for completed tasks
    - Ensure checkbox reflects completion state visually
    - _Requirements: FR-5, FR-9_

  - [x] 7.3 Ensure touch-friendly interactions
    - Set appropriate tap target sizes (minimum 44x44px)
    - Add hover and focus states for interactive elements
    - Test checkbox, edit, and delete button interactions
    - Verify no horizontal scrolling at 375px width
    - _Requirements: FR-9_

- [x] 8. Integration and wiring
  - [x] 8.1 Connect frontend to backend API
    - Verify type-safe imports from '../aws-blocks'
    - Ensure all API methods are called with correct parameters
    - Verify TypeScript autocomplete works for API methods
    - Test error propagation from backend to frontend
    - _Requirements: NFR-4_

  - [x] 8.2 Implement authentication integration
    - Verify AccountMenuBar displays sign-in/sign-out buttons correctly
    - Test sign-up flow with username and password
    - Test sign-in flow with correct and incorrect credentials
    - Test sign-out flow
    - Verify AuthenticatedContent wrapper switches views based on auth state
    - Confirm Authenticator UI component handles errors (username taken, wrong password)
    - _Requirements: FR-1_

  - [x] 8.3 Test user data isolation
    - Verify each user only sees their own tasks after sign-in
    - Test with two different users in same session
    - Confirm userId is never accepted from client parameters
    - Verify all API calls use user from auth.requireAuth(context)
    - _Requirements: FR-7_

- [x] 9. Checkpoint - Full application integration test
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 10. End-to-end testing
  - [ ]* 10.1 Implement multi-user isolation test
    - Write test to sign up as "alice" and create 2 tasks
    - Sign out and sign up as "bob", create 2 different tasks
    - Verify bob only sees his 2 tasks
    - Sign out bob and sign in as alice
    - Verify alice still sees her original 2 tasks
    - _Requirements: Testing Scenario 1, FR-7_

  - [ ]* 10.2 Implement full CRUD workflow test
    - Sign in as a user
    - Create a task "Test task"
    - Verify task appears with checkbox unchecked
    - Toggle completion and verify strikethrough styling
    - Edit title to "Updated task" and verify change
    - Delete task and verify removal
    - _Requirements: Testing Scenario 2, FR-2, FR-3, FR-4, FR-5, FR-6_

  - [ ]* 10.3 Implement empty and error state test
    - Sign in as new user and verify empty state message
    - Add a task and verify empty state disappears
    - Simulate network error (disconnect or mock failure)
    - Attempt to add task and verify error message appears
    - Verify existing task remains visible
    - _Requirements: Testing Scenario 3, FR-8_

  - [ ]* 10.4 Test responsive design on mobile viewport
    - Set viewport to 375px width
    - Verify all UI elements are readable and usable
    - Test all touch interactions (tap checkbox, edit, delete)
    - Verify no horizontal scrolling
    - _Requirements: FR-9_

- [x] 11. Final verification and cleanup
  - [x] 11.1 Verify all functional requirements are met
    - Test user authentication (sign up, sign in, sign out)
    - Test task creation with validation
    - Test task list display and filtering
    - Test task editing
    - Test task completion toggle
    - Test task deletion
    - Test user data isolation
    - Test error handling
    - Test responsive UI at 375px width
    - _Requirements: All FR-1 through FR-9_

  - [x] 11.2 Verify all non-functional requirements are met
    - Confirm technology stack: React, TypeScript, AWS Blocks, Vite
    - Test local development: npm run dev runs without AWS credentials
    - Verify project structure follows standard AWS Blocks layout
    - Confirm type safety: API calls have autocomplete and type checking
    - Review security: auth.requireAuth on all API methods, user ID from JWT only
    - _Requirements: All NFR-1 through NFR-5_

  - [x] 11.3 Clean up and finalize code
    - Remove any console.log statements or debug code
    - Ensure code follows TypeScript best practices
    - Add code comments where necessary for clarity
    - Verify no unused imports or variables
    - Run TypeScript compiler to check for type errors
    - _Requirements: NFR-4_

- [x] 12. Final checkpoint - Application ready for use
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- All implementation tasks must be completed; only test tasks are optional
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of implementation progress
- The design uses TypeScript, so all code should be written in TypeScript
- Backend code goes in: `aws-blocks/index.ts` (single file)
- Frontend code goes in: `src/App.tsx` and related component files
- User identity must always come from `auth.requireAuth(context)`, never from client parameters
- All KVStore keys must use format: `${user.username}:${taskId}` for data isolation
- The exact user field name (username, userId, id) should be confirmed via TypeScript autocomplete after implementing AuthBasic
- Defense-in-depth security: use both key scoping AND explicit userId verification on mutations

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.2"]
    },
    {
      "id": 2,
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5"]
    },
    {
      "id": 3,
      "tasks": ["3.6"]
    },
    {
      "id": 4,
      "tasks": ["5.1"]
    },
    {
      "id": 5,
      "tasks": ["5.2", "5.3"]
    },
    {
      "id": 6,
      "tasks": ["5.4", "5.5"]
    },
    {
      "id": 7,
      "tasks": ["6.1", "6.2"]
    },
    {
      "id": 8,
      "tasks": ["7.1", "7.2", "7.3"]
    },
    {
      "id": 9,
      "tasks": ["8.1", "8.2", "8.3"]
    },
    {
      "id": 10,
      "tasks": ["10.1", "10.2", "10.3", "10.4"]
    },
    {
      "id": 11,
      "tasks": ["11.1", "11.2", "11.3"]
    }
  ]
}
```
