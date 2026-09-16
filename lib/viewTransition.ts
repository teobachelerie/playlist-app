import { flushSync } from "react-dom";

// Déclenche une View Transition native (morphing entre deux états du DOM) —
// supportée par Safari 18+. flushSync force React à appliquer le changement
// d'état de façon synchrone : sans ça, l'API capture l'état "avant" et
// "après" avant même que React ait eu le temps de re-rendre, et il n'y a
// rien à animer.
export function withViewTransition(update: () => void) {
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(
      () => flushSync(update)
    );
  } else {
    update();
  }
}
