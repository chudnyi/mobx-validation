declare type Validation<R> = (value: any) => R | Promise<R>;
declare type ValidationError = string;
declare type ErrorFormatter<R> = (result: R) => ValidationError;
declare type ValidWhen<R> = (result: R) => boolean;
export declare const defaultValidatorOptions: IValidatorOptionsValues;
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
interface IValidationsCollection extends Array<IRule<any>> {
    add<R>(validation: Validation<R>): IRule<R>;
}
export declare class ValidationsCollection extends Array<IRule<any>> implements IValidationsCollection {
    add<R>(validation: Validation<R>): IRule<R>;
}
interface IValidationsOwner {
    readonly validations: IValidationsCollection;
}
export interface IValueValidator extends IValidationsOwner {
    validate(input: any): Promise<ValidationError[] | undefined>;
}
export declare class ValueValidator implements IValueValidator {
    readonly validations: IValidationsCollection;
    validate(input: any): Promise<ValidationError[] | undefined>;
}
interface IValidatorOptionsValues {
    readonly validateOnChange: boolean;
    readonly validateOnFocus: boolean;
    readonly validateOnBlur: boolean;
    readonly hideErrorsOnChange: boolean;
    readonly hideErrorsOnFocus: boolean;
    readonly hideErrorsOnBlur: boolean;
}
export declare type IValidatorOptions = Partial<IValidatorOptionsValues>;
interface IValidationContext {
    readonly validatorOptions: IValidatorOptionsValues;
}
interface IValidationContextOptions {
    validatorOptions?: IValidatorOptionsValues;
}
export declare class ValidationContext implements IValidationContext {
    validatorOptions: IValidatorOptionsValues;
    constructor(options?: IValidationContextOptions);
}
declare type ValueParser<V> = (inputValue?: string) => V | undefined;
declare type ValueFormatter<V> = (value?: V) => string | undefined;
interface IFormField<V> extends IValidationsOwner {
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
export declare class FormField<V> implements IFormField<V> {
    private _options;
    private _inputValue?;
    private _errors?;
    private _isErrorsVisible;
    private _parser?;
    private _formatter?;
    private _valueValidator;
    constructor(_options?: IValidatorOptions);
    readonly inputValue: string | undefined;
    readonly parsedValue: V | undefined;
    readonly formattedValue: string | undefined;
    readonly isValid: boolean;
    readonly errors: ValidationError[] | undefined;
    readonly firstError: ValidationError | undefined;
    readonly firstErrorAsArray: [ValidationError] | undefined;
    readonly validations: IValidationsCollection;
    setInputValue(inputValue?: string): void;
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
export declare type IFormFields<T extends object> = {
    [P in keyof T]: IFormField<T[P]>;
};
export interface IFormValidator<T extends object> {
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    validate(): Promise<T | undefined>;
    validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
    setFields(fields: IFormFields<T>): void;
}
export declare class FormValidator<T extends object> implements IFormValidator<T> {
    private _fields?;
    setFields(fields: IFormFields<T>): void;
    readonly fields: IFormFields<T>;
    readonly isValid: boolean;
    validatePartial(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
    validate(): Promise<T | undefined>;
    validate(...fields: Array<keyof T>): Promise<Partial<T> | undefined>;
}
export declare class StringField extends FormField<string> {
    constructor(options?: IValidatorOptions);
}
export {};
