import * as tslib_1 from "tslib";
import { action, computed, observable } from 'mobx';
const defaultErrorFormatter = (result) => result;
const defaultValidWhen = (result) => !result;
export const defaultValidatorOptions = {
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
    validate(input) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let errors;
            const promises = this.rules.map(v => v.validation(input));
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
const defaultValueFormatter = value => value ? value.toString() : undefined;
export class FormField {
    constructor(_options = defaultValidatorOptions) {
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
    }
    get inputValue() {
        return this._inputValue;
    }
    get parsedValue() {
        if (!this._parser) {
            throw new Error('FormField::parsedValue Use parser for input value. Use setValueParser');
        }
        return this._parser(this._inputValue);
    }
    get formattedValue() {
        return (this._formatter || defaultValueFormatter)(this.parsedValue);
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
            return this.isValid ? this.parsedValue : undefined;
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
}
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", String)
], FormField.prototype, "_inputValue", void 0);
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Array)
], FormField.prototype, "_errors", void 0);
tslib_1.__decorate([
    observable,
    tslib_1.__metadata("design:type", Boolean)
], FormField.prototype, "_isErrorsVisible", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Function)
], FormField.prototype, "_parser", void 0);
tslib_1.__decorate([
    observable.ref,
    tslib_1.__metadata("design:type", Function)
], FormField.prototype, "_formatter", void 0);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "inputValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "parsedValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "formattedValue", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Boolean),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "isValid", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "errors", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "firstError", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "firstErrorAsArray", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormField.prototype, "rules", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], FormField.prototype, "clearErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", []),
    tslib_1.__metadata("design:returntype", void 0)
], FormField.prototype, "hideErrors", null);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], FormField.prototype, "onFocus", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Object)
], FormField.prototype, "onBlur", void 0);
tslib_1.__decorate([
    action,
    tslib_1.__metadata("design:type", Function),
    tslib_1.__metadata("design:paramtypes", [Array]),
    tslib_1.__metadata("design:returntype", void 0)
], FormField.prototype, "_setErrors", null);
export class FormValidator {
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
}
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormValidator.prototype, "fields", null);
tslib_1.__decorate([
    computed,
    tslib_1.__metadata("design:type", Object),
    tslib_1.__metadata("design:paramtypes", [])
], FormValidator.prototype, "isValid", null);
export class StringField extends FormField {
    constructor(options = defaultValidatorOptions) {
        super(options);
        this.setValueParser(s => s);
    }
}
//# sourceMappingURL=index.js.map