const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

const { Fn, Arr, Obj, Maybe, Cont } = require("@masaeedu/fp");

const { cata, Lens, refocus, refocusMany } = require("./lib");

// :: type Handlers m = { [EventName]: Event -> m () } // TODO: Revisit this, can be more sound
// :: type Attributes m = { on: Handlers m }
// :: type VDomF m a = String | '[ElementName, ...('[] | '[Attributes m]), ...[a]]
const VDomF = (() => {
  const Text = s => s;
  const Node = el => attr => cs => [el, attr, ...cs];
  const match = ({ Text, Node }) => x => {
    if (typeof x === "string") return Text(x);

    if (x.length === 1) return Node(x[0])({ on: {} })([]);

    if (!Array.isArray(x[1]) && typeof x[1] !== "string") {
      const [el, attr, ...cs] = x;
      const attr_ = attr.on ? attr : { ...attr, on: {} };
      return Node(el)(attr_)(cs);
    }

    const [el, ...cs] = x;
    return Node(el)({ on: {} })(cs);
  };

  const map = f =>
    match({
      Text,
      Node: el => attr => cs => Node(el)(attr)(Arr.map(f)(cs))
    });

  return { Text, Node, match, map };
})();
const { Text, Node } = VDomF;

// :: type VDom m = Fix (VDomF m)

// :: type Component' m s v = Component m s s v

const Cmp = (() => {
  // :: Component' m Integer VDom
  const counter = set => i => [
    "div",
    ["button", { on: { click: _ => set(i + 1) } }, "+"],
    ["span", `${i}`],
    ["button", { on: { click: _ => set(i - 1) } }, "-"]
  ];

  // :: Component' m Boolean VDom
  const spring = set => pressed => [
    "button",
    {
      on: {
        mousedown: _ => set(true),
        mouseup: _ => set(false),
        mouseleave: _ => set(false),
        mouseenter: e => (e.buttons === 1 ? set(true) : set(false))
      }
    },
    pressed ? "Under pressure!" : "Press me!"
  ];

  // :: Component' m String VDom
  const input = set => value => [
    "input",
    { value, on: { input: e => set(e.target.value) } }
  ];

  // :: Component' m JSValue VDom
  const json = _ => x => ["pre", ["code", JSON.stringify(x)]];

  // :: type SomeState = { count: Integer, pressed: Boolean, text: String }

  // :: Component' m SomeState VDom
  const editor = refocusMany({
    count: counter,
    pressed: spring,
    text: input
  });

  // :: Component' m SomeState VDom
  const ui = set => s => ["div", json(set)(s), editor(set)(s)];

  return { counter, spring, input, json, ui };
})();

// This is where we monomorphize the effect and tie ourselves
// to Snabbdom

const { prop, modify } = Lens;

// :: Attributes Cont! -> SnabbdomAttributes
const convertHandlers = modify(prop("on"))(Obj.map(h => e => h(e)(_ => {})));

// :: VDom Cont! -> Snabbdom
const v2s = VDomF.match({
  Text: s => s,
  Node: el => attr => cs => h(el, convertHandlers(attr), Arr.map(v2s)(cs))
});

// :: Cont! () -> VDom Cont! -> VDom Cont!
const extendHandlers = proceed => {
  const alg = VDomF.match({
    Text,
    Node: el =>
      Fn.pipe([
        modify(prop("on"))(Obj.map(h => e => Cont[">>"](h(e))(proceed))),
        Node(el)
      ])
  });
  return cata(VDomF)(alg);
};

// :: type DOMTarget = Target Cont! (VDom Cont!)

// :: HTMLElement -> DOMTarget
const domTarget = mountpoint => {
  const { Just, Nothing } = Maybe;
  let oldVDom;

  // :: Maybe (v -> Cont! DOMTarget)
  const rec = Just(vdom => cb => {
    // :: Cont!
    const proceed = cb_ => {
      cb(rec);
      cb_();
    };
    // Sequence the callback onto all the handlers,
    // where it will be fed the target again
    const vdom_ = v2s(extendHandlers(proceed)(vdom));
    patch(oldVDom || mountpoint, vdom_);
    oldVDom = vdom_;
  });

  return rec;
};

module.exports = { VDomF, Cmp, domTarget };
