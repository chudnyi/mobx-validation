import * as tslib_1 from "tslib";
import { action, computed, observable, reaction } from 'mobx';
import { whenObserved } from './whenObserved.helper';
var InputEventEnum;
(function (InputEventEnum) {
    InputEventEnum["init"] = "init";
    InputEventEnum["focus"] = "focus";
    InputEventEnum["changing"] = "changing";
    InputEventEnum["changed"] = "changed";
    InputEventEnum["blur"] = "blur";
})(InputEventEnum || (InputEventEnum = {}));
export class Field {
    constructor() {
        this.isDirty = false;
        this.isValidating = false;
        this._errors = [];
        this._isErrorsVisible = false;
        this.onChange = (inputValue) => {
            this._emitEvent('changing');
            this._setInputValue(inputValue);
            this.isDirty = true;
        };
        this.onFocus = () => {
            this._emitEvent('focus');
        };
        this.onBlur = () => {
            this._emitEvent('blur');
        };
        this._eventHandler = () => { };
        this._validationIteratorFactoryFactory = () => {
            // noinspection TsLint
            return function ({ inputOrValue }) {
                return tslib_1.__asyncGenerator(this, arguments, function* () {
                    return yield tslib_1.__await(inputOrValue);
                });
            };
        };
        // 2 - потому, что в reaction подписка на 2 своих поля
        const disposeCount = 2;
        let observeCounter = 0;
        let reactionDisposer;
        whenObserved(this, ['inputValue', 'value', 'inputOrValue', 'isValid', 'isValidating', 'errors'], () => {
            observeCounter++;
            // при первой подписке из-вне, создаём reaction, который будет отвечать за вализацию
            if (observeCounter === 1) {
                let checkCounter = 0;
                reactionDisposer = reaction(() => ({
                    // Подписка на свои поля определяет значение disposeCount
                    inputValue: this.inputValue, value: this.value,
                    validationIteratorFactory: this._validationIteratorFactory
                }), ({ inputValue: _inputValue, value: _value, validationIteratorFactory }) => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    if (validationIteratorFactory) {
                        const iteratorIndex = ++checkCounter;
                        const errors = [];
                        const iterable = validationIteratorFactory({ input: _inputValue, value: _value, inputOrValue: this.inputOrValue });
                        let isObsolete;
                        let validValue;
                        this._setErrors(errors, true);
                        while (true) {
                            let value;
                            let done;
                            try {
                                const item = yield iterable.next();
                                value = item.value;
                                done = item.done;
                            }
                            catch (error) {
                                // TODO: Что делать, если тип ошибки E - не строка?
                                value = error.message;
                                done = false;
                            }
                            isObsolete = iteratorIndex !== checkCounter;
                            const isError = !done && value !== undefined;
                            const isNothing = !done && value === undefined;
                            const isValidValue = done && value !== undefined;
                            if (isObsolete) {
                                break;
                            }
                            if (isNothing) {
                                continue;
                            }
                            if (isError) {
                                errors.push(value);
                                this._setErrors(errors);
                            }
                            if (isValidValue) {
                                validValue = value;
                            }
                            if (done) {
                                break;
                            }
                        }
                        isObsolete = iteratorIndex !== checkCounter;
                        if (!isObsolete) {
                            this._setErrors(errors, false);
                            if (validValue !== undefined) {
                                this._setValue(validValue);
                            }
                        }
                        if (checkCounter === 1) {
                            this._emitEvent('init');
                        }
                        this._hideErrorsIfNoErrors();
                        this._emitEvent('changed');
                    }
                }), { fireImmediately: true });
            }
            return reactionDisposer;
        }, () => {
            observeCounter--;
            // при последней отпписке из-вне, убиваем reaction, чтобы небыло утечек памяти
            if (observeCounter === disposeCount) {
                if (reactionDisposer) {
                    reactionDisposer();
                    reactionDisposer = undefined;
                }
            }
        });
    }
    setValidator(createValidator) {
        this._setErrors([], true);
        this._validationIteratorFactoryFactory = createValidator;
    }
    get inputValue() {
        return this._inputValue;
    }
    get value() {
        return this._value;
    }
    get inputOrValue() {
        return this._inputValue !== undefined ? this._inputValue : this._value;
    }
    setValue(value) {
        this._emitEvent('changing');
        this._inputValue = undefined;
        this._setValue(value);
        this.isDirty = false;
        this.isValidating = false;
    }
    get isValid() {
        return (!this._errors || !this._errors.length) && !this.isValidating;
    }
    get errors() {
        return this._isErrorsVisible && this._errors && this._errors.length ? this._errors : undefined;
    }
    showErrors() {
        this._isErrorsVisible = true;
    }
    clearErrors() {
        this._errors = undefined;
        this._isErrorsVisible = false;
    }
    hideErrors() {
        this._isErrorsVisible = false;
    }
    setEventHandler(handler) {
        this._eventHandler = handler;
    }
    get _validationIteratorFactory() {
        return this._validationIteratorFactoryFactory ? this._validationIteratorFactoryFactory() : undefined;
    }
    _setInputValue(inputValue) {
        this._inputValue = inputValue;
        this._value = undefined;
        this.isDirty = false;
    }
    _setValue(value) {
        this._value = value;
    }
    _setErrors(errors, isValidating) {
        this._errors = errors;
        if (isValidating !== undefined) {
            this.isValidating = isValidating;
        }
    }
    _emitEvent(eventType) {
        this._eventHandler({ eventType, field: this });
    }
    _hideErrorsIfNoErrors() {
        const noErrors = !this._errors || this._errors.length === 0;
        if (noErrors) {
            this.hideErrors();
        }
    }
}
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Boolean)
], Field.prototype, "isDirty", void 0);
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Boolean)
], Field.prototype, "isValidating", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "_inputValue", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "_value", void 0);
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Array)
], Field.prototype, "_errors", void 0);
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Boolean)
], Field.prototype, "_isErrorsVisible", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Function)
], Field.prototype, "_validationIteratorFactoryFactory", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Function]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "setValidator", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "inputValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "value", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "inputOrValue", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "setValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Boolean),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "isValid", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "errors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "showErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "clearErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "hideErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "onChange", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "onFocus", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "onBlur", void 0);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "_validationIteratorFactory", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_setInputValue", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_setValue", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array, Boolean]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_setErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [String]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_emitEvent", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_hideErrorsIfNoErrors", null);
export class Form {
    setFields(fields) {
        this._fields = fields;
    }
    get fields() {
        if (!this._fields) {
            throw new Error('FormField::fields Not specified Form fields. Use setFields');
        }
        return this._fields;
    }
    get isValid() {
        for (const key in this.fields) {
            if (this.fields.hasOwnProperty(key)) {
                const field = this.fields[key];
                if (!field.isValid) {
                    return false;
                }
            }
        }
        return true;
    }
    get values() {
        if (!this.isValid) {
            return undefined;
        }
        const result = {};
        Object.keys(this.fields).forEach(key => {
            const field = this.fields[key];
            result[key] = field.value;
        });
        return result;
    }
    setValues(values, clear = false) {
        for (const key in this.fields) {
            if (this.fields.hasOwnProperty(key)) {
                const value = values[key];
                if ((value !== undefined && value !== null) || clear) {
                    const field = this.fields[key];
                    field.setValue(value);
                }
            }
        }
    }
}
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Form.prototype, "fields", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Form.prototype, "isValid", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Form.prototype, "values", null);
//# sourceMappingURL=index.js.map