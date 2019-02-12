const { match } = require("@masaeedu/adt");
const {
  Fn,
  Arr,
  ReaderT,
  Maybe,
  Cont,
  implement,
  Chain,
  Apply,
  Functor
} = require("@masaeedu/fp");
const { snap } = require("./lib");
const { MyCmp, domTarget } = require("./snabbdom");

const ior = { v: { count: 0, pressed: false, text: "" } };

// :: type ApplyAction s u = { applyAction: u -> s -> s }
// :: ApplyAction s u -> MonadUpdate s u Cont!
const IORefUpdate = A => {
  const get = cb => {
    cb(ior.v);
  };
  const put = u => cb => {
    const s = A.applyAction(u)(ior.v);
    if (JSON.stringify(ior.v) === JSON.stringify(s)) return;

    ior.v = s;
    cb();
  };

  return { get, put, ...Cont };
};

// :: ApplyAction s s
const Const = { applyAction: s => _ => s };

// :: type MonadState s m = MonadUpdate s s m
// :: MonadState s Cont!
const IORefState = IORefUpdate(Const);

const { counter, spring, json, ui } = MyCmp;
// :: Cont! ()
const render = snap(IORefState)(ui)(domTarget(document.getElementById("app")));

render(_ => {});
