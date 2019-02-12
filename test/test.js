const test = require("ava");
const { adt, match } = require("@masaeedu/adt");
const { Arr, Fn, State, Maybe, log } = require("@masaeedu/fp");
const { snap } = require("../src/lib");
const { MyCmp, VDomF } = require("../src/snabbdom");

// :: ADT '{ Event: '[Int[], String, DOM.Event] }
const { Event } = adt({ Event: ["Int[]", "String", "DOM.Event"] });

// :: String -> DOM.Event -> VDom m -> m ()
const effectOf = name => e =>
  VDomF.match({
    Node: _ => attr => _ => attr.on[name](e)
  });

// Warning: partial, non-existent index will give you undefined
// :: Int -> VDom m -> VDom m
const pickChild = i => VDomF.match({ Node: _ => _ => cs => cs[i] });

// ::  Event -> VDom m -> m ()
const interpretEvent = match({
  Event: path => name => e => {
    const pickTarget = Fn.pipe(Arr.map(pickChild)(path));

    return vdom => effectOf(name)(e)(pickTarget(vdom));
  }
});

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

const { counter } = MyCmp;
test("incrementing five times and decrementing thrice gives a final state of 2", t => {
  const inc = Event([0])("click")({});
  const dec = Event([2])("click")({});

  const events = [inc, inc, inc, inc, dec, inc, dec, dec];
  const result = snap(State)(counter)(interpretEvents(State)(events))(0);
  t.snapshot(result);
});
