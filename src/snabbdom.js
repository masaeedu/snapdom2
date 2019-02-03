const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;
const { Arr, Fn } = require("@masaeedu/fp");
const { Lens, refocus, refocusMany } = require("./lib");

// :: type WebComponent s = Component IO! s s VDom
// :: type WebTarget = Target IO! VDom

const Components = (() => {
  // :: WebComponent Integer
  const counter = set => i =>
    h("div", [
      h("button", { on: { click: set(i + 1) } }, "+"),
      h("span", `${i}`),
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

  // :: WebComponent String
  const input = set => value =>
    h("input", { value, on: { input: e => set(e.target.value)() } });

  // :: WebComponent JSValue
  const json = _ => x => h("pre", [h("code", JSON.stringify(x))]);

  // :: type SomeState = { count: Integer, pressed: Boolean, text: String }

  const div = cs => h("div", cs);

  // :: WebComponent SomeState
  const editor = refocusMany(div)(div)({
    count: counter,
    pressed: spring,
    text: input
  });

  // :: WebComponent SomeState
  const ui = set => s => {
    return h("div", [json(set)(s), editor(set)(s)]);
  };

  return { counter, spring, input, json, ui };
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
