const functions = require('firebase-functions');
const admin = require('firebase-admin');
 
admin.initializeApp(functions.config().firebase);

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions


/**
 * This function sends a welcome notification to the user on sign up
 */
exports.welcomeUser = functions.database.ref('/users/{key}').onCreate((snapshot, context) => {
	const user = snapshot.val();

	const name = user.username;
	const token = user.token;

	const payload = {
		data: {
			type: "welcome",
			title: "\"Welcome " + name +"\"",
			message: "\"We hope you'll enjoy the app\"",
			image: "\"\"",
			timestamp: new Date().getTime().toString()
		}
	};

	return admin.messaging().sendToDevice(token, payload);
	
});


/**
 * This function is the callback endpoint for Safaricom STK push
 * Parameters received is user device token to send notification to
 */
exports.mpesaCallback = functions.https.onRequest((request, response) => {
	if(request.method === 'PUT'){
		response.status(403).send("FORBIDDEN");
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


/**
 * This function updates the users account balance and also registers the transaction event in the database
 */
exports.updateWallet = functions.https.onRequest((request, response) => {
	if(request.method === 'PUT'){
		response.status(403).send("FORBIDDEN");
	}

	const checkoutId = request.query.checkoutId;
	const userId = request.query.uid;
	const token = request.query.userToken;
	const amount = parseInt(request.query.amount);
	const time = request.query.time;
	const desc = request.query.description;
	var balance;

	var transactionId = admin.database().ref('transaction/' + userId).push().key;

	const updateTransactionPromise = admin.database().ref('transactions/' + userId + "/" + transactionId).set({
		id: transactionId,
		checkoutId: checkoutId,
		amount: amount,
		description: desc,
		time: time
	});

	const balancePromise = admin.database().ref('users/' + userId + '/balance').once('value');
	const updateBalancePromise = balancePromise.then(snapshot => {
		balance = parseInt(snapshot.val());
		
		if(balance){
			balance = balance + amount;
		} else {
			balance = amount;
		}

		const setBalance = admin.database().ref('users/' + userId + '/balance').set(balance);

		const payload = {
			data: {
				type: "balance_update",
				title: "\"Transaction successful\"",
				image: "\"\"",
				timestamp: new Date().getTime().toString(),
				message: "\"Your wallet has been updated with amount " + amount + ". New balance is " + balance+"\""
			}
		}
	
		const sendNotification = admin.messaging().sendToDevice(token, payload);

		return Promise.all([setBalance, sendNotification]);
	});

	return Promise.all([updateTransactionPromise, updateBalancePromise]).then(function(res){
		response.status(200).send("Wallet update complete");
	});

});
