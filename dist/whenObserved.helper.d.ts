export declare function whenObserved<T extends object, R>(obj: T, propeprties: Array<keyof T>, onObserved: () => R, onUnobserved?: (res: R) => void): void;
