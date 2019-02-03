const { Components, domTarget } = require("./snabbdom");

const snap = cmp => target => {
  const rec = s => target(cmp(x => () => rec(x)())(s));
  return rec;
};

const { counter, spring, json, ui } = Components;
const render = snap(ui)(domTarget(document.getElementById("app")));

render({ count: 0, pressed: false })();
