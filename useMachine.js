import { onCleanup, batch } from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import { interpret } from "xstate";

// WARNING: This is a PoC and a bit hacky
// I could have done a gone with treating the store as simple signal
// like Svelte, React, Vue implementations.
// Instead wanted to see if with a little hacking we could make
// it work granularly.This should improve performance on larger objects.
export function useMachine(machine, options = {}) {
  const service = interpret(machine, options).start();

  const { context, value, matches } = service.initialState;

  const [state, setState] = createStore({
    context,
    value,
    matches
  });
  service.onTransition((s) => {
    // only focus on stuff that actually changes
    s.changed &&
      batch(() => {
        setState("value", s.value);
        // diff data to only update values that changes
        setState("context", reconcile(s.context));
        setState("matches", () => s.matches);
      });
  });

  service.start();
  onCleanup(() => service.stop());

  return [state, service.send];
}
