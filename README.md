# Toast Notification Service — Salesforce LWC

A centralized, reusable toast notification system for Salesforce Lightning Web Components, built on **Lightning Message Service (LMS)**. Any component on the page can trigger a toast without direct parent–child wiring.

---

## Features

| Feature | Detail |
|---|---|
| **4 variants** | `success`, `error`, `warning`, `info` |
| **Queuing** | FIFO queue with configurable max size (default 5) |
| **Auto-dismiss** | Animated countdown progress bar; configurable per toast |
| **Sticky mode** | Toasts that require manual close |
| **Enter/exit animation** | Slide-in from right, fade-out on dismiss |
| **Accessible** | `role="alert"`, `aria-live`, `aria-atomic`, keyboard-operable close |
| **Cross-DOM** | Uses APPLICATION_SCOPE LMS — works across utility bar, record pages, etc. |
| **Singleton service** | One import, call from anywhere after binding `MessageContext` |

---

## Component Architecture

```
force-app/main/default/
├── lwc/
│   ├── toastContainer/          ← Place once in App/page layout
│   │   ├── toastContainer.html
│   │   ├── toastContainer.js
│   │   ├── toastContainer.css
│   │   └── toastContainer.js-meta.xml
│   ├── toastItem/               ← Internal; rendered by toastContainer
│   │   ├── toastItem.html
│   │   ├── toastItem.js
│   │   ├── toastItem.css
│   │   └── toastItem.js-meta.xml
│   └── toastService/            ← Import this in any component to fire toasts
│       ├── toastService.js
│       └── toastService.js-meta.xml
└── messageChannels/
    └── ToastNotification.messageChannel-meta.xml
```

---

## Quick Start

### Step 1 — Deploy to org

```bash
sf org create scratch --definition-file config/project-scratch-def.json --alias myOrg --set-default
sf project deploy start --source-dir force-app
```

### Step 2 — Add the container to a page

Open **Lightning App Builder**, drag **Toast Notification Container** onto any App page, Record page, or Utility Bar. **Place it once per app** — it listens application-wide.

### Step 3 — Fire toasts from any component

```javascript
// myComponent.js
import { LightningElement, wire } from 'lwc';
import { MessageContext } from 'lightning/messageService';
import toastService from 'c/toastService';

export default class MyComponent extends LightningElement {
    @wire(MessageContext)
    messageContext;

    handleSave() {
        toastService.setContext(this.messageContext);
        toastService.success('Record saved successfully!', 'Saved');
    }

    handleError(error) {
        toastService.setContext(this.messageContext);
        toastService.error(error.body.message, 'Error');
    }
}
```

---

## API Reference

### `toastService` methods

| Method | Signature | Description |
|---|---|---|
| `setContext` | `(messageContext): void` | **Required.** Bind the wired MessageContext before calling show methods. |
| `show` | `(options: ToastOptions): void` | Full-control method. |
| `success` | `(message, title?, duration?): void` | Green success toast. |
| `error` | `(message, title?, duration?): void` | Red error toast. |
| `warning` | `(message, title?, duration?): void` | Orange warning toast. |
| `info` | `(message, title?, duration?): void` | Blue info toast. |
| `sticky` | `(message, title?, variant?): void` | Toast that must be closed manually. |

### `ToastOptions` object

```typescript
{
    message:  string;                                    // Required — body text
    title?:   string;                                    // Optional heading
    variant?: 'success' | 'error' | 'warning' | 'info'; // Default: 'info'
    duration?: number;                                   // Default: 3000 ms
    mode?:    'dismissible' | 'sticky';                 // Default: 'dismissible'
}
```

### `toastContainer` attributes

The container has no public `@api` properties — it self-manages via LMS subscription.

### `toastItem` `@api` properties

| Property | Type | Default | Description |
|---|---|---|---|
| `toastId` | number | — | Unique ID assigned by container |
| `message` | string | — | Body text |
| `title` | string | `''` | Optional heading |
| `variant` | string | `'info'` | Visual style |
| `duration` | number | `3000` | Auto-dismiss ms |
| `mode` | string | `'dismissible'` | `'sticky'` disables auto-dismiss |

---

## Behaviour Details

### Queue management

- Max **5 concurrent toasts** displayed (configurable via `MAX_QUEUE_SIZE` in `toastContainer.js`).
- When the queue is full, the **oldest dismissible** toast is removed to make room.
- If all visible toasts are sticky, incoming toasts are **dropped** until space is available.

### Auto-dismiss flow

1. Toast enters with a slide-in animation.
2. A countdown progress bar shrinks from 100% → 0% over `duration` ms.
3. At expiry the toast fades out and fires `closedismiss` to the container.
4. Container removes the toast from the reactive array.

### `setContext` pattern

`toastService` is a singleton module. `setContext()` is cheap — it just stores a reference. Calling it every time before `show()` is the safest pattern in case the component is re-mounted.

---

## Salesforce Best Practices Applied

- **Lightning Message Service** — cross-DOM, decoupled communication (no `PubSub` anti-pattern).
- **APPLICATION_SCOPE** subscription — works across utility bar and dynamic pages.
- **`@track`** on reactive arrays — ensures LWC re-renders on splice.
- **`disconnectedCallback`** — all timers and subscriptions cleaned up to prevent memory leaks.
- **`isExposed: false`** on internal components — `toastItem` and `toastService` are not draggable onto pages.
- **`apiVersion: 61.0`** — current Summer '25 API version.
- **ARIA attributes** — `role="alert"`, `aria-live="assertive"`, `aria-atomic="true"` for screen readers.
- **No inline styles in HTML** — all styling via CSS custom properties and class bindings.
- **ESLint-friendly** — `@lwc/lwc/no-async-operation` suppression comments where `setTimeout`/`setInterval` are intentionally used.

---

## Customization

### Change max queue size

```javascript
// toastContainer.js
const MAX_QUEUE_SIZE = 8; // increase as needed
```

### Change default duration org-wide

```javascript
// toastService.js
const DEFAULTS = {
    duration: 5000, // 5 seconds
    ...
};
```

### Custom duration per call

```javascript
toastService.error('This stays longer', 'Critical Error', 8000);
```

### Sticky critical errors

```javascript
toastService.sticky('Session expired. Please refresh.', 'Session Error', 'error');
```

---

## Testing

### Jest unit tests (example)

```javascript
// toastContainer.test.js
import { createElement } from 'lwc';
import ToastContainer from 'c/toastContainer';

describe('c-toast-container', () => {
    afterEach(() => { while (document.body.firstChild) document.body.removeChild(document.body.firstChild); });

    it('renders without toasts initially', () => {
        const el = createElement('c-toast-container', { is: ToastContainer });
        document.body.appendChild(el);
        const items = el.shadowRoot.querySelectorAll('c-toast-item');
        expect(items.length).toBe(0);
    });
});
```

Run tests:
```bash
npm run test:unit
```

---

## Browser / Salesforce Compatibility

| Platform | Supported |
|---|---|
| Lightning Experience (Desktop) | ✅ |
| Salesforce Mobile App | ✅ |
| Experience Cloud Sites | ✅ (with LMS support) |
| API version | 61.0 (Summer '25) |

---

## License

MIT — free to use and modify in any Salesforce org.
