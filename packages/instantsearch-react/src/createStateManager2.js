import has from 'lodash/object/has';

export default function createStateManager(
  initialState,
  onUpdate,
  getURLForState
) {
  const hasOnUpdate = typeof onUpdate !== 'undefined';
  const widgets = [];
  const listeners = [];
  let state = initialState;
  let batched = false;

  function applyState() {
    onUpdate(state, widgets.map(w => w.refiner));
  }

  // The state manager's updates need to be batched since many components can
  // register or unregister their refiners during the same tick. We only ever
  // want to apply an update once per tick.
  function batchUpdate() {
    if (!hasOnUpdate || batched) {
      return;
    }
    batched = true;
    process.nextTick(() => {
      batched = false;
      applyState();
    });
  }

  function dispatch() {
    listeners.forEach(listener => listener());
  }

  return {
    subscribe(listener) {
      listeners.push(listener);
      return function unsubscribe() {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    },

    registerWidget(id, refiner) {
      const widget = {id, refiner};
      widgets.push(widget);
      batchUpdate();
      return function unregisterWidget() {
        widgets.splice(widgets.indexOf(widget), 1);
      };
    },

    getWidgetsIds() {
      return widgets.map(w => w.id);
    },

    markDirty() {
      batchUpdate();
    },
    hasWidgetState(id) {
      return has(state, id);
    },
    getWidgetState(id) {
      return state[id];
    },
    setWidgetState(id, widgetState) {
      state = {
        ...state,
        [id]: widgetState,
      };
      dispatch();
      batchUpdate();
    },
    setState(nextState) {
      state = nextState;
      dispatch();
      batchUpdate();
    },
    getURLForState(id, widgetState) {
      const nextState = {
        ...state,
        [id]: widgetState,
      };
      return getURLForState(nextState);
    },
  };
}
