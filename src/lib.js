const { Fn, Obj, Arr } = require("@masaeedu/fp");

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

  return { prop, view, update };
})();
const { view, update } = Lens;

// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = v -> m ()

// :: Lens s u s' u' -> Component m s u v -> Component m s' u' v
const refocus = l => cmp => set_ => s_ => {
  const s = view(l)(s_);
  const set = Fn.contramap(update(l)(s_))(set_);
  return cmp(set)(s);
};

// Take a dictionary of components and make a component that
// operates on the corresponding dictionary
const refocusMany = sep => wrap => many => set => s =>
  wrap(
    Fn.passthru(many)([
      Obj.mapWithKey(k => refocus(Lens.prop(k))),
      Obj.foldMap(Arr)(c => [sep(c(set)(s))])
    ])
  );

module.exports = { Lens, refocus, refocusMany };
