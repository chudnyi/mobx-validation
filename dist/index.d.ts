declare type ValidationError = string;
declare type Validation<R> = (inputValue: any) => R | Promise<R>;
declare type ErrorFormatter<R> = (result: R) => ValidationError;
declare type ValidWhen<R> = (result: R) => boolean;
declare type ValueParser<V> = (inputValue?: string) => V | undefined;
declare type ValueFormatter<V> = (value?: V) => string | undefined;
export interface IValidationOptions {
    readonly validateOnChange?: boolean;
    readonly validateOnFocus?: boolean;
    readonly validateOnBlur?: boolean;
    readonly hideErrorsOnChange?: boolean;
    readonly hideErrorsOnFocus?: boolean;
    readonly hideErrorsOnBlur?: boolean;
}
declare type IValidationOptionsValues = {
    [P in keyof IValidationOptions]-?: IValidationOptions[P];
};
export declare const defaultValidationOptions: IValidationOptionsValues;
interface IRule<R> {
    readonly validation: Validation<R>;
    validWhen(fn: ValidWhen<R>): IRule<R>;
    validWhen(): ValidWhen<R>;
    formatter(fn: ErrorFormatter<R>): IRule<R>;
    formatter(): ErrorFormatter<R>;
}
export declare class Rule<R> implements IRule<R> {
    readonly validation: Validation<R>;
    private _formatter;
    private _validWhen;
    constructor(validation: Validation<R>);
    formatter(): ErrorFormatter<R>;
    formatter(fn: ErrorFormatter<R>): IRule<R>;
    validWhen(): ValidWhen<R>;
    validWhen(fn: ValidWhen<R>): IRule<R>;
}
interface IRulesOwner {
    readonly rules: Array<IRule<any>>;
}
export interface IValueValidator extends IRulesOwner {
    validate(input: any): Promise<ValidationError[] | undefined>;
}
export declare class ValueValidator implements IValueValidator {
    readonly rules: Array<IRule<any>>;
    validate(inputValue: any): Promise<ValidationError[] | undefined>;
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
export declare class Field<V> implements IField<V> {
    private _options;
    private _inputValue?;
    private _value?;
    private _errors?;
    private _isErrorsVisible;
    private _parser?;
    private _formatter?;
    private _valueValidator;
    private _isDirtyValue;
    private _isDirtyInputValue;
    constructor(_options?: IValidationOptions);
    private _recalculate;
    readonly inputValue: string | undefined;
    readonly value: V | undefined;
    setInputValue(inputValue?: string): void;
    setValue(value: V): void;
    readonly formattedValue: string | undefined;
    readonly isValid: boolean;
    readonly errors: ValidationError[] | undefined;
    readonly firstError: ValidationError | undefined;
    readonly firstErrorAsArray: [ValidationError] | undefined;
    readonly rules: IRule<any>[];
    validate(): Promise<V | undefined>;
    clearErrors(): void;
    hideErrors(): void;
    readonly onChangeText: (inputValue: string) => Promise<void>;
    readonly onFocus: () => void;
    readonly onBlur: () => void;
    setValueFormatter(fn: ValueFormatter<V>): void;
    setValueParser(fn: ValueParser<V>): void;
    private _setErrors;
}
declare type IFormFields<T extends object> = {
    [P in keyof T]: IField<T[P]>;
};
export interface IForm<T extends object> {
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    validate(): Promise<T | undefined>;
    validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
    setFields(fields: IFormFields<T>): void;
    setValues(values: Partial<T>, clear?: boolean): void;
}
export declare class Form<T extends object> implements IForm<T> {
    private _fields?;
    setFields(fields: IFormFields<T>): void;
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    validatePartial(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
    validate(): Promise<T | undefined>;
    validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
    setValues(values: Partial<T>, clear?: boolean): void;
}
export declare class StringField extends Field<string> {
    constructor(options?: IValidationOptions);
}
export {};
