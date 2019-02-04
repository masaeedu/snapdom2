const test = require("ava");
const { adt, match } = require("@masaeedu/adt");
const { Arr, Fn, State, Maybe, log } = require("@masaeedu/fp");

// :: type VDom m = String | '[ElementName, Attributes m, (VDom m)[]]
const VDom = {
  Text: s => s,
  Node: el => attr => cs => [el, attr, cs],
  match: ({ Text, Node }) => x =>
    typeof x === "string" ? Text(x) : Fn.uncurry(Node)(x)
};

// :: ADT '{ Event: '[Int[], String] }
const { Event } = adt({ Event: ["Int[]", "String"] });

// :: String -> VDom m -> m ()
const effectOf = name =>
  VDom.match({
    Node: _ => attr => _ => attr.on[name]
  });

// Warning: partial, non-existent index will give you undefined
// :: Int -> VDom m -> VDom m
const pickChild = i => VDom.match({ Node: _ => _ => cs => cs[i] });

// ::  Event -> VDom m -> m ()
const interpretEvent = match({
  Event: path => name => {
    const pickTarget = Fn.pipe(Arr.map(pickChild)(path));

    return vdom => effectOf(name)(pickTarget(vdom));
  }
});

// :: type Target m v = Maybe (v -> m (Target m v))

// :: Monad m -> Event[] -> Target m v
const interpretEvents = M => {
  const { Nothing, Just } = Maybe;

  // :: Event[] -> Target m v
  const rec = Arr.match({
    Nil: Nothing,
    Cons: e => es => Just(v => M["<$"](rec(es))(interpretEvent(e)(v)))
  });

  return rec;
};

// :: MonadState s m -> Component m s s v -> Target m v -> m ()
const snap = M => cmp => {
  // :: Target m v -> m ()
  const rec = match({
    Nothing: M.of(undefined),
    Just: render =>
      M[">>="](M.get)(Fn.pipe([cmp(M.put), render, M["=<<"](rec)]))
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
  const result = snap(State)(counter)(interpretEvents(State)(events))(0);
  t.snapshot(result);
});
