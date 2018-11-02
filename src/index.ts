import { action, autorun, computed, observable, untracked } from 'mobx';

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

interface ITriggerEvents<V = any> {
  onChange(field: IField<V>, inputValue?: string | V): void;
  onFocus(field: IField<V>): void;
  onBlur(field: IField<V>): void;
}

export interface IValidationOptions {
  readonly events?: Partial<ITriggerEvents>;
}

type IValidationOptionsValues = { [P in keyof IValidationOptions]-?: IValidationOptions[P] };

const defaultFieldEvents: ITriggerEvents = {
  onChange: (field, inputValue) => {
    field.hideErrors();
  },
  onFocus: field => {
    // empty
  },
  onBlur: field => {
    field.validate().then();
  }
};

const defaultFormEvents: ITriggerEvents = {
  onChange: (field, inputValue) => {
    // empty
  },
  onFocus: field => {
    // empty
  },
  onBlur: field => {
    // empty
  }
};

export const defaultValidationOptions: IValidationOptionsValues = {
  events: defaultFieldEvents
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

export interface IField<V> extends IRulesOwner {
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
  readonly onChangeValue: (inputValue: V) => void;

  readonly events: ITriggerEvents<V>;

  setValue(value: V): void;
  validate(): Promise<V | undefined>;
  setInputValue(inputValue?: string): void;
  clearErrors(): void;
  hideErrors(): void;

  setValueParser(fn: ValueParser<V>): void;
  setValueFormatter(fn: ValueFormatter<V>): void;
}

export class Field<V> implements IField<V> {
  @observable.shallow public readonly rules: Array<IRule<any>> = [];
  public readonly events: ITriggerEvents;
  @observable private _inputValue?: string;
  @observable private _value?: V;
  // not valid by default
  @observable private _errors?: ValidationError[] = [];
  @observable private _isErrorsVisible: boolean = false;
  @observable.ref private _parser?: ValueParser<V>;
  @observable.ref private _formatter?: ValueFormatter<V>;

  constructor(options: IValidationOptions = defaultValidationOptions) {
    // @ts-ignore
    this.events = { ...defaultValidationOptions.events, ...options.events };

    let skipFist = true;
    autorun(async () => {
      const inputValue = untracked(() => this._inputValue);
      const errors = await this._validateRules(inputValue);

      if (skipFist) {
        skipFist = false;
      } else {
        this._setErrors(errors);
      }
    });
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
    this._recalculate({ value: true });
  }

  @action
  public setValue(value: V) {
    this._value = value;
    this._recalculate({ inputValue: true });
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

  public async validate(): Promise<V | undefined> {
    const errors = await this._validateRules(this._inputValue);
    this._setErrors(errors);

    return this.isValid ? this.value : undefined;
  }

  @action
  public clearErrors(): void {
    this._errors = undefined;
    this._isErrorsVisible = false;
  }

  @action
  public hideErrors(): void {
    this._isErrorsVisible = false;
  }

  public readonly onChangeText = async (inputValue: string) => {
    this.events.onChange(this, inputValue);
    this.setInputValue(inputValue);
  }

  public readonly onChangeValue = async (inputValue: V) => {
    this.events.onChange(this, inputValue);
    this.setValue(inputValue);
  }

  @action
  public readonly onFocus = (): void => {
    this.events.onFocus(this);
  }

  @action
  public readonly onBlur = (): void => {
    this.events.onBlur(this);
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

  private async _validateRules(inputValue: any): Promise<ValidationError[] | undefined> {
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

type IFormFields<T extends object> = { [P in keyof T]: IField<T[P]> };

export interface IForm<T extends object> {
  readonly fields: IFormFields<T>;
  readonly isValid: boolean;
  readonly events: ITriggerEvents;

  validate(): Promise<T | undefined>;
  validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
  setFields(fields: IFormFields<T>): void;
  setValues(values: Partial<T>, clear?: boolean): void;
}

export class Form<T extends object> implements IForm<T> {
  public readonly events: ITriggerEvents = { ...defaultFormEvents };
  private _fields?: IFormFields<T>;

  public setFields(fields: IFormFields<T>): void {
    forEach(fields, (field: IField<any>) => {
      field.clearErrors();

      const onChange = field.events.onChange;
      field.events.onChange = (f, v) => {
        onChange(f, v);
        this.events.onChange(f, v);
      };

      const onFocus = field.events.onFocus;
      field.events.onFocus = (f) => {
        onFocus(f);
        this.events.onFocus(f);
      };

      const onBlur = field.events.onBlur;
      field.events.onBlur = (f) => {
        onBlur(f);
        this.events.onBlur(f);
      };
    });

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

function forEach<T extends object>(obj: T, cb: (value: any, key?: keyof T) => void) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cb(obj[key], key);
    }
  }
}
