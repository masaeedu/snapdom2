const { Components, wt } = require("./lib");

const { counter } = Components;
const target = wt(document.getElementById("app"));

const render = s => target(counter(x => () => render(x)())(s));
render(0)();
