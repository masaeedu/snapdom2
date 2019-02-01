const snabbdom = require("snabbdom/snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = v -> m ()
// :: type StateManager m s u = {
// ::   get: (s -> m x) -> m x,
// ::   set: u -> m ()
// :: }

// :: type WebComponent s = Component IO! s s VDom
// :: type WebTarget = Target IO! VDom
// :: type WebStateManager s = StateManager IO! s s

const Components = (() => {
  // :: WebComponent Integer
  const counter = set => i =>
    h("div", [
      `The current count is ${i}`,
      h("button", { on: { click: set(i + 1) } }, "+"),
      h("button", { on: { click: set(i - 1) } }, "-")
    ]);

  // :: WebComponent Boolean
  const spring = set => pressed =>
    h(
      "button",
      {
        on: {
          mousedown: set(true),
          mouseleave: set(false),
          mouseup: set(false),
          mouseenter: e => (e.buttons === 1 ? set(true)() : set(false)())
        }
      },
      pressed ? "Under pressure!" : "Press me!"
    );

  return { counter, spring };
})();

// :: HTMLElement -> WebTarget
const wt = mountpoint => {
  let oldVDom;
  return vdom => () => {
    patch(oldVDom || mountpoint, vdom);
    oldVDom = vdom;
  };
};

module.exports = { Components, wt };
