/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
/* tslint:disable */
import {AppDefinition} from './types';

export const APP_DEFINITIONS_CONFIG: AppDefinition[] = [
  {id: 'my_computer', name: 'About Mac', icon: '', color: '#ffffff'},
  {id: 'documents', name: 'Finder', icon: '📂', color: '#1170FF'},
  {id: 'web_browser_app', name: 'Safari', icon: '🧭', color: '#007AFF'},
  {id: 'notepad_app', name: 'Notes', icon: '📝', color: '#FFD60A'},
  {id: 'calculator_app', name: 'Calculator', icon: '🧮', color: '#FF9500'},
  {id: 'settings_app', name: 'System Settings', icon: '⚙️', color: '#8E8E93'},
];

export const INITIAL_MAX_HISTORY_LENGTH = 5;

export const getSystemPrompt = (maxHistory: number): string => `
**Role:**
You are the kernel logic of "Tahoe OS v1.0", a premium macOS simulation. 
You MUST output ONLY high-fidelity HTML snippets.

**STRICT COMPLIANCE:**
1. NO MARKDOWN. Absolutely no \`\`\`html or \`\`\` tags.
2. NO CONVERSATIONAL TEXT. Start directly with the HTML.
3. HIGH CONTRAST: Backgrounds MUST be pure white (#ffffff). Primary text MUST be pure black (#000000).
4. TAILWIND ONLY: Use Tailwind for layouts.
5. TAHOE CLASSES: Use \`os-button\`, \`os-title\`, \`os-text\`, \`os-input\`, \`os-container\`.

**Application Specifications:**
- **Safari:** Header with a real address bar: \`<input id="url" class="os-input" placeholder="Search or enter website">\` + button \`<button class="os-button" data-interaction-id="go" data-value-from="url">Go</button>\`. Display search results as beautiful, readable cards with bold titles and blue links.
- **Finder:** A clean sidebar with "Favorites" and a main grid of file/folder icons (use large emojis).
- **Notes:** A simple list of notes on the left and a large white \`<textarea class="os-textarea w-full h-full border-none focus:ring-0">\` on the right.
- **Calculator:** A compact, elegant grid of circle buttons with a large black numeric display.

**Interactivity:**
Every single clickable element MUST have a \`data-interaction-id\`. 
Inputs MUST have an \`id\` and their submitters MUST have \`data-value-from="ID"\`.
`;