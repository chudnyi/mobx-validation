import {action, computed, observable} from 'mobx';

// R - Result of validation
// V - Type of validated value
// T - Type of interface with form fields

type Validation<R> = (value: any) => R | Promise<R>;
type ValidationError = string;
type ErrorFormatter<R> = (result: R) => ValidationError;
type ValidWhen<R> = (result: R) => boolean;

const defaultErrorFormatter: ErrorFormatter<any> = (result: any) => result;
const defaultValidWhen: ValidWhen<any> = (result: any) => !result;

export const defaultValidatorOptions: IValidatorOptionsValues = {
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

  public async validate(input: any): Promise<ValidationError[] | undefined> {
    let errors: ValidationError[] | undefined;
    const promises = this.rules.map(v => v.validation(input));
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

interface IValidatorOptionsValues {
  readonly validateOnChange: boolean;
  readonly validateOnFocus: boolean;
  readonly validateOnBlur: boolean;

  readonly hideErrorsOnChange: boolean;
  readonly hideErrorsOnFocus: boolean;
  readonly hideErrorsOnBlur: boolean;
}

export type IValidatorOptions = Partial<IValidatorOptionsValues>;

type ValueParser<V> = (inputValue?: string) => V | undefined;
type ValueFormatter<V> = (value?: V) => string | undefined;

const defaultValueFormatter: ValueFormatter<any> = value => value ? value.toString() : undefined;

interface IFormField<V> extends IRulesOwner {
  readonly inputValue?: string;
  readonly parsedValue?: V;
  readonly formattedValue?: string;
  readonly isValid: boolean;
  readonly errors?: ValidationError[];
  readonly firstError?: ValidationError;
  readonly firstErrorAsArray?: [ValidationError];

  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onChangeText: (inputValue: string) => void;

  validate(): Promise<V | undefined>;
  setInputValue(inputValue?: string): void;
  clearErrors(): void;
  hideErrors(): void;

  setValueParser(fn: ValueParser<V>): void;
  setValueFormatter(fn: ValueFormatter<V>): void;
}

export class FormField<V> implements IFormField<V> {
  @observable private _inputValue?: string;
  // not valid by default
  @observable private _errors?: ValidationError[] = [];
  @observable private _isErrorsVisible: boolean = false;
  @observable.ref private _parser?: ValueParser<V>;
  @observable.ref private _formatter?: ValueFormatter<V>;
  private _valueValidator = new ValueValidator();

  constructor(private _options: IValidatorOptions = defaultValidatorOptions) {
  }

  @computed
  public get inputValue(): string | undefined {
    return this._inputValue;
  }

  @computed
  public get parsedValue(): V | undefined {
    if (!this._parser) {
      throw new Error('FormField::parsedValue Use parser for input value. Use setValueParser');
    }
    return this._parser(this._inputValue);
  }

  @computed
  public get formattedValue(): string | undefined {
    return (this._formatter || defaultValueFormatter)(this.parsedValue);
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

  public setInputValue(inputValue?: string) {
    this._inputValue = inputValue;
  }

  public async validate(): Promise<V | undefined> {
    const errors = await this._valueValidator.validate(this._inputValue);
    this._setErrors(errors);

    return this.isValid ? this.parsedValue : undefined;
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
}

export type IFormFields<T extends object> = { [P in keyof T]: IFormField<T[P]> };

export interface IFormValidator<T extends object> {
  readonly fields: IFormFields<T>;
  readonly isValid: boolean;
  validate(): Promise<T | undefined>;
  validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
  setFields(fields: IFormFields<T>): void;
}

export class FormValidator<T extends object> implements IFormValidator<T> {
  private _fields?: IFormFields<T>;

  public setFields(fields: IFormFields<T>): void {
    this._fields = fields;
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
}

export class StringField extends FormField<string> {
  constructor(options: IValidatorOptions = defaultValidatorOptions) {
    super(options);
    this.setValueParser(s => s);
  }
}
