const { Components, wt } = require("./lib");

const snap = cmp => target => {
  const rec = s => target(cmp(x => () => rec(x)())(s));
  return rec;
};

const { counter, spring } = Components;
const render = snap(spring)(wt(document.getElementById("app")));

render(false)();
