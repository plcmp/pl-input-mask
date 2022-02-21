import IMask from 'imask';
import { PlElement } from "polylib";

class ShadowHTMLMaskElement extends IMask.HTMLMaskElement {
    get isActive() {
        let active = document.activeElement;
        while (active && active.shadowRoot && active.shadowRoot.activeElement) {
            active = active.shadowRoot.activeElement;
        }
        return this.input === active;
    }
}

class PlInputMask extends PlElement {
    static get properties() {
        return {
            mask: { value: () => null, observer: '_maskObserver' },
            type: { value: () => "pattern" },
            unmasked: { type: String, value: () => null },
            blocks: { value: () => null }
        }
    }

    connectedCallback() {
        super.connectedCallback();
        this._input = this.parentElement._nativeInput;
        this._imask = new IMask(new ShadowHTMLMaskElement(this._input), this._compileMask());
        this.parentNode.addEventListener('value-changed', this.inputValChanged.bind(this));
        this.parentElement.validators.push(this.validator.bind(this));
    }

    inputValChanged(val) {
        this._imask.updateValue();
        this._imask.updateControl();

        this.unmasked = this._imask.masked.unmaskedValue;
        this.parentNode.validate();
    }

    validator(value) {
        let messages = [];

        if (!this._imask.masked.isComplete && this._imask.masked.rawInputValue != '') {
            messages.push('You need to fill value according to the mask');
        }

        if (this._imask.masked.rawInputValue == '' && this.parentElement.required) {
            messages.push('Value cannot be empty');
        }

        return messages.length > 0 ? messages.join(';') : undefined;
    }

    _compileMask() {
        let mask = '';
        switch (this.type) {
            case 'pattern': {
                mask = this.mask;
                break;
            }

            case 'regexp': {
                mask = new RegExp(this.mask, 'gm');
                break;
            }

            case 'date': {
                mask = Date;
                break;
            }
        }
        return {
            mask: mask || /^.*$/,
            placeholderChar: '_',
            lazy: false,
            overwrite: true,
            blocks: this.blocks
        };
    }

    _maskObserver(val) {
        this._imask.updateOptions(this._compileMask());
    }
}


customElements.define('pl-input-mask', PlInputMask);