import _ from "lodash";
import "bootstrap/dist/css/bootstrap.min.css";
import css from "./assets/sass/basic.scss";
require("angular");

var moment = require("moment");

let app = angular.module("ara", [require("angular-route")]);
var chrono = require("chrono-node");

app.config(function($routeProvider) {
	$routeProvider.when("/:user1/:user2/:lang", {
		templateUrl: "./views/messages.html?v=" + Math.floor(Math.random() * 1000),
		controller: "messages"
	}).when("/:user1/:user2", {
		templateUrl: "./views/messages.html?v=" + Math.floor(Math.random() * 1000),
		controller: "messages"
	});
});

app.controller("messages", function($scope, $interval, $http, $routeParams, $timeout) {
	$scope.messages = [];
	$scope.user1 = $routeParams["user1"];
	$scope.user2 = $routeParams["user2"];
	$scope.lang = $routeParams["lang"];
	$scope.last = null;
	$scope.speaker = function(text) {
		if ($scope.last != text) {
			responsiveVoice.speak(text);
		}
		$scope.last = text;
	}
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
					if ($scope.messages[$scope.messages.length - 1].from == "ara") {
						$scope.newMessage($scope.messages[$scope.messages.length - 1]);
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
							$scope.newMessage(response.data);
						} else {
							console.log("no last message");
						}
					}
				});
			}
		}, 5000);
	});
	$scope.conversation = null;
	$scope.responster = null;

	$scope.followingup = "";
	$scope.boolReply = null;
	$scope.context = null;
	

	$scope.newMessage = function(message) {
		console.log(message);
		$scope.speaker(message.text);
		if (message.text.indexOf("wants to have a meeting with you") > -1) {
			$scope.boolReply = 1;
			$scope.context = message;
		}
	};


	$scope.reply = function(message, type) {
		var messageObject = {
			from: "ara",
			to: $scope["user1"],
			datetime: moment().format("MMMM Do YYYY, h:mm:ss a"),
			text: message
		};
		$scope.messages.push(messageObject);
		$scope.speaker(message);
		$http.post("http://198.211.125.182:5000/chat", messageObject);
	}


	$scope.sendMessage = function(message) {

		console.log($scope.followingup);

		if (message == null) message = $scope.messageModel;

		var messageObject = {
			from: $scope["user1"],
			to: $scope["user2"],
			datetime: moment().format("MMMM Do YYYY, h:mm:ss a"),
			text: message
		};
		
		$http.post("http://198.211.125.182:5000/chat", messageObject);
		$scope.messages.push(messageObject);

		if ($scope.followingup != "") {
			var messageContent = $scope.followingup + " " + message;
		} else {
			var messageContent = message;
		}

		$http.post("http://198.211.125.182:5000/parser", {
			query: messageContent
		}).then(function(response) {

			console.log(response.data);

			if ($scope.boolReply == 1) {
				if (response.data.intent == "affirmation") {
					$scope.boolReply = 0;
					var options = ["Alright, thanks!", "Okay, have a great meeting!", "Got it.", "Alright, sounds good!", "Sounds great, thanks!"];
					$scope.reply(options[Math.floor(Math.random() * options.length)]);
					console.log("YES");
					console.log($scope.context);
					var message = "Hi " + capitalizeFirstLetter($scope.context.organizer) + ", " + capitalizeFirstLetter($scope.user1) + " has confirmed your meeting " + moment($scope.context.datetime).calendar().toLocaleLowerCase();
					$http.post("http://198.211.125.182:5000/chat", {
						from: "ara",
						to: $scope.context.organizer,
						text: message,
						datetime: moment().format("MMMM Do YYYY, h:mm:ss a")
					});
					// $http.post("http://198.211.125.182:5000/chat", {
					// 	from: "ara",
					// 	to: a.toLowerCase().split(" ")[0],
					// 	text: "Hi " + capitalizeFirstLetter(a.toLowerCase().split(" ")[0]) + ", " + capitalizeFirstLetter($scope.user1) + " wants to have a meeting with you " + moment(b).calendar().toLowerCase() + ". You're free at " + moment(b).format("LT") + ". Should I finalize it?",
					// 	datetime: chrono.parseDate("right now")
					// }).then(function(response) {
					// 	$http.post("http://198.211.125.182:5000/chat", {
					// 		from: "ara",
					// 		to: $scope.user1,
					// 		text: message,
					// 		datetime: chrono.parseDate("right now")
					// 	}).then(function(response) {
					// 		$scope.speaker(message);
					// 		$scope.messages.push({
					// 			from: "ara",
					// 			to: $scope.user1,
					// 			text: message,
					// 			datetime: chrono.parseDate("right now")
					// 		});
					// 	});
					// });
				} else {
					var options = ["Aww, that's a bummer. What time do you prefer?"];
					$scope.reply(options[Math.floor(Math.random() * options.length)]);
				}
			
			} else if (response.data.meeting) {
				var p = 0;
				if (response.data.person == "") {
					$scope.reply("Who are you meeting?");
					$scope.followingup += " with " + message;
					p++;
				} else if (response.data.date == "") {
					$scope.reply("When is the meeting?");
					$scope.followingup += " at " + message;
					p++;
				} else if (response.data.time == "") {
					$scope.reply("What time is the meeting?");
					$scope.followingup += " " + message;
					p++;
				}
				console.log(p);
				if (p == 0) {
					$scope.followingup = "";
					var options = ["Alright, I'm on it!", "Okay, I'm on it!", "Got it.", "Alright, sounds good!", "Sounds great, I'm on it."];
					$scope.reply(options[Math.floor(Math.random() * options.length)]);
					var a = response.data.person;
					var b = response.data.date + " " + response.data.time;
					$timeout(function() {
						var message = "I've sent a message to " + a + " about your meeting " + moment(b).calendar().toLocaleLowerCase();
						$http.post("http://198.211.125.182:5000/chat", {
							from: "ara",
							organizer: $scope.user1,
							to: a.toLowerCase().split(" ")[0],
							text: "Hi " + capitalizeFirstLetter(a.toLowerCase().split(" ")[0]) + ", " + capitalizeFirstLetter($scope.user1) + " wants to have a meeting with you " + moment(b).calendar().toLowerCase() + ". You're free at " + moment(b).format("LT") + ". Should I finalize it?",
							datetime: chrono.parseDate("right now")
						}).then(function(response) {
							$http.post("http://198.211.125.182:5000/chat", {
								from: "ara",
								to: $scope.user1,
								text: message,
								datetime: chrono.parseDate("right now")
							}).then(function(response) {
								$scope.speaker(message);
								$scope.messages.push({
									from: "ara",
									to: $scope.user1,
									text: message,
									datetime: chrono.parseDate("right now")
								});
							});
						});
					}, 2000);
				}

			} else if (response.data.driving) {
				var options = ["Alright, have a safe drive! I'll keep you posted in case anything comes up.", "Alright, have a safe drive! I'll read out your messages now.", "Alright, I'll read out your messages now. Have a safe drive!", "Alright, I'll keep you posted in case anything comes up. Have a safe drive!"];
				$scope.reply(options[Math.floor(Math.random() * options.length)]);
			
			}

		});

		$scope.messageModel = "";

	}

	$scope.sendLike = function() {
		$scope.sendMessage("👍");
	}

	$scope.speaking = 0;
	$scope.speechtoText = function() {
		$scope.speaking = 1;
		listen().then(function(response) {
			$scope.sendMessage(response);
			$scope.speaking = 0;
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



	// $scope.meeting = function(a, b) {
	// 	$timeout(function() {
	// 		console.log(b);
	// 		var message = "I've sent a message to " + a + " about your meeting " + moment(b).calendar();
	// 		$http.post("http://198.211.125.182:5000/chat", {
	// 			from: "ara",
	// 			to: a.toLowerCase().split(" ")[0],
	// 			text: "Hi " + capitalizeFirstLetter(a.toLowerCase().split(" ")[0]) + ", " + capitalizeFirstLetter($scope.user1) + " wants to have a meeting with you " + moment(b).calendar() + ". You're free at " + moment(b).format("LT") + ". Should I finalize it?",
	// 			datetime: chrono.parseDate("right now")
	// 		}).then(function(response) {
	// 			$http.post("http://198.211.125.182:5000/chat", {
	// 				from: "ara",
	// 				to: $scope.user1,
	// 				text: message,
	// 				datetime: chrono.parseDate("right now")
	// 			}).then(function(response) {
	// 				$scope.speaker(message);
	// 				$scope.messages.push({
	// 					from: "ara",
	// 					to: $scope.user1,
	// 					text: message,
	// 					datetime: chrono.parseDate("right now")
	// 				});
	// 			});
	// 		});
	// 	}, 4000);
	// };
	// $scope.respond = function(a) {
	// 	setTimeout(function() {
	// 		$scope.typing = 1;
	// 	}, 100);
	// 	var message = $scope.responster;
	// 	switch(a) {
	// 		case "thanks":
	// 			var messages = ["Happy to help! 😊", "You're welcome! 😊", "Always happy to help! 😊", "No worries! 😊", "Let me know if you need anything else. 😊"];
	// 			message = messages[Math.floor(Math.random() * messages.length)];
	// 			break;
	// 		case "find_time":
	// 			console.log($scope.responster);
	// 			if (chrono.parseDate($scope.responster)) {
	// 				$scope.conversation = null;
	// 				message = "Sounds great, I'm on it";
	// 				$scope.meeting($scope.with, chrono.parseDate($scope.responster));
	// 			} else {
	// 				message += " When and where is it?";
	// 				$scope.conversation = "find_time";
	// 			}
	// 			break;
	// 		case "driving_mode":
	// 			message = "Okay, I'll read your messages now. Drive safe!";
	// 			sessionStorage.speaking = 1;
	// 			break;
	// 		case "meeting_schedule":
	// 			var withText = message.split("with")[1];
	// 			withText = withText.split(" ");
	// 			$scope.with = withText[1];
	// 			message = "Okay, I'll schedule your meeting with " + withText[1] + ".";
	// 			if (chrono.parseDate($scope.responster)) {
	// 				message = "Sounds great! I'm on it.";
	// 				$scope.meeting($scope.with, chrono.parseDate($scope.responster));
	// 			} else {
	// 				message += " When and where is it?";
	// 				$scope.conversation = "find_time";
	// 			}
	// 			break;
	// 	}
	// 	$timeout(function() {
	// 		console.log("responsing to " + a);
	// 		// var message = "I'm sorry, I don't understand.";
	// 		$http.post("http://198.211.125.182:5000/chat", {
	// 			from: "ara",
	// 			to: $scope.user1,
	// 			text: message,
	// 			datetime: chrono.parseDate("right now")
	// 		}).then(function(response) {
	// 			$scope.speaker(message);
	// 			$scope.messages.push({
	// 				from: "ara",
	// 				to: $scope.user1,
	// 				text: message,
	// 				datetime: chrono.parseDate("right now")
	// 			});
	// 			$scope.typing = 0;
	// 		});
	// 	}, 1000);
	// }
	// $scope.check = function(a, abc) {
	// 	return new Promise (
	// 		function (resolve, reject) {
	// 			if ($scope.conversation) {
	// 				$scope.responster = abc;
	// 				$scope.respond($scope.conversation);
	// 				$http.post("http://198.211.125.182:5000/chat", {
	// 					from: $scope.user1,
	// 					to: $scope.user2,
	// 					text: abc,
	// 					datetime: chrono.parseDate("right now")
	// 				}).then(function(response) {
	// 					resolve({
	// 						from: $scope.user1,
	// 						to: $scope.user2,
	// 						text: abc,
	// 						datetime: chrono.parseDate("right now")
	// 					});
	// 					$scope.messageModel = "";
	// 				});
	// 			} else {
	// 				if (a != "normal_function") {
	// 					$scope.responster = abc;
	// 					$scope.respond(a);
	// 					$http.post("http://198.211.125.182:5000/chat", {
	// 						from: $scope.user1,
	// 						to: $scope.user2,
	// 						text: abc,
	// 						datetime: chrono.parseDate("right now")
	// 					}).then(function(response) {
	// 						resolve({
	// 							from: $scope.user1,
	// 							to: $scope.user2,
	// 							text: abc,
	// 							datetime: chrono.parseDate("right now")
	// 						});
	// 						$scope.messageModel = "";
	// 					});
	// 				} else {
	// 					$http.post("http://198.211.125.182:5000/chat", {
	// 						from: $scope.user1,
	// 						to: $scope.user2,
	// 						text: abc,
	// 						datetime: chrono.parseDate("right now")
	// 					}).then(function(response) {
	// 						resolve({
	// 							from: $scope.user1,
	// 							to: $scope.user2,
	// 							text: abc,
	// 							datetime: chrono.parseDate("right now")
	// 						});
	// 						$scope.messageModel = "";
	// 					});
	// 				}
	// 			}
	// 		}
	// 	);
	// };
	// sessionStorage.speaking = 0;
	// $scope.sendMessage = function(abc) {
	// 	if (abc == null) {
	// 		abc = $scope.messageModel;
	// 	}
	// 	if ($scope.user2 == "ara") {
	// 		var text = abc.toLowerCase();
	// 		var messageOptions = [
	// 			{
	// 				callback: "driving_mode",
	// 				words: ["handsfree", "driving", "drive", "earphones"]
	// 			},
	// 			{
	// 				callback: "meeting_schedule",
	// 				words: ["meeting with", "coffee with", "dinner with", "lunch with"]
	// 			},
	// 			{
	// 				callback: "thanks",
	// 				words: ["thanks", "thank you"]
	// 			}
	// 		];
	// 		var answer = "normal_function";
	// 		for (var i = 0; i < messageOptions.length; i++) {
	// 			var a = 0;
	// 			for (var j = 0; j < messageOptions[i].words.length; j++) {
	// 				if (text.indexOf(messageOptions[i].words[j]) > -1) {
	// 					a++;
	// 					answer = messageOptions[i].callback;
	// 				}
	// 			}
	// 		}
	// 		$scope.check(answer, abc).then(function (response) {
	// 			$scope.messages.push(response);
	// 		});
	// 	}
	// 	// $scope.messages.push({
	// 	// 	from: $scope.user1,
	// 	// 	to: $scope.user2,
	// 	// 	text: $scope.messageModel,
	// 	// 	datetime: chrono.parseDate("right now")
	// 	// });
	// 	// var a = 0;
	// 	// var handsFree = ["handsfree", "driving", "drive"];
	// 	// for (var i = 0; i < handsFree.length; i++) {
	// 	// 	if ($scope.messageModel.toLowerCase().indexOf(handsFree[i]) != -1) {
	// 	// 		a++;
	// 	// 	}
	// 	// }
	// 	// if (a == 0) {
	// 	// } else if ($scope.user2 == "ara") {
	// 	// 	$scope.speaker("Okay, I'll read your messages now. Drive safe!");
	// 	// 	$http.get("http://198.211.125.182:5000/message-list?to=" + $routeParams["user1"]).then(function(response) {
	// 	// 		$scope.lastMessage = response.data.text;
	// 	// 		$scope.lastAuthor = response.data.from;
	// 	// 	});
	// 	// 	sessionStorage.speaking = 1;
	// 	// 	$scope.messages.push({
	// 	// 		from: "ara",
	// 	// 		to: $scope.user1,
	// 	// 		text: "Okay, I'll read out your messages. Drive safe!"
	// 	// 	});
	// 	// 	$scope.messageModel = "";
	// 	// }
	// 	// console.log($scope.messages);
	// }
	// $scope.sendLike = function() {
	// 	$scope.messageModel = "👍";
	// 	$scope.sendMessage();
	// 	$scope.messageModel = "";
	// }
	// $interval(function() {
	// 	if (sessionStorage.responseMe) {
	// 		$scope.sendMessage(capitalizeFirstLetter(sessionStorage.responseMe));
	// 		sessionStorage.removeItem("responseMe");
	// 	}
	// }, 200);
	// $scope.speechtoText = function() {
	// 	listen().then(function(response) {
	// 		sessionStorage.responseMe = response;
	// 	});
	// }
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