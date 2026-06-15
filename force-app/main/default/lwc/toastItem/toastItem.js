import { LightningElement, api, track } from 'lwc';

const VARIANT_MAP = {
    success: { icon: 'utility:success',  cssModifier: 'toast-item--success' },
    error:   { icon: 'utility:error',    cssModifier: 'toast-item--error'   },
    warning: { icon: 'utility:warning',  cssModifier: 'toast-item--warning' },
    info:    { icon: 'utility:info',     cssModifier: 'toast-item--info'    }
};

const TICK_MS = 50; // progress bar update interval

export default class ToastItem extends LightningElement {
    @api toastId;
    @api title;
    @api message;
    @api variant  = 'info';
    @api duration = 3000;
    @api mode     = 'dismissible'; // 'dismissible' | 'sticky'

    @track _progress = 100; // 100 → 0 over `duration` ms
    @track _visible  = false;

    _dismissTimer    = null;
    _progressTimer   = null;

    connectedCallback() {
        // Trigger enter animation on next frame
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        requestAnimationFrame(() => { this._visible = true; });

        if (!this.isSticky) {
            this._startTimers();
        }
    }

    disconnectedCallback() {
        this._clearTimers();
    }

    // ── Getters ──────────────────────────────────────────────────────────────

    get isSticky() {
        return this.mode === 'sticky';
    }

    get computedClass() {
        const variantMod = VARIANT_MAP[this.variant]?.cssModifier ?? VARIANT_MAP.info.cssModifier;
        const visibleMod = this._visible ? 'toast-item--visible' : '';
        return `toast-item ${variantMod} ${visibleMod}`;
    }

    get iconName() {
        return VARIANT_MAP[this.variant]?.icon ?? 'utility:info';
    }

    get progressStyle() {
        return `width:${this._progress}%`;
    }

    // ── Timer helpers ─────────────────────────────────────────────────────────

    _startTimers() {
        const decrement = (TICK_MS / this.duration) * 100;

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._progressTimer = setInterval(() => {
            this._progress = Math.max(0, this._progress - decrement);
        }, TICK_MS);

        // eslint-disable-next-line @lwc/lwc/no-async-operation
        this._dismissTimer = setTimeout(() => this._dismiss(), this.duration);
    }

    _clearTimers() {
        clearTimeout(this._dismissTimer);
        clearInterval(this._progressTimer);
        this._dismissTimer  = null;
        this._progressTimer = null;
    }

    _dismiss() {
        this._clearTimers();
        // Trigger exit animation, then fire event
        this._visible = false;
        // eslint-disable-next-line @lwc/lwc/no-async-operation
        setTimeout(() => {
            this.dispatchEvent(
                new CustomEvent('closedismiss', {
                    detail:   { toastId: this.toastId },
                    bubbles:  true,
                    composed: true
                })
            );
        }, 300); // match CSS transition duration
    }

    // ── Event handlers ────────────────────────────────────────────────────────

    handleClose() {
        this._dismiss();
    }
}
