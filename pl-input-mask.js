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
            unmasked: { type: String, value: () => null }
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
        let pattern;
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
                mask = this.mask;
                pattern = 'DD{.}`MM{.}`YYYY HH:mm'
                break;
            }
        }
        return {
            mask: mask || /^.*$/,
            placeholderChar: '_',
            lazy: false,
            overwrite: true,
            pattern,
            blocks: this._blocks,
        };
    }

    _maskObserver(val) {
        this._imask.updateOptions({ lazy: true });
        this._imask.updateOptions(this._compileMask());
    }
    /**
     * ????????????, ???????????????????? ????????????, ?????????????? ?????????? ???????? ???????????????????????? ?????? ???????????????????????? ?????????? ??????????.
     * @type {Object}
     * @private
     */
    get _blocks() {
        return {
            DD: {
                mask: IMask.MaskedRange,
                from: 1,
                to: 31,
                maxLength: 2
            },
            MM: {
                mask: IMask.MaskedRange,
                from: 1,
                to: 12,
                maxLength: 2
            },
            YYYY: {
                mask: IMask.MaskedRange,
                from: this.minYear ?? 1000,
                to: this.maxYear ?? 3000,
                maxLength: 4
            },
            HH: {
                mask: IMask.MaskedRange,
                from: 0,
                to: 23,
                maxLength: 2
            },
            mm: {
                mask: IMask.MaskedRange,
                from: 0,
                to: 59,
                maxLength: 2
            },
            ss: {
                mask: IMask.MaskedRange,
                from: 0,
                to: 59
            },
            N: {
                mask: IMask.MaskedNumber,
                radix: this.radix,
                thousandsSeparator: this.thousandsSeparator,
                mapToRadix: this._mapToRadixArray,
                min: this.min,
                max: this.max,
                scale: this.scale,
                signed: this.signed,
                normalizeZeros: !this.notNormalizeZeros,
                padFractionalZeros: this.padFractionalZeros
            },
            // ?? ?????????????? ???? ???????????????? ??????????, ?????????? ?????????????????? ?????????? ?????????????????????????? ????????????,
            // ?????????????????? ???????????? ?????????????????????????? ????????????????, ???? ?????????? ???????????????????????? placeholder.
            NR: {
                mask: IMask.MaskedRange,
                from: this.from,
                to: this.to,
                overwrite: this.overwrite,
                thousandsSeparator: this.thousandsSeparator,
                signed: this.signed,
                normalizeZeros: !this.notNormalizeZeros,
                padFractionalZeros: this.padFractionalZeros
            }
        };
    }
}


customElements.define('pl-input-mask', PlInputMask);