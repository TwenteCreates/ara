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

var chrono = require("chrono-node");
console.log(chrono.parseDate("An appointment on from Sep 12 from 1 pm to 2 pm"));