import _ from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import css from "./assets/sass/basic.scss";
require("angular");
let app = angular.module("ara", [require("angular-route")]);
var chrono = require("chrono-node");

app.config(function($routeProvider) {
	$routeProvider.when("/:user1/:user2/:lang", {
		templateUrl : "./views/messages.html?v=" + Math.floor(Math.random() * 1000),
		controller: "messages"
	}).when("/:user1/:user2", {
		templateUrl : "./views/messages.html?v=" + Math.floor(Math.random() * 1000),
		controller: "messages"
	});
});

app.controller("messages", function($scope, $interval, $http, $routeParams) {
	$scope.user1 = $routeParams["user1"];
	$scope.user2 = $routeParams["user2"];
	$scope.lang = $routeParams["lang"];
	$http.get("http://198.211.125.182:5000/chat?user1=" + $scope.user1 + "&user2=" + $scope.user2).then(function(response) {
		$scope.messages = response.data;
		sessionStorage.translatedMessages = JSON.stringify([]);
		if ($scope.lang != "en" && $scope.lang != null) {
			var t = JSON.parse(sessionStorage.translatedMessages);
			for (var i = 0; i < $scope.messages.length; i++) {
				$http.get("http://198.211.125.182:5000/chat?user1=anand&user2=ara").then(function() {
					// $scope.messages[i].text = "ABC";
					// $scope.messages[0].text = "ABC";
					console.log($scope.messages[i]);
				});
			}
		}
		var currLength = $scope.messages.length;
		$interval(function() {
			$http.get("http://198.211.125.182:5000/chat?user1=" + $scope.user1 + "&user2=" + $scope.user2).then(function(response) {
				if (response.data.length != currLength) {
					$scope.messages = response.data;
					currLength = $scope.messages.length;
					if (sessionStorage.speaking == 1 && $scope.messages[$scope.messages.length - 1].from == "ara") {
						responsiveVoice.speak($scope.messages[$scope.messages.length - 1].text);
					}
				}
			});
		}, 5000);
		$interval(function() {
			if (sessionStorage.speaking == 1) {
				$http.get("http://198.211.125.182:5000/message-list?to=" + $routeParams["user1"]).then(function(response) {
					if (($scope.lastMessage != response.data.text) && $scope.lastAuthor != "ara" && response.data.text.indexOf("You have a new message from ara") == -1) {
						if ($scope.lastMessage) {
							console.log("yes last message");
							$scope.lastMessage = response.data.text;
							var text = "You have a new message from " + response.data.from + ": " + response.data.text;
							$scope.messages.push({
								from: "ara",
								to: $scope.user1,
								text: text,
								datetime: chrono.parseDate("right now")
							});
							$http.post("http://198.211.125.182:5000/chat", {
								from: "ara",
								to: $scope.user1,
								text: text,
								datetime: chrono.parseDate("right now")
							});
							responsiveVoice.speak(text);
						} else {
							console.log("no last message");
						}
					}
				});
			}
		}, 5000);
	});
	sessionStorage.speaking = 0;
	$scope.sendMessage = function() {
		$scope.messages.push({
			from: $scope.user1,
			to: $scope.user2,
			text: $scope.messageModel,
			datetime: chrono.parseDate("right now")
		});
		var a = 0;
		var handsFree = ["handsfree", "driving", "drive"];
		for (var i = 0; i < handsFree.length; i++) {
			if ($scope.messageModel.toLowerCase().indexOf(handsFree[i]) != -1) {
				a++;
			}
		}
		if (a == 0) {
			setTimeout(function() {
				$scope.typing = 1;
			}, 100);
			$http.post("http://198.211.125.182:5000/chat", {
				from: $scope.user1,
				to: $scope.user2,
				text: $scope.messageModel,
				datetime: chrono.parseDate("right now")
			}).then(function(response) {
				console.log("sent");
			});
			$scope.messageModel = "";
		} else if ($scope.user2 == "ara") {
			responsiveVoice.speak("Okay, I'll read your messages now. Drive safe!");
			$http.get("http://198.211.125.182:5000/message-list?to=" + $routeParams["user1"]).then(function(response) {
				$scope.lastMessage = response.data.text;
				$scope.lastAuthor = response.data.from;
			});
			sessionStorage.speaking = 1;
			$scope.messages.push({
				from: "ara",
				to: $scope.user1,
				text: "Okay, I'll read out your messages. Drive safe!"
			});
			$scope.messageModel = "";
		}
	}
	$scope.sendLike = function() {
		$scope.messageModel = "👍";
		$scope.sendMessage();
		$scope.messageModel = "";
	}
	$interval(function() {
		if (sessionStorage.responseMe) {
			$scope.messageModel = capitalizeFirstLetter(sessionStorage.responseMe);
			$scope.sendMessage();
			$scope.messageModel = "";
			sessionStorage.removeItem("responseMe");
		}
	}, 200);
	$scope.speechtoText = function() {
		listen().then(function(response) {
			sessionStorage.responseMe = response;
		});
	}
	var listen = function() {
		return new Promise(
			function (resolve, reject) {
				var recognition = new webkitSpeechRecognition();
				recognition.start();
				recognition.interimResults = false;				
				recognition.onresult = function(event) {
					resolve(event.results[0][0].transcript);
				}
				recognition.onerror = function() {
					reject("error");
				}
			}
		);
	}
});

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function isEquivalent(a, b) {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }
    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];

        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}