import { onBecomeObserved, onBecomeUnobserved } from 'mobx';

export function whenObserved<T extends object, R>(obj: T, propeprties: Array<keyof T>, onObserved: () => R, onUnobserved?: (res: R) => void) {
  propeprties.forEach(propeprty => {
    let res: R;
    onBecomeObserved(obj, propeprty, () => {
      res = onObserved();
    });
    if (onUnobserved) {
      onBecomeUnobserved(obj, propeprty, () => {
        onUnobserved(res);
      });
    }
  });
}
