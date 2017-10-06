import _ from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import css from "./assets/sass/basic.scss";

function component() {
	var element = document.createElement("div");
	element.innerHTML = _.join(["Hello", "from" + " Webpack!"], " ");
	return element;
}

document.body.appendChild(component());

require("angular");
let app = angular.module("ara", []);

var chrono = require("chrono-node");
console.log(chrono.parseDate("An appointment on from Sep 12 from 1 pm to 2 pm"));

app.controller("messages", function($scope) {
	$scope.messages = [
		{
			from: "ara",
			to: "anand",
			text: "Hello, I'm Ara!",
			datetime: "today"
		},
		{
			from: "anand",
			to: "ara",
			text: "Hi Ara, how are you?",
			datetime: "today"
		},
		{
			from: "ara",
			to: "anand",
			text: "I'm absolute great, thanks!",
			datetime: "today"
		},
		{
			from: "anand",
			to: "ara",
			text: "Now go home.",
			datetime: "today"
		}
	];
});