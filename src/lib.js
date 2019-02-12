const { mdo } = require("@masaeedu/do");
const { match } = require("@masaeedu/adt");
const { Fn, Obj, Arr, ReaderT, Lens } = require("@masaeedu/fp");

// :: type MonadUpdate s u m = (Monad m) & { put: u -> m (), get: m s }
// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = Maybe (v -> m (Target m v))

// Components are essentially just functions of two arguments, and therefore share the same monad instance
// :: Monad (Component m s u)
const Cmp = ReaderT(Fn);

// :: MonadUpdate s u m -> Component m s u v -> Target m v -> m ()
const snap = M => cmp => {
  // :: Target m v -> m ()
  const rec = match({
    Nothing: M.of(undefined),
    Just: render =>
      mdo(M)(({ s, v, t }) => [
        [s, () => M.get],
        [v, () => M.of(cmp(M.put)(s))],
        [t, () => render(v)],
        () => rec(t)
      ])
  });

  return rec;
};

const { view, update, prop } = Lens;
// :: Lens s u s' u' -> Component m s u v -> Component m s' u' v
const refocus = l => cmp => set_ => s_ => {
  const s = view(l)(s_);
  const set = Fn.contramap(update(l)(s_))(set_);
  return cmp(set)(s);
};

// Take a dictionary of components and make a component that
// operates on the corresponding dictionary
const refocusMany = Fn.pipe([
  Obj.traverseWithKey(Cmp)(k => refocus(prop(k))),
  Cmp.map(Obj.foldMapWithKey(Arr)(k => v => [["label", k], v])),
  Cmp.map(cs => ["div", ...cs])
]);

module.exports = { Cmp, snap, refocus, refocusMany };
