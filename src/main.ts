import "./styles.css";
import { CALCULATORS } from "./calculators";
import { mount } from "./ui/mount";

// ?embed shows only the calculator and a credit line, for use in an <iframe>.
if (new URLSearchParams(window.location.search).has("embed")) {
  document.documentElement.classList.add("embed");
}

const root = document.getElementById("calc");
const calculator = root?.dataset.calc ? CALCULATORS[root.dataset.calc] : undefined;
if (root && calculator) mount(root, calculator);
