import _ from "lodash";
import css from "./assets/sass/basic.scss";

function component() {
	var element = document.createElement("div");
	element.innerHTML = _.join(["Hello", "webpack"], " ");
	return element;
}

document.body.appendChild(component());

require("angular");
let app = angular.module("ara", []);