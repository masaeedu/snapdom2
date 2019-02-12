const { mdo } = require("@masaeedu/do");
const { match } = require("@masaeedu/adt");
const { Fn, Obj, Arr } = require("@masaeedu/fp");

const cata = F => alg => {
  const rec = x => F.map(rec)(alg(x));
  return rec;
};

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
  const modify = l => f => s => l.update(s)(f(l.view(s)));

  return { prop, view, update, modify };
})();
const { view, update } = Lens;

// :: type MonadUpdate s u m = (Monad m) & { put: u -> m (), get: m s }
// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = Maybe (v -> m (Target m v))

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

// :: Lens s u s' u' -> Component m s u v -> Component m s' u' v
const refocus = l => cmp => set_ => s_ => {
  const s = view(l)(s_);
  const set = Fn.contramap(update(l)(s_))(set_);
  return cmp(set)(s);
};

// Take a dictionary of components and make a component that
// operates on the corresponding dictionary
const refocusMany = many => set => s =>
  Fn.passthru(many)([
    Obj.mapWithKey(k => refocus(Lens.prop(k))),
    Obj.foldMap(Arr)(c => [c(set)(s)]),
    cs => ["div", ...cs]
  ]);

module.exports = { cata, Lens, snap, refocus, refocusMany };
