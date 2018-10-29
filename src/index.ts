import {action, computed, observable} from 'mobx';

// R - Result of validation
// V - Type of validated value
// T - Type of interface with form fields

type ValidationError = string;
type Validation<R> = (inputValue: any) => R | Promise<R>;
type ErrorFormatter<R> = (result: R) => ValidationError;
type ValidWhen<R> = (result: R) => boolean;
type ValueParser<V> = (inputValue?: string) => V | undefined;
type ValueFormatter<V> = (value?: V) => string | undefined;

const defaultErrorFormatter: ErrorFormatter<any> = (result: any) => result;
const defaultValidWhen: ValidWhen<any> = (result: any) => !result;
const defaultValueFormatter: ValueFormatter<any> = value => value ? value.toString() : undefined;

export interface IValidationOptions {
  readonly validateOnChange?: boolean;
  readonly validateOnFocus?: boolean;
  readonly validateOnBlur?: boolean;
  readonly hideErrorsOnChange?: boolean;
  readonly hideErrorsOnFocus?: boolean;
  readonly hideErrorsOnBlur?: boolean;
}

type IValidationOptionsValues = { [P in keyof IValidationOptions]-?: IValidationOptions[P] };

export const defaultValidationOptions: IValidationOptionsValues = {
  validateOnChange: false,
  validateOnFocus: false,
  validateOnBlur: false,
  hideErrorsOnChange: false,
  hideErrorsOnFocus: false,
  hideErrorsOnBlur: false
};

interface IRule<R> {
  readonly validation: Validation<R>;
  validWhen(fn: ValidWhen<R>): IRule<R>;
  validWhen(): ValidWhen<R>;
  formatter(fn: ErrorFormatter<R>): IRule<R>;
  formatter(): ErrorFormatter<R>;
}

export class Rule<R> implements IRule<R> {
  public readonly validation: Validation<R>;
  private _formatter: ErrorFormatter<R> | undefined;
  private _validWhen: ValidWhen<R> | undefined;

  constructor(validation: Validation<R>) {
    this.validation = validation;
  }

  public formatter(): ErrorFormatter<R>;
  public formatter(fn: ErrorFormatter<R>): IRule<R>;
  public formatter(fn?: ErrorFormatter<R>): any {
    if (!fn) {
      return this._formatter || defaultErrorFormatter;
    }
    this._formatter = fn;
    return this;
  }

  public validWhen(): ValidWhen<R>;
  public validWhen(fn: ValidWhen<R>): IRule<R>;
  public validWhen(fn?: ValidWhen<R>): any {
    if (!fn) {
      return this._validWhen || defaultValidWhen;
    }
    this._validWhen = fn;
    return this;
  }
}

interface IRulesOwner {
  readonly rules: Array<IRule<any>>;
}

export interface IValueValidator extends IRulesOwner {
  validate(input: any): Promise<ValidationError[] | undefined>;
}

export class ValueValidator implements IValueValidator {
  public readonly rules: Array<IRule<any>> = [];

  public async validate(inputValue: any): Promise<ValidationError[] | undefined> {
    let errors: ValidationError[] | undefined;
    const promises = this.rules.map(v => v.validation(inputValue));
    const results = await Promise.all(promises);
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
  }
}

interface IField<V> extends IRulesOwner {
  readonly inputValue?: string;
  readonly value?: V;
  readonly formattedValue?: string;
  readonly isValid: boolean;
  readonly errors?: ValidationError[];
  readonly firstError?: ValidationError;
  readonly firstErrorAsArray?: [ValidationError];

  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onChangeText: (inputValue: string) => void;

  setValue(value: V): void;
  validate(): Promise<V | undefined>;
  setInputValue(inputValue?: string): void;
  clearErrors(): void;
  hideErrors(): void;

  setValueParser(fn: ValueParser<V>): void;
  setValueFormatter(fn: ValueFormatter<V>): void;
}

export class Field<V> implements IField<V> {
  @observable private _inputValue?: string;
  @observable private _value?: V;
  // not valid by default
  @observable private _errors?: ValidationError[] = [];
  @observable private _isErrorsVisible: boolean = false;
  @observable.ref private _parser?: ValueParser<V>;
  @observable.ref private _formatter?: ValueFormatter<V>;
  private _valueValidator = new ValueValidator();

  constructor(private _options: IValidationOptions = defaultValidationOptions) {
  }

  @computed
  public get inputValue(): string | undefined {
    return this._inputValue;
  }

  @computed
  public get value(): V | undefined {
    return this._value;
  }

  @action
  public setInputValue(inputValue?: string) {
    this._inputValue = inputValue;
    this._recalculate({value: true});
  }

  @action
  public setValue(value: V) {
    this._value = value;
    this._recalculate({inputValue: true});
  }

  @computed
  public get formattedValue(): string | undefined {
    return (this._formatter || defaultValueFormatter)(this.value);
  }

  @computed
  public get isValid(): boolean {
    // valid only if errors === undefined
    // if errors = [] - not valid (by default)
    return !this._errors;
  }

  @computed
  public get errors(): ValidationError[] | undefined {
    // never populate errors === [] - only for internal logic
    return this._isErrorsVisible && this._errors && this._errors.length ? this._errors : undefined;
  }

  @computed
  public get firstError(): ValidationError | undefined {
    return this._errors && this._errors.length ? this._errors[0] : undefined;
  }

  @computed
  public get firstErrorAsArray(): [ValidationError] | undefined {
    return this._errors && this._errors.length ? [this._errors[0]] : undefined;
  }

  @computed
  public get rules() {
    return this._valueValidator.rules;
  }

  public async validate(): Promise<V | undefined> {
    const errors = await this._valueValidator.validate(this._inputValue);
    this._setErrors(errors);

    return this.isValid ? this.value : undefined;
  }

  @action
  public clearErrors(): void {
    this._errors = undefined;
  }

  @action
  public hideErrors(): void {
    this._isErrorsVisible = false;
  }

  public readonly onChangeText = async (inputValue: string) => {
    if (this._options.hideErrorsOnChange) {
      this.hideErrors();
    }

    this.setInputValue(inputValue);

    if (this._options.validateOnChange) {
      await this.validate();
    }
  }

  @action
  public readonly onFocus = (): void => {
    if (this._options.hideErrorsOnFocus) {
      this.hideErrors();
    }

    if (this._options.validateOnFocus) {
      this.validate().then();
    }
  }

  @action
  public readonly onBlur = (): void => {
    if (this._options.hideErrorsOnBlur) {
      this.hideErrors();
    }

    if (this._options.validateOnBlur) {
      this.validate().then();
    }
  }

  public setValueFormatter(fn: ValueFormatter<V>): void {
    this._formatter = fn;
  }

  public setValueParser(fn: ValueParser<V>): void {
    this._parser = fn;
  }

  @action
  private _setErrors(errors?: ValidationError[]) {
    this._errors = errors;
    this._isErrorsVisible = true;
  }

  @action
  private _recalculate(dirty: { value?: boolean, inputValue?: boolean }) {
    if (dirty.inputValue) {
      this._inputValue = this.formattedValue;
    }

    if (dirty.value) {
      if (!this._parser) {
        throw new Error('FormField::parsedValue Use parser for input value. Use setValueParser');
      }

      this._value = this._parser!(this._inputValue);
    }
  }
}

type IFormFields<T extends object> = { [P in keyof T]: IField<T[P]> };

export interface IForm<T extends object> {
  readonly fields: IFormFields<T>;
  readonly isValid: boolean;
  readonly error?: ValidationError | undefined;
  validate(): Promise<T | undefined>;
  validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
  setFields(fields: IFormFields<T>): void;
  setValues(values: Partial<T>, clear?: boolean): void;
  setError(error: ValidationError): void;
  clearError(): void;
}

export class Form<T extends object> implements IForm<T> {
  @observable private _error?: ValidationError;
  private _fields?: IFormFields<T>;

  public setFields(fields: IFormFields<T>): void {
    this._fields = fields;
  }

  @action
  public setError(error: ValidationError) {
    if (!this._fields) { return; }
    this._error = error;
  }

  @action
  public clearError() {
    this._error = undefined;
  }

  @computed
  public get error(): ValidationError | undefined {
    return this._error;
  }

  @computed
  public get fields() {
    if (!this._fields) {
      throw new Error('FormField::fields Not specified FormValidator fields. Use setFields');
    }
    return this._fields;
  }

  @computed
  public get isValid() {
    for (const key in this.fields) {
      if ((this.fields as object).hasOwnProperty(key)) {
        const field = this.fields[key];
        if (!field.isValid) {
          return false;
        }
      }
    }

    return true;
  }

  public async validatePartial(...fields: Array<keyof T>): Promise<Partial<T> | undefined> {
    if (!fields || !fields.length) {
      fields = [...Object.keys(this.fields)] as Array<keyof T>;
    }

    const promises = fields.map(field => this.fields[field].validate());
    const values = await Promise.all(promises);
    let result: Partial<T> | undefined;
    fields.forEach((field, index) => {
      if (this.fields[field].isValid) {
        if (!result) {
          result = {};
        }
        result[field] = values[index];
      }
    });

    return result;
  }

  public validate(): Promise<T | undefined>;
  public validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
  public async validate(...fields: Array<keyof T>): Promise<any> {
    if (!fields || !fields.length) {
      fields = [...Object.keys(this.fields)] as Array<keyof T>;
    }

    const promises = fields.map(field => this.fields[field].validate());
    const values = await Promise.all(promises);
    let result: Partial<T> | undefined;
    for (let index = 0; index < fields.length; index++) {
      const field = fields[index];
      if (!this.fields[field].isValid) {
        return undefined;
      } else {
        if (!result) {
          result = {};
        }
        result[field] = values[index];
      }
    }

    return result;
  }

  public setValues(values: Partial<T>, clear: boolean = false): void {
    for (const key in this.fields) {
      if ((this.fields as object).hasOwnProperty(key)) {
        const value = values[key] as any;
        if ((value !== undefined && value !== null) || clear) {
          const field = this.fields[key];
          field.setValue(value);
        }
      }
    }
  }
}

export class StringField extends Field<string> {
  constructor(options: IValidationOptions = defaultValidationOptions) {
    super(options);
    this.setValueParser(s => s);
  }
}
