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
			image: "\"https://i1.wp.com/www.winhelponline.com/blog/wp-content/uploads/2017/12/user.png\"",
			timestamp: new Date().getTime().toString()
		}
	};

	return admin.messaging().sendToDevice(token, payload);
	
});

exports.confirmPayment = functions.https.onRequest((request, response) => {
	if(request.method === 'PUT'){
    	response.status(400).send("ERROR: BAD REQUEST");
  	}

  	const userID = request.query.id;
  	const userToken = request.query.token;

	//console.log("User ID " + userID + " and token " + userToken);

  	const payload = {
  		notification: {
  			title: "Transaction",
  			body: "Processing your transaction..."
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
