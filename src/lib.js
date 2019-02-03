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

const Fn = (() => {
  // :: (i' -> i) -> (i -> o) -> (i' -> o)
  const contramap = f => g => i_ => g(f(i_));

  return { contramap };
})();

// :: type Component m s u v = (u -> m ()) -> s -> v
// :: type Target m v = v -> m ()

// :: Lens s u s' u' -> Component m s u v -> Component m s' u' v
const refocus = l => cmp => set_ => s_ => {
  const s = view(l)(s_);
  const set = Fn.contramap(update(l)(s_))(set_);
  return cmp(set)(s);
};

module.exports = { Lens, Fn, refocus };
