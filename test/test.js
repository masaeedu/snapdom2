const test = require("ava");
const { adt, match } = require("@masaeedu/adt");
const { Arr, Fn, State } = require("@masaeedu/fp");

// :: type VDom m = [ElementName, Attributes m, (VDom m)[]]

// More structured way of unpacking vdom nodes
const VDom = {
  // :: { Node: ElementName -> Attributes m -> (VDom m)[] -> x } -> VDom m -> x
  match: ({ Node }) => Fn.uncurry(Node)
};

// :: ADT '{ Event: '[Int[], String] }
const { Event } = adt({ Event: ["Int[]", "String"] });

// :: String -> VDom m -> m ()
const effectOf = name =>
  VDom.match({
    Node: _ => attr => _ => attr.on[name]
  });

// :: VDom m -> Event -> m ()
const interpretEvent = vdom =>
  match({
    Event: path => name => {
      const pickChild = i => VDom.match({ Node: _ => _ => cs => cs[i] });
      const node = Fn.pipe(Arr.map(pickChild)(path))(vdom);

      return effectOf(name)(node);
    }
  });

// :: Component m s s (VDom m) -> Event[] -> State s ()
const simulate = cmp => {
  const { get, put } = State;

  // :: Event[] -> State s ()
  const rec = Arr.match({
    Nil: State.of(undefined),
    Cons: e => es =>
      State[">>="](get)(s => {
        const vdom = cmp(x => State[">>"](put(x))(rec(es)))(s);
        return interpretEvent(vdom)(e);
      })
  });

  return rec;
};

// :: Component m Int Int (VDom m)
const counter = set => i => [
  "div",
  {},
  [
    ["button", { on: { click: set(i + 1) } }, "+"],
    ["span", {}, `${i}`],
    ["button", { on: { click: set(i - 1) } }, "-"]
  ]
];

test("incrementing five times and decrementing thrice gives a final state of 2", t => {
  const inc = Event([0])("click");
  const dec = Event([2])("click");

  const events = [inc, inc, inc, inc, dec, inc, dec, dec];
  const result = simulate(counter)(events)(0);
  t.snapshot(result);
});
