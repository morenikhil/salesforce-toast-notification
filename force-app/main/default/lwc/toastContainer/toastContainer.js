import { LightningElement, track, wire } from 'lwc';
import { subscribe, unsubscribe, MessageContext, APPLICATION_SCOPE } from 'lightning/messageService';
import TOAST_MC from '@salesforce/messageChannel/ToastNotification__c';

const MAX_QUEUE_SIZE = 5;
let _idCounter = 0;

export default class ToastContainer extends LightningElement {
    @track toasts = [];
    _subscription = null;

    @wire(MessageContext)
    messageContext;

    connectedCallback() {
        this._subscribe();
    }

    disconnectedCallback() {
        this._unsubscribe();
    }

    _subscribe() {
        if (this._subscription) return;
        this._subscription = subscribe(
            this.messageContext,
            TOAST_MC,
            (msg) => this._enqueue(msg),
            { scope: APPLICATION_SCOPE }
        );
    }

    _unsubscribe() {
        unsubscribe(this._subscription);
        this._subscription = null;
    }

    _enqueue(message) {
        if (this.toasts.length >= MAX_QUEUE_SIZE) {
            // Drop the oldest dismissible toast to make room
            const oldest = this.toasts.find(t => t.mode !== 'sticky');
            if (oldest) {
                this.toasts = this.toasts.filter(t => t.id !== oldest.id);
            } else {
                return; // All are sticky — drop the incoming toast
            }
        }

        const toast = {
            id: ++_idCounter,
            title:    message.title    || '',
            message:  message.message  || '',
            variant:  message.variant  || 'info',
            duration: message.duration != null ? Number(message.duration) : 3000,
            mode:     message.mode     || 'dismissible'
        };

        this.toasts = [...this.toasts, toast];
    }

    handleClose(event) {
        const { toastId } = event.detail;
        this.toasts = this.toasts.filter(t => t.id !== toastId);
    }
}
