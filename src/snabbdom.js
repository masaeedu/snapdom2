const snabbdom = require("snabbdom");
const patch = snabbdom.init([
  require("snabbdom/modules/eventlisteners").default
]);
const h = require("snabbdom/h").default;

const {
  Fn,
  Arr,
  Obj,
  Maybe,
  Cont,
  ReaderT,
  Lens,
  cata,
  ana
} = require("@masaeedu/fp");

const { Cmp, refocus, refocusMany } = require("./lib");

const { prop, modify } = Lens;

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

  // :: Attributes Cont! -> SnabbdomAttributes
  const convertHandlers = modify(prop("on"))(Obj.map(h => e => h(e)(_ => {})));

  // :: VDom Cont! -> Snabbdom
  const v2s = (() => {
    const alg = match({
      Text: s => s,
      Node: el => attr => cs => h(el, convertHandlers(attr), cs)
    });

    return cata({ map })(alg);
  })();

  // :: Cont! () -> VDom Cont! -> VDom Cont!
  const extendHandlers = proceed => {
    const alg = match({
      Text,
      Node: el =>
        Fn.pipe([
          modify(prop("on"))(Obj.map(h => e => Cont[">>"](h(e))(proceed))),
          Node(el)
        ])
    });

    return cata({ map })(alg);
  };

  return { Text, Node, match, map, v2s, extendHandlers };
})();
const { Text, Node } = VDomF;

// :: type VDom m = Fix (VDomF m)

// The specialized components we're going to be working with. These components are polymorphic with respect to the update effect, use an entire new state as the update message, and use the simple s-expr-like vdom representation encoded above
// :: type Component' s = forall m. Component m s s (VDom m)

const MyCmp = (() => {
  // :: Component' Integer
  const counter = set => i => [
    "div",
    ["button", { on: { click: _ => set(i + 1) } }, "+"],
    ["span", `${i}`],
    ["button", { on: { click: _ => set(i - 1) } }, "-"]
  ];

  // :: Component' Boolean
  const spring = set => pressed => {
    const mousedown = _ => set(true);
    const mouseup = _ => set(false);
    const mouseleave = _ => set(false);
    const mouseenter = e => (e.buttons === 1 ? set(true) : set(false));

    const on = { mousedown, mouseup, mouseleave, mouseenter };
    return ["button", { on }, pressed ? "Under pressure!" : "Press me!"];
  };

  // :: Component' String
  const input = set => value => [
    "input",
    { value, on: { input: e => set(e.target.value) } }
  ];

  // :: Component' JSValue
  const json = _ => x => ["pre", ["code", JSON.stringify(x)]];

  // :: type SomeState = { count: Integer, pressed: Boolean, text: String }

  const div = v => ["div", v];

  // :: Component' SomeState
  const editor = refocusMany({
    count: Cmp.map(div)(counter),
    pressed: Cmp.map(div)(spring),
    text: Cmp.map(div)(input)
  });

  // :: Component' SomeState
  const ui = Cmp.map(cs => ["div", ...cs])(Arr.sequence(Cmp)([json, editor]));

  return { counter, spring, input, json, editor, ui };
})();

// :: type DOMTarget = Target Cont! (VDom Cont!)

// :: HTMLElement -> DOMTarget
const domTarget = mountpoint => {
  const { Just, Nothing } = Maybe;
  let oldVDom;

  // :: Maybe (v -> Cont! DOMTarget)
  const t = Just(vdom => cb => {
    // :: Cont!
    const proceed = cb_ => {
      cb(t);
      cb_();
    };
    // Sequence the callback onto all the handlers,
    // where it will be fed the same target
    const vdom_ = VDomF.v2s(VDomF.extendHandlers(proceed)(vdom));
    patch(oldVDom || mountpoint, vdom_);
    oldVDom = vdom_;
  });

  return t;
};

module.exports = { VDomF, MyCmp, domTarget };
