import * as tslib_1 from "tslib";
import { action, computed, observable, autorun } from 'mobx';
const defaultErrorFormatter = (result) => result;
const defaultValidWhen = (result) => !result;
const defaultValueFormatter = value => value ? value.toString() : undefined;
export const defaultValidationOptions = {
    validateOnChange: false,
    validateOnFocus: false,
    validateOnBlur: false,
    hideErrorsOnChange: false,
    hideErrorsOnFocus: false,
    hideErrorsOnBlur: false
};
export class Rule {
    constructor(validation) {
        this.validation = validation;
    }
    formatter(fn) {
        if (!fn) {
            return this._formatter || defaultErrorFormatter;
        }
        this._formatter = fn;
        return this;
    }
    validWhen(fn) {
        if (!fn) {
            return this._validWhen || defaultValidWhen;
        }
        this._validWhen = fn;
        return this;
    }
}
export class ValueValidator {
    constructor() {
        this.rules = [];
    }
    validate(inputValue) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errors;
            const promises = this.rules.map(v => v.validation(inputValue));
            const results = yield Promise.all(promises);
            results.forEach((result, index) => {
                const v = this.rules[index];
                const isValid = v.validWhen()(result);
                if (!isValid) {
                    const error = v.formatter()(result);
                    if (!errors) {
                        errors = [];
                    }
                    errors.push(error);
                }
            });
            return errors;
        });
    }
}
export class Field {
    constructor(_options = defaultValidationOptions) {
        this._options = _options;
        // not valid by default
        this._errors = [];
        this._isErrorsVisible = false;
        this._valueValidator = new ValueValidator();
        this.onChangeText = (inputValue) => tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this._options.hideErrorsOnChange) {
                this.hideErrors();
            }
            this.setInputValue(inputValue);
            if (this._options.validateOnChange) {
                yield this.validate();
            }
        });
        this.onFocus = () => {
            if (this._options.hideErrorsOnFocus) {
                this.hideErrors();
            }
            if (this._options.validateOnFocus) {
                this.validate().then();
            }
        };
        this.onBlur = () => {
            if (this._options.hideErrorsOnBlur) {
                this.hideErrors();
            }
            if (this._options.validateOnBlur) {
                this.validate().then();
            }
        };
        autorun(() => {
            this._updateValueByInputValue();
        });
    }
    get inputValue() {
        return this._inputValue;
    }
    get value() {
        return this._value;
    }
    setValue(value) {
        this._value = value;
    }
    get formattedValue() {
        return (this._formatter || defaultValueFormatter)(this.value);
    }
    get isValid() {
        // valid only if errors === undefined
        // if errors = [] - not valid (by default)
        return !this._errors;
    }
    get errors() {
        // never populate errors === [] - only for internal logic
        return this._isErrorsVisible && this._errors && this._errors.length ? this._errors : undefined;
    }
    get firstError() {
        return this._errors && this._errors.length ? this._errors[0] : undefined;
    }
    get firstErrorAsArray() {
        return this._errors && this._errors.length ? [this._errors[0]] : undefined;
    }
    get rules() {
        return this._valueValidator.rules;
    }
    setInputValue(inputValue) {
        this._inputValue = inputValue;
    }
    validate() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const errors = yield this._valueValidator.validate(this._inputValue);
            this._setErrors(errors);
            return this.isValid ? this.value : undefined;
        });
    }
    clearErrors() {
        this._errors = undefined;
    }
    hideErrors() {
        this._isErrorsVisible = false;
    }
    setValueFormatter(fn) {
        this._formatter = fn;
    }
    setValueParser(fn) {
        this._parser = fn;
    }
    _setErrors(errors) {
        this._errors = errors;
        this._isErrorsVisible = true;
    }
    _updateValueByInputValue() {
        if (!this._parser) {
            throw new Error('FormField::parsedValue Use parser for input value. Use setValueParser');
        }
        this._value = this._parser(this._inputValue);
    }
}
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", String)
], Field.prototype, "_inputValue", void 0);
tslib_1.__decorate([
    observable,
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
], Field.prototype, "_parser", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Function)
], Field.prototype, "_formatter", void 0);
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
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Object]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "setValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "formattedValue", null);
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
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "firstError", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "firstErrorAsArray", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], Field.prototype, "rules", null);
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
], Field.prototype, "onFocus", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], Field.prototype, "onBlur", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array]),
    tslib_1.__metadata("design:returntype", void 0)
], Field.prototype, "_setErrors", null);
export class Form {
    setFields(fields) {
        this._fields = fields;
    }
    get fields() {
        if (!this._fields) {
            throw new Error('FormField::fields Not specified FormValidator fields. Use setFields');
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
    validatePartial(...fields) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!fields || !fields.length) {
                fields = [...Object.keys(this.fields)];
            }
            const promises = fields.map(field => this.fields[field].validate());
            const values = yield Promise.all(promises);
            let result;
            fields.forEach((field, index) => {
                if (this.fields[field].isValid) {
                    if (!result) {
                        result = {};
                    }
                    result[field] = values[index];
                }
            });
            return result;
        });
    }
    validate(...fields) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!fields || !fields.length) {
                fields = [...Object.keys(this.fields)];
            }
            const promises = fields.map(field => this.fields[field].validate());
            const values = yield Promise.all(promises);
            let result;
            for (let index = 0; index < fields.length; index++) {
                const field = fields[index];
                if (!this.fields[field].isValid) {
                    return undefined;
                }
                else {
                    if (!result) {
                        result = {};
                    }
                    result[field] = values[index];
                }
            }
            return result;
        });
    }
    setValues(values) {
        for (const key in this.fields) {
            if (this.fields.hasOwnProperty(key)) {
                const value = values[key];
                if (value !== undefined) {
                    const field = this.fields[key];
                    field.setValue(value === null ? undefined : value);
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
export class StringField extends Field {
    constructor(options = defaultValidationOptions) {
        super(options);
        this.setValueParser(s => s);
    }
}
//# sourceMappingURL=index.js.map