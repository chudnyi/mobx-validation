import { action, computed, observable, reaction, IReactionDisposer } from 'mobx';
import { whenObserved } from './whenObserved.helper';

// V - Type of validated value
// IN - Type of input value (default: same as V)
// E - Type of validation error (default: string)

type ValidationError = string;

enum InputEventEnum {
  init = 'init',
  focus = 'focus',
  changing = 'changing',
  changed = 'changed',
  blur = 'blur'
}

export type InputEventType = keyof typeof InputEventEnum;

export interface FieldEvent<V = any, IN = V, E = ValidationError> {
  eventType: InputEventType;
  field: IField<V, IN, E>;
}

export interface IField<V, IN = V, E = ValidationError> {
  readonly inputValue?: IN;
  readonly value?: V;
  readonly inputOrValue?: IN | V;
  readonly isValid: boolean;
  readonly isValidating: boolean;
  /**
   * Признак редактирования пользователем.
   */
  readonly isDirty: boolean;
  readonly errors?: E[];

  readonly onFocus: () => void;
  readonly onBlur: () => void;
  readonly onChange: (inputValue: IN) => void;

  setValue(value: V): void;
  showErrors(): void;
  clearErrors(): void;
  hideErrors(): void;

  setValidator(createValidator: () => (args: { input?: IN, value?: V, inputOrValue?: IN | V }) => AsyncIterableIterator<E | undefined>): void;
  setEventHandler(handler: (event: FieldEvent<V, IN, E>) => void): void;
}

export class Field<V, IN = V, E = ValidationError> implements IField<V, IN, E> {
  @observable public isDirty: boolean = false;
  @observable public isValidating: boolean = false;
  @observable.ref private _inputValue?: IN;
  @observable.ref private _value?: V;
  @observable private _errors?: E[] = [];
  @observable private _isErrorsVisible: boolean = false;
  @observable.ref private _validationIteratorFactoryFactory?:
    () => (args: { input?: IN, value?: V, inputOrValue?: IN | V }) => AsyncIterableIterator<E | undefined>;
  private _eventHandler: (event: FieldEvent<V, IN, E>) => void;

  constructor() {
    this._eventHandler = () => { /*do nothing*/ };
    this._validationIteratorFactoryFactory = () => {
      // noinspection TsLint
      return async function* ({ inputOrValue }) {
        return inputOrValue as any;
      };
    };

    // 2 - потому, что в reaction подписка на 2 своих поля
    const disposeCount = 2;
    let observeCounter = 0;
    let reactionDisposer: IReactionDisposer | undefined;
    whenObserved(
      this,
      ['inputValue', 'value', 'inputOrValue', 'isValid', 'isValidating', 'errors'],
      () => {
        observeCounter++;

        // при первой подписке из-вне, создаём reaction, который будет отвечать за вализацию
        if (observeCounter === 1) {
          let checkCounter = 0;
          reactionDisposer = reaction(
            () => ({
              // Подписка на свои поля определяет значение disposeCount
              inputValue: this.inputValue, value: this.value,
              validationIteratorFactory: this._validationIteratorFactory
            }),
            async ({ inputValue: _inputValue, value: _value, validationIteratorFactory }) => {
              if (validationIteratorFactory) {
                const iteratorIndex = ++checkCounter;
                const errors: E[] = [];
                const iterable = validationIteratorFactory({ input: _inputValue, value: _value, inputOrValue: this.inputOrValue });
                let isObsolete;
                let validValue: V | undefined;

                this._setErrors(errors, true);

                while (true) {
                  let value;
                  let done;
                  try {
                    const item = await iterable.next();
                    value = item.value;
                    done = item.done;
                  } catch (error) {
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
            },
            { fireImmediately: true });
        }

        return reactionDisposer;
      },
      () => {
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

  @action
  public setValidator(createValidator: () => (args: { input?: IN, value?: V, inputOrValue?: IN | V }) => AsyncIterableIterator<E | undefined>): void {
    this._setErrors([], true);
    this._validationIteratorFactoryFactory = createValidator;
  }

  @computed
  public get inputValue(): IN | undefined {
    return this._inputValue;
  }

  @computed
  public get value(): V | undefined {
    return this._value;
  }

  @computed
  public get inputOrValue(): IN | V | undefined {
    return this._inputValue !== undefined ? this._inputValue : this._value;
  }

  @action
  public setValue(value: V) {
    this._emitEvent('changing');
    this._inputValue = undefined;
    this._setValue(value);
    this.isDirty = false;
    this.isValidating = false;
  }

  @computed
  public get isValid(): boolean {
    return (!this._errors || !this._errors.length) && !this.isValidating;
  }

  @computed
  public get errors(): E[] | undefined {
    return this._isErrorsVisible && this._errors && this._errors.length ? this._errors : undefined;
  }

  @action
  public showErrors(): void {
    this._isErrorsVisible = true;
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

  @action
  public readonly onChange = (inputValue: IN) => {
    this._emitEvent('changing');
    this._setInputValue(inputValue);
    this.isDirty = true;
  }

  @action
  public readonly onFocus = (): void => {
    this._emitEvent('focus');
  }

  @action
  public readonly onBlur = (): void => {
    this._emitEvent('blur');
  }

  public setEventHandler(handler: (event: FieldEvent<V, IN, E>) => void): void {
    this._eventHandler = handler;
  }

  @computed
  private get _validationIteratorFactory() {
    return this._validationIteratorFactoryFactory ? this._validationIteratorFactoryFactory() : undefined;
  }

  @action
  private _setInputValue(inputValue?: IN) {
    this._inputValue = inputValue;
    this._value = undefined;
    this.isDirty = false;
  }

  @action
  private _setValue(value: V) {
    this._value = value;
  }

  @action
  private _setErrors(errors: E[], isValidating?: boolean) {
    this._errors = errors;
    if (isValidating !== undefined) {
      this.isValidating = isValidating;
    }
  }

  @action
  private _emitEvent(eventType: InputEventType) {
    this._eventHandler({ eventType, field: this });
  }

  @action
  private _hideErrorsIfNoErrors() {
    const noErrors = !this._errors || this._errors.length === 0;
    if (noErrors) {
      this.hideErrors();
    }
  }
}

type IFormFields<T extends object> = { [P in keyof T]: IField<T[P], any, any> };

export interface IForm<T extends object> {
  readonly fields: IFormFields<T>;
  readonly isValid: boolean;
  // return all valid values or undefined
  readonly values?: T;
  setFields(fields: IFormFields<T>): void;
  setValues(values: Partial<T>, clear?: boolean): void;
}

export class Form<T extends object> implements IForm<T> {
  private _fields?: IFormFields<T>;

  public setFields(fields: IFormFields<T>): void {
    this._fields = fields;
  }

  @computed
  public get fields() {
    if (!this._fields) {
      throw new Error('FormField::fields Not specified Form fields. Use setFields');
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

  @computed
  public get values() {
    if (!this.isValid) {
      return undefined;
    }

    const result: any = {};
    Object.keys(this.fields).forEach(key => {
      const field = (this.fields as any)[key];
      result[key] = field.value;
    });

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
