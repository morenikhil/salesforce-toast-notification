/**
 * toastService — Singleton utility for publishing toast notifications
 * via the ToastNotification__c Lightning Message Channel.
 *
 * Usage in any LWC:
 *
 *   import toastService from 'c/toastService';
 *   import { MessageContext } from 'lightning/messageService';
 *
 *   @wire(MessageContext) messageContext;
 *
 *   someMethod() {
 *       toastService.setContext(this.messageContext);
 *       toastService.success('Record saved!', 'Success');
 *   }
 */

import { publish } from 'lightning/messageService';
import TOAST_MC from '@salesforce/messageChannel/ToastNotification__c';

const DEFAULTS = {
    variant:  'info',
    duration: 3000,
    mode:     'dismissible'
};

/**
 * @typedef {Object} ToastOptions
 * @property {string}  message  - Body text (required)
 * @property {string}  [title]  - Heading above message
 * @property {'success'|'error'|'warning'|'info'} [variant='info']
 * @property {number}  [duration=3000]  - Auto-dismiss ms (ignored when mode='sticky')
 * @property {'dismissible'|'sticky'} [mode='dismissible']
 */

class ToastService {
    _ctx = null;

    /**
     * Bind the MessageContext wired from the calling component.
     * Must be called before any show/success/error/warning/info call.
     * @param {object} messageContext
     */
    setContext(messageContext) {
        this._ctx = messageContext;
    }

    /**
     * Show a toast notification.
     * @param {ToastOptions} options
     */
    show({ message, title = '', variant = DEFAULTS.variant, duration = DEFAULTS.duration, mode = DEFAULTS.mode } = {}) {
        if (!this._ctx) {
            // eslint-disable-next-line no-console
            console.error('[toastService] Call setContext(this.messageContext) before show().');
            return;
        }
        if (!message) {
            // eslint-disable-next-line no-console
            console.warn('[toastService] show() called without a message.');
            return;
        }
        publish(this._ctx, TOAST_MC, { title, message, variant, duration: Number(duration), mode });
    }

    /** @param {string} message @param {string} [title] @param {number} [duration] */
    success(message, title = '', duration = DEFAULTS.duration) {
        this.show({ message, title, variant: 'success', duration });
    }

    /** @param {string} message @param {string} [title] @param {number} [duration] */
    error(message, title = '', duration = DEFAULTS.duration) {
        this.show({ message, title, variant: 'error', duration });
    }

    /** @param {string} message @param {string} [title] @param {number} [duration] */
    warning(message, title = '', duration = DEFAULTS.duration) {
        this.show({ message, title, variant: 'warning', duration });
    }

    /** @param {string} message @param {string} [title] @param {number} [duration] */
    info(message, title = '', duration = DEFAULTS.duration) {
        this.show({ message, title, variant: 'info', duration });
    }

    /**
     * Show a sticky toast that must be manually closed.
     * @param {string} message
     * @param {string} [title]
     * @param {'success'|'error'|'warning'|'info'} [variant='info']
     */
    sticky(message, title = '', variant = DEFAULTS.variant) {
        this.show({ message, title, variant, mode: 'sticky' });
    }
}

// Export a single shared instance — all components share one service object
const toastService = new ToastService();
export default toastService;
