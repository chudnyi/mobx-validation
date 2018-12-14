declare type ValidationError = string;
declare enum InputEventEnum {
    init = "init",
    focus = "focus",
    changing = "changing",
    changed = "changed",
    blur = "blur"
}
export declare type InputEventType = keyof typeof InputEventEnum;
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
    setValidator(createValidator: () => (args: {
        input?: IN;
        value?: V;
        inputOrValue?: IN | V;
    }) => AsyncIterableIterator<E | undefined>): void;
    setEventHandler(handler: (event: FieldEvent<V, IN, E>) => void): void;
}
export declare class Field<V, IN = V, E = ValidationError> implements IField<V, IN, E> {
    isDirty: boolean;
    isValidating: boolean;
    private _inputValue?;
    private _value?;
    private _errors?;
    private _isErrorsVisible;
    private _validationIteratorFactoryFactory?;
    private _eventHandler;
    constructor();
    setValidator(createValidator: () => (args: {
        input?: IN;
        value?: V;
        inputOrValue?: IN | V;
    }) => AsyncIterableIterator<E | undefined>): void;
    readonly inputValue: IN | undefined;
    readonly value: V | undefined;
    readonly inputOrValue: IN | V | undefined;
    setValue(value: V): void;
    readonly isValid: boolean;
    readonly errors: E[] | undefined;
    showErrors(): void;
    clearErrors(): void;
    hideErrors(): void;
    readonly onChange: (inputValue: IN) => void;
    readonly onFocus: () => void;
    readonly onBlur: () => void;
    setEventHandler(handler: (event: FieldEvent<V, IN, E>) => void): void;
    private readonly _validationIteratorFactory;
    private _setInputValue;
    private _setValue;
    private _setErrors;
    private _emitEvent;
    private _hideErrorsIfNoErrors;
}
declare type IFormFields<T extends object> = {
    [P in keyof T]: IField<T[P], any, any>;
};
export interface IForm<T extends object> {
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    readonly values?: T;
    setFields(fields: IFormFields<T>): void;
    setValues(values: Partial<T>, clear?: boolean): void;
}
export declare class Form<T extends object> implements IForm<T> {
    private _fields?;
    setFields(fields: IFormFields<T>): void;
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    readonly values: any;
    setValues(values: Partial<T>, clear?: boolean): void;
}
export {};
