const snabbdom = require("snabbdom/snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

// :: type Lens a b s t = { view: s -> a, update: s -> b -> t }
const Lens = (() => {
  // :: k -> Lens v v' { [k]: v } { [k]: v' }
  const prop = k => {
    const view = ({ [k]: v }) => v;
    const update = s => v_ => ({ ...s, [k]: v_ });

    return { view, update };
  };

  const view = l => l.view;
  const update = l => l.update;

  return { prop, view, update };
})();
const { view, update } = Lens;

const Fn = (() => {
  // :: (i' -> i) -> (i -> o) -> (i' -> o)
  const contramap = f => g => i_ => g(f(i_));

  return { contramap };
})();

// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = v -> m ()
// :: type StateManager m s u = {
// ::   get: (s -> m x) -> m x,
// ::   set: u -> m ()
// :: }

// :: type WebComponent s = Component IO! s s VDom
// :: type WebTarget = Target IO! VDom
// :: type WebStateManager s = StateManager IO! s s

// :: Lens s u s' u' -> Component m s u v -> Component m s' u' v
const refocus = l => cmp => set_ => s_ => {
  const s = view(l)(s_);
  const set = Fn.contramap(update(l)(s_))(set_);
  return cmp(set)(s);
};

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

  // :: WebComponent JSValue
  const json = _ => x => h("pre", [h("code", JSON.stringify(x))]);

  // :: WebComponent { count: Integer, pressed: Boolean }
  const ui = set => s =>
    h("div", [
      refocus(Lens.prop("count"))(counter)(set)(s),
      refocus(Lens.prop("pressed"))(spring)(set)(s),
      json(set)(s)
    ]);

  return { counter, spring, json, ui };
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
