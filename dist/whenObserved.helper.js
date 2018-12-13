import { onBecomeObserved, onBecomeUnobserved } from 'mobx';
export function whenObserved(obj, propeprties, onObserved, onUnobserved) {
    propeprties.forEach(propeprty => {
        let res;
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
//# sourceMappingURL=whenObserved.helper.js.map