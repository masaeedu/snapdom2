const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;
const { Lens, Fn, refocus } = require("./lib");

// :: type WebComponent s = Component IO! s s VDom
// :: type WebTarget = Target IO! VDom

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
const domTarget = mountpoint => {
  let oldVDom;
  return vdom => () => {
    patch(oldVDom || mountpoint, vdom);
    oldVDom = vdom;
  };
};

module.exports = { Components, domTarget };
