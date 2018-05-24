const functions = require('firebase-functions');
const admin = require('firebase-admin');
 
admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

exports.helloWorld = functions.https.onRequest((request, response) => {
 response.send("Hello from Tirgei!");
});

exports.welcomeUser = functions.database.ref('/users/{key}').onCreate((snapshot, context) => {
	const user = snapshot.val();

	const name = user.username;
	const token = user.token;

	const payload = {
		data: {
			title: "\"Welcome " + name +"\"",
			message: "\"We hope you'll enjoy the app\"",
			image: "",
			timestamp: new Date().getTime().toString()
		}
	};

	return admin.messaging().sendToDevice(token, payload);
	
});

exports.mpesaCallback = functions.https.onRequest((request, response) => {
	if(request.method === 'PUT'){
		response.status(400).send("ERROR: BAD REQUEST");
	}

	const userToken = request.query.token;

	const payload = {
		data: {
			type: "topup"
		}
	}

	admin.messaging().sendToDevice(userToken, payload)
	.then(function (res) {
		response.status(200).send("Notification sent");
	})
	.catch(function (error){
		console.log("Error sending notification:" + error);
	});

});
