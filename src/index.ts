/**
 * Frontend — src/index.ts
 *
 * Student Task Manager - integrates React with AWS Blocks auth UI
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { TaskManager } from './App';
import { authApi } from '../aws-blocks';
import { AccountMenuBar, AuthenticatedContent } from '@aws-blocks/blocks/ui';

// ─── Auth UI ─────────────────────────────────────────────────────────────────
// Mount AccountMenuBar in menu-bar element
const menuBarEl = document.getElementById('menu-bar')!;
menuBarEl.appendChild(AccountMenuBar(authApi));

// ─── Authenticated Content ───────────────────────────────────────────────────
const signInMessage = document.createElement('p');
signInMessage.className = 'sign-in-prompt';
signInMessage.textContent = 'Sign in to get started.';

// Mount AuthenticatedContent with React TaskManager when authenticated
document.getElementById('app')!.appendChild(
  AuthenticatedContent(authApi, (user) => {
    const container = document.createElement('div');
    container.className = 'task-manager-container';
    
    // Render React TaskManager into container
    const root = ReactDOM.createRoot(container);
    root.render(
      React.createElement(React.StrictMode, null,
        React.createElement(TaskManager)
      )
    );
    
    return container;
  }, signInMessage)
);
