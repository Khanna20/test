const https = require("https");
const http = require("http");
const list_is_empty = "#list_is_empty#";
const awsSDK = require('aws-sdk');
var Alexa = require('alexa-sdk');
var fs = require('fs');

var shopping_list = [];
var todo_list = [];

/**
 * List API end-point.
 */
const api_url = 'api.eu.amazonalexa.com';
const api_port = '443';
var SKILL_NAME = 'HASH';
const APP_ID = 'amzn1.ask.skill.ac989ee0-ed78-4f2f-a991-c0d62f757469';
var USER_ID = "";
var states ='';
var dialogState = '';


var userData = {};
var userLocationInfo = {};
var zoneInfo = '';
exports.handler = function(event, context, callback) {

    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.APP_ID = APP_ID;
    alexa.appId = APP_ID;
    alexa.execute();
};

/**
 * Called when the session starts.
 */
const newSessionRequestHandler = function() {
    console.log("Starting newSessionRequestHandler");
	console.log("newSessionRequestHandler",states);
	
	this.attributes['data'] = "{\"data\":{}}";
	if(Object.keys(this.attributes).length === 0) {
        this.attributes['states'] = "";
		this.attributes['UserId'] = this.event.context.System.user.userId;
		
    }
    if (this.event.request.type === "IntentRequest") {
        this.emit(this.event.request.intent.name);
    }
    else {
        this.emit(LAUNCH_REQUEST);
    }
    console.log("Ending newSessionRequestHandler");
};

/**
 * Handler for the launch request event.
 */
const launchRequestHandler = function() {

	console.log("----------launchRequest HANDLER--------->",JSON.stringify(this.event));
	var that = this;


	getLocationMetadata(this.event, function(returnValue) {


		console.log("LOCATION_DATA:",userLocationInfo);
		console.log("ZONE DATA:",zoneInfo);
		var data = {
			"accessToken": that.event.context.System.user.accessToken
		};

		url ="ec2-18-220-171-195.us-east-2.compute.amazonaws.com";
		var path_post = "/validateUser";
		var options = {
			requestCert: false, 
			rejectUnauthorized: false,
			host: url,
			port: 4011,
			path: path_post,
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			json: data
		};

		var postData = JSON.stringify(data);

		console.log('postData is :', postData);
		console.log("OPTIONS----------->",options);
		var req = https.request(options, (res) => {

			console.log('STATUS:*****************');
			console.log('STATUS: ', res.statusCode);

			if(res.statusCode === 403) {
				console.log("permissions are not granted");
				return;
			 }
			var chunks = '';

			res.on('data', function (data) {
					chunks+= data;
			});
			res.on("end", function () {
				console.log("CHUNKS",chunks);
				console.log("CHUNKS*********",JSON.stringify(chunks));
				var obj = JSON.parse(chunks);
				console.log(obj)
				console.log("HELLO:",obj.status);
				userData = obj.data;
				var speechOutput = obj.message;
				//that.response.speak(speechOutput).audioPlayerPlay("REPLACE_ALL", "//https://p.scdn.co/mp3-preview/445dba982a0c73334ab598f1a23a4dea70c67c47?cid=774b29d4f13844c495f206cafdad9c86","1", null, 0)
				that.response.speak(speechOutput).shouldEndSession(false);
				that.emit(":responseReady");
			});
		}).on('error', function(e) {
				 console.log(e);
		});

		req.write(postData);
		req.end();
		console.log("=====After post==========");
	});

	console.log("Ending launchRequestHandler");
};



/**
 * List API to retrieve the location information.
 */
const getLocationMetadata = function(event, callback) {

    getZoneInfo(event,function(returnValue) {

		var options = {
			host: api_url,
			path: "/v1/devices/" + event.context.System.device.deviceId + "/settings/address",
			method: 'GET',
			headers: {
				'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
				'Content-Type': 'application/json'
			}
		}

		console.log("LOCATION OPTIONS:",options);
		var req = https.request(options, (res) => {
			console.log('STATUS: ', res.statusCode);
			console.log('HEADERS: ', JSON.stringify(res.headers));

			if(res.statusCode === 403) {
				console.log("permissions are not granted");
				callback(null);
				return;
			}

			var body = [];
			res.on('data', function(chunk) {
				body.push(chunk);
			}).on('end', function() {
				body = Buffer.concat(body).toString();
				if(res.statusCode === 200) {
				  userLocationInfo = body;
				  callback(200);
				} else {
					callback(list_is_empty);
				}
			});

			res.on('error', (e) => {
				console.log(`Problem with request: ${e.message}`);
			});
		}).end();
	});
};

/**
 * List API to retrieve the zone information.
 */
const getZoneInfo = function(event, callback) {

    var options = {
        host: api_url,
        path: "/v2/devices/" + event.context.System.device.deviceId + "/settings/System.timeZone",
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
            'Content-Type': 'application/json'
        }
    }

	console.log("ZONE OPTIONS:",options);
    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

        var body = [];
		res.on('data', function(chunk) {
			body.push(chunk);
		}).on('end', function() {
			body = Buffer.concat(body).toString();
			if(res.statusCode === 200) {
			  zoneInfo = body;
			  callback(200);
			} else {
			    callback(list_is_empty);
		    }
		});

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};

/**
 * This is the handler for the SessionEnded event.
 */
const sessionEndedRequestHandler = function() {
    console.log("Starting sessionEndedRequestHandler");
    var speechOutput = "Goodbye, Quiting hash";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending sessionEndedRequestHandler");
};


const outOfSessionHandler = function(){

	var that = this;
	console.log("Starting sessionEndedRequestHandler");
	console.log("outOfSessionHandler",states);
	outOfSessionListModification(this.event,function(returnValue){
	if(!returnValue)
	{
		var speechOutputFailure = "Message Received Failure Acknowledgement";
		that.context.fail(generateResponse(speechOutputFailure));
	}
	else{

		console.log("I am in outOfSessionListModification else");
		var speechOutput = "Message Received Successful Acknowledgement";

		that.response.speak(speechOutput)
		    .shouldEndSession(false);
		that.emit(":responseReady");
		that.context.succeed(generateResponse(speechOutput));
	}
	});

	console.log("I am in outOfSessionHandler end");
};

/**
 * This is the handler for the Unhandled event.
 */
const unhandledRequestHandler = function() {
    console.log("Starting unhandledRequestHandler");
	console.log("**************************event request***************",JSON.stringify(this.event));
	var that = this;
	if (this.event.request.type === "IntentRequest"){
    var intentName = this.event.request.intent.name;
  
	


		if (intentName === "HPS_READ_SHOPPINGLIST_INTENT"){

			getToDoAndShoppingLists(this.event,this.event.session, function(status) {
						if(!status) {
									   speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
									   that.response.speak(speechOutput);
									   that.emit(":responseReady");
						} else if(status === list_is_empty) {
									   speechOutput = "Your shopping list is already empty,";
									   console.log('shopping list:',shopping_list);
									   that.response.speak(speechOutput);
									   that.emit(":responseReady");
						} else if(status === 200 ) {
									   console.log('shopping list:',JSON.parse(shopping_list).items);
									   speechOutput = "Your Shopping List has ";
									   var counter = 0;
									   var itemLists = JSON.parse(shopping_list).items;
									   var steveItems = "";
									   for (var i=0 ; i< itemLists.length;i++){
													  counter ++;
													  console.log('item:',itemLists[i]);
													  if (itemLists.length == 1){
														 if (itemLists[i].value.includes("Steve")) {
																					speechOutput = itemLists[i].value;
														 } else {
																					speechOutput = speechOutput + '<break time="1s"/>' + itemLists[i].value + ".";
														 }
														 break;
													  }
														 if (itemLists[i].value.includes("Steve")) {
																					steveItems = itemLists[i].value;
																	 } else if (counter === itemLists.length){

																					//speechOutput = speechOutput + "and " + itemLists[i].value + ".";
																					speechOutput = speechOutput + '<break time="1s"/>'+  itemLists[i].value;

																	 } else {

																					speechOutput = speechOutput + '<break time="1s"/>'+ itemLists[i].value + ",";

																	 }
									   }
									   if (steveItems != ""){
										  speechOutput = speechOutput + '<break time="1s"/>' + " and Also," + steveItems;
									   }

									   that.response.speak(speechOutput).shouldEndSession(false);
									   that.emit(":responseReady");
						} else {
						  speechOutput = "I am not able to read your shopping list.";
						  that.response.speak(speechOutput)
							  .shouldEndSession(false);
						  states ='';
						  that.emit(":responseReady");
						}
			});



		} else if  (intentName !== "AMAZON.FallbackIntent") {
			var obj = (this.event.request.intent.slots);

			/*if (obj === undefined) {
				var speechOutput = "Sorry, I didn\'t get that";
				this.response.speak(speechOutput)
						 .shouldEndSession(false)
						 .listen(speechOutput);
				this.emit(":responseReady");
			}*/
			console.log("**************",obj);
			console.log("**************",JSON.stringify(obj));


			var slots = {};
			dialogState = '';
			
			for (var key in obj) {

					if (this.event.request.dialogState === "STARTED"){

						console.log('dialogState started');
						console.log(this.event.request.dialogState);
						console.log(this.event.request.intent.slots);
						var updatedIntent=this.event.request.intent;
						that.emit(":delegate", updatedIntent);
						console.log('end of started state');

					} else if (this.event.request.dialogState === "IN_PROGRESS"){
             
						console.log('dialogState inprogress');
						console.log(this.event.request.dialogState);
						console.log(this.event.request.intent.slots);
						that.context.succeed({
								"response": {
								"directives": [
									{
										"type": "Dialog.Delegate"
									}
								],
								"shouldEndSession": false
								},
								"sessionAttributes": {}
						});

					} else {
            
						console.log("No Dialog" + this.event.request.dialogState);
						console.log("***********",obj[key].name);
						console.log("***********",obj[key].value);
						slots[obj[key].name] = obj[key].value;
						
					}
					//console.log("***********",obj[key].name);
					//console.log("***********",obj[key].value);
					//slots[obj[key].name] = obj[key].value;
			}
			
			
			if (undefined === obj) {
			
				var userDataObj = JSON.parse(userData);
				console.log("************LOCATION_DATA",userLocationInfo);
				if (isEmptyObject(userLocationInfo)) {
					var data = {
						"intent": intentName,
						"slotValues": slots,
						"userDTO": userDataObj,
						"locationInfo":{
							"cityInfo": ""
						},
						"vpa":"alexa",
						"data": this.attributes['data']
					};
				} else {
					var locationDataObj = JSON.parse(userLocationInfo);
					console.log("************LOCATION_DATA",userLocationInfo);
					var data = {
						"intent": intentName,
						"slotValues": slots,
						"userDTO": userDataObj,
						"locationInfo":{
							"cityInfo": locationDataObj.city
						},
						"vpa":"alexa",
						"data": this.attributes['data']
					};
				}


				url ="ec2-18-220-171-195.us-east-2.compute.amazonaws.com";
				var path_post = "/hash/intentRequest";
				var options = {
					host: url,
					requestCert: false, 
					rejectUnauthorized: false,
					port: 4001,
					path: path_post,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: data
				};

				var postData = JSON.stringify(data);

				console.log('postData is :', postData);
				console.log("OPTIONS----------->",options);
				var req = https.request(options, (res) => {

					console.log('STATUS:*****************');
					console.log('STATUS: ', res.statusCode);

					if(res.statusCode === 403) {
						console.log("permissions are not granted");
						return;
					 }
					var chunks = '';

					res.on('data', function (data) {
							chunks+= data;
					});
					res.on("end", function () {
						console.log("CHUNKS",chunks);
						console.log("CHUNKS*********",JSON.stringify(chunks));
						var serverResponse = JSON.parse(chunks);
                         console.log("<<<<<<<<<<<<<<<serverResponse>>>>>>>>>>>>",JSON.stringify(serverResponse));
						if(serverResponse.question){
						    
							if (serverResponse.mediaResponse){
							   this.attributes['data'] = serverResponse.data;
							   console.log("Media Url value "+ serverResponse.mediaResponse.mediaUrl);
							   var audioFile=`<audio src="${serverResponse.mediaResponse.mediaUrl}"/>`;
							   console.log("<<<<<<<<<<<<Media Response>>>>>>>>>>>>",JSON.stringify(serverResponse));
							   that.emit(':elicitSlot', serverResponse.slotName, `${audioFile} Do you like that`, 'Do you like that');

							} else {
                               console.log("<<<<<<<<<<<<Question>>>>>>>>>>>>",JSON.stringify(serverResponse));
							   that.emit(':elicitSlot', serverResponse.slotName, serverResponse.message, serverResponse.message);
							}
						}else{
  						that.response.speak(serverResponse.message)
  						.shouldEndSession(false);
  						that.emit(":responseReady");
						}
					});
				}).on('error', function(e) {
						 console.log(e);
						 var speechOutput = "Try again";
						 that.response.speak(speechOutput)
						.shouldEndSession(false);
						that.emit(":responseReady");
				});

				req.write(postData);
				req.end();


				console.log("slots", slots);
			


			} else if ( this.event.request.dialogState === "COMPLETED" || Object.keys(obj).length === 0 ) {
				var userDataObj = JSON.parse(userData);
				console.log("************LOCATION_DATA",userLocationInfo);
				if (isEmptyObject(userLocationInfo)) {
					var data = {
						"intent": intentName,
						"slotValues": slots,
						"userDTO": userDataObj,
						"locationInfo":{
							"cityInfo": ""
						},
						"timeZone": zoneInfo,
						"vpa":"alexa",
						"data": this.attributes['data']
					};
				} else {
					var locationDataObj = JSON.parse(userLocationInfo);
					console.log("************LOCATION_DATA",userLocationInfo);
					var data = {
						"intent": intentName,
						"slotValues": slots,
						"userDTO": userDataObj,
						"locationInfo":{
							"cityInfo": locationDataObj.city
						},
						"timeZone": zoneInfo,
						"vpa":"alexa",
						"data": this.attributes['data']
					};
				}


				url ="ec2-18-220-171-195.us-east-2.compute.amazonaws.com";
				var path_post = "/hash/intentRequest";
				var options = {
					host: url,
					requestCert: false, 
					rejectUnauthorized: false,
					port: 4001,
					path: path_post,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: data
				};

				var postData = JSON.stringify(data);

				console.log('postData is :', postData);
				console.log("OPTIONS----------->",options);
				var req = https.request(options, (res) => {

					console.log('STATUS:*****************');
					console.log('STATUS: ', res.statusCode);

					if(res.statusCode === 403) {
						console.log("permissions are not granted");
						return;
					 }
					var chunks = '';

					res.on('data', function (data) {
							chunks+= data;
					});
					res.on("end", function () {
						console.log("CHUNKS",chunks);
						console.log("CHUNKS*********",JSON.stringify(chunks));
						var serverResponse = JSON.parse(chunks);
            console.log("<<<<<<<<<<<<<<<serverResponse>>>>>>>>>>>>",JSON.stringify(serverResponse));
						if(serverResponse.question){
						  if (serverResponse.mediaResponse){
							   this.attributes['data'] = serverResponse.data;
							   console.log("Media Url value "+ serverResponse.mediaResponse.mediaUrl);
							   var audioFile=`<audio src="${serverResponse.mediaResponse.mediaUrl}"/>`;
							   console.log("<<<<<<<<<<<<Media Response>>>>>>>>>>>>",JSON.stringify(serverResponse));
							   that.emit(':elicitSlot', serverResponse.slotName, `${audioFile} Do you like that`, 'Do you like that');

							} else {
                               console.log("<<<<<<<<<<<<Question>>>>>>>>>>>>",JSON.stringify(serverResponse));
							   that.emit(':elicitSlot', serverResponse.slotName, serverResponse.message, serverResponse.message);
							}
						}else{
  						that.response.speak(serverResponse.message)
  						.shouldEndSession(false);
  						that.emit(":responseReady");
						}
					});
				}).on('error', function(e) {
						 console.log(e);
						 var speechOutput = "Try again";
						 that.response.speak(speechOutput)
						.shouldEndSession(false);
						that.emit(":responseReady");
				});

				req.write(postData);
				req.end();


				console.log("slots", slots);
		}

		} else {
			console.log("Enter only if it is a AMAZON FALLBACK INTENT");
			var speechOutput = "Sorry, I didn\'t get that";
				this.response.speak(speechOutput)
						 .shouldEndSession(false)
						 .listen(speechOutput);
				this.emit(":responseReady");
		}


	} else {

	    console.log("Enter only if not an Intent request");
		var speechOutput = "Sorry, I didn\'t get that";
		this.response.speak(speechOutput)
		    .shouldEndSession(false)
			.listen(speechOutput);
		this.emit(":responseReady");

	}
	

    console.log("Ending unhandledRequestHandler");
};


function isEmptyObject(obj) {
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return false;
    }
  }
  return true;
}

/**
 * This is the handler for the Amazon help built in intent.
 */
const amazonHelpHandler = function() {
    console.log("Starting amazonHelpHandler");
	console.log("amazonHelpHandler",states);
    var speechOutput = "You can ask me to add something in your shopping list";
    this.response.speak(speechOutput)
		.shouldEndSession(false);
    this.emit(":responseReady");
    console.log("Ending amazonHelpHandler");
};

const amazonYesHandler = function() {
	var that = this;
	console.log("Starting amazonYesHandler:", states);

	if (states === "EVENTS") {
	    console.log("IN todo list events");
	    getToDoAndShoppingLists(this.event,this.event.session, function(status) {
				if(!status) {
					speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
					that.response.speak(speechOutput);
					that.emit(":responseReady");
				} else if(status === list_is_empty) {
					speechOutput = "Your todo list is empty,";
					console.log(' TO DO List:',todo_list);
					that.response.speak(speechOutput);
					that.emit(":responseReady");
				} else if(status === 200 ) {
					console.log('To Do List:',JSON.parse(todo_list).items);
					speechOutput = "Your To do List has ";
					var counter = 0;
					var itemLists = JSON.parse(todo_list).items;
					var steveItems = "";
					for (var i=0 ; i< itemLists.length;i++){
						counter ++;
						console.log('item:',itemLists[i]);
						if (itemLists.length == 1){

						    speechOutput = speechOutput + itemLists[i].value + ".";

						   break;
						}
					    if (counter === itemLists.length){

								speechOutput = speechOutput + "and " + itemLists[i].value;
								//speechOutput = speechOutput + itemLists[i].value;

						} else {

								speechOutput = speechOutput + itemLists[i].value + ",";

						}
					}
					if (steveItems != ""){
					   speechOutput = speechOutput + "and Also," + steveItems;
					}

					that.response.speak(speechOutput)
					    .shouldEndSession(false);
					states ='';
					that.emit(":responseReady");

				} else {
				  speechOutput = "I am not able to read your shopping list.";
				  that.response.speak(speechOutput)
				      .shouldEndSession(false);
				  states ='';
				  that.emit(":responseReady");
				}
			});


	} else if (states === "HEALTH") {
	    var speechOutput = "We have Stamford Hospital at the nearest. The best way to get to hospital is via Washington Blvd which will take about three minutes.";
		that.response.speak(speechOutput)
		         .shouldEndSession(false);
		states ='';
		that.emit(":responseReady");
		console.log("Event yes handler is ", this.event);
	}
	else  if (states === "WAYBACKHOME"){
	    console.log("**************NO Event yes handler is************************************");


			getToDoAndShoppingLists(this.event,this.event.session, function(status) {
				if(!status) {
					speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
					that.response.speak(speechOutput);
					that.emit(":responseReady");
				} else if(status === list_is_empty) {
					speechOutput = "Your shopping list is already empty,";
					console.log('shopping list:',shopping_list);
					that.response.speak(speechOutput);
					that.emit(":responseReady");
				} else if(status === 200 ) {
					console.log('shopping list:',JSON.parse(shopping_list).items);
					speechOutput = "Your Shopping List has ";
					var counter = 0;
					var itemLists = JSON.parse(shopping_list).items;
					var steveItems = "";
					for (var i=0 ; i< itemLists.length;i++){
						counter ++;
						console.log('item:',itemLists[i]);
						if (itemLists.length == 1){
						   if (itemLists[i].value.includes("Steve")) {
								speechOutput = itemLists[i].value;
						   } else {
								speechOutput = speechOutput + '<break time="1s"/>' + itemLists[i].value + ".";
						   }
						   break;
						}
						   if (itemLists[i].value.includes("Steve")) {
								steveItems = itemLists[i].value;
							} else if (counter === itemLists.length){

								//speechOutput = speechOutput + "and " + itemLists[i].value + ".";
								speechOutput = speechOutput + '<break time="1s"/>'+  itemLists[i].value;

							} else {

								speechOutput = speechOutput + '<break time="1s"/>'+ itemLists[i].value + ",";

							}
					}
					if (steveItems != ""){
					   speechOutput = speechOutput + '<break time="1s"/>' + " and Also," + steveItems;
					}

					that.response.speak(speechOutput)
								 .shouldEndSession(false);
					//states ='';
					//states = "EVENTS";
					that.emit(":responseReady");
					//let options = {}
					//options.speechText = speechOutput;
					//options.endSession = false;
					//buildResponse(options);

					//var speechOutput1 = "I have some events also, shall I read them out for you?"
					//that.response.speak(speechOutput1).listen("Please respond with yes or no?");

					//that.emit(":responseReady");
				} else {
				  speechOutput = "I am not able to read your shopping list.";
				  that.response.speak(speechOutput)
				      .shouldEndSession(false);
				  states ='';
				  that.emit(":responseReady");
				}
			});

		} else if ( states === "ADDITEM") {
			var speechOutput = "What else do you want me to add to the list?";
		    that.response.speak(speechOutput)
				      .shouldEndSession(false);
			that.emit(":responseReady");

		} else if (states === "GASREMINDER"){

		    addGasReminder(that.event,function(status) {
			    if(status === 201 ) {
					var speechOutput = "Great.  I have added it.  Your first meeting is at 9:30am, based on current traffic your commute to Harman International will take 13 minutes and you will make it in time.  Drive safely as rain is expected today! ";

					that.response.speak(speechOutput)
							  .shouldEndSession(false);

					that.emit(":responseReady");
			   } else {
					var speechOutput = "List cannot be updated due to some technical issue";

					that.response.speak(speechOutput)
							  .shouldEndSession(false);
					states ='';
					that.emit(":responseReady");
			   }
			});
		}else {
			var speechOutput = "What else can I help you with?";
		    that.response.speak(speechOutput)
				      .shouldEndSession(false);
			states ='';
			that.emit(":responseReady");
		}
    //var speechOutput = "Your shopping list is empty";
    //this.response.speak(speechOutput);
    //this.emit(":responseReady");
    console.log("Ending amazonYesHandler");

}


const amazonNoHandler = function() {
	console.log("Starting amazonNoHandler");
	console.log("amazonNoHandler",states);
	var speechOutput;
	if (states === "ADDITEM"){
	  speechOutput = "OK!! your list is created , Thanks for choosing HASH , see you next time";
	} else if (states === "GASREMINDER" ) {
	  speechOutput = "OK , .  Your first meeting is at 9:30am, based on current traffic your commute to Harman International will take 13 minutes and you will make it in time.  Drive safely as rain is expected today! "
	} else {
      speechOutput = "OK, Have a Safe Journey!!";
	}
    this.response.speak(speechOutput);
	//             .shouldEndSession(false);
	states ='';
    this.emit(":responseReady");
    console.log("Ending amazonNoHandler");

}

/**
 * This is the handler for the Amazon cancel built-in intent.
 */
const amazonCancelHandler = function() {
    console.log("Starting amazonCancelHandler");
	console.log("amazonCancelHandler",states);
    var speechOutput = "Thanks for choosing HASH , see you next time";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending amazonCancelHandler");
};

/**
 * This is the handler for the Amazon stop built in intent.
 */
const amazonStopHandler = function() {
    console.log("Starting amazonStopHandler");
	console.log("amazonStopHandler",states);
    var speechOutput = "Goodbye";
    this.response.speak(speechOutput);
    this.emit(":responseReady");
    console.log("Ending amazonStopHandler");
};




const reminderHandler = function() {
    var that = this;
	console.log("reminderHandler",states);
	var input = this.event.request.intent.slots.remindofwhat.value;
    var speechOutput = "Ok, I will remind you of " + input ;
	//"you for your  dance class when you are on the way back home";

	this.response.speak(speechOutput)
	             .shouldEndSession(false);

	console.log("Starting the addItemTodoList.");
    getListsIdFromToDOListMetadata(this.event, function(returnValue)
    {
		console.log('getListsIdFromListMetadata ===>', returnValue[0], returnValue[1]);
		var item_name = '';
		item_name = returnValue[1];
		var data = {
				"value": item_name, //item value, with a string description up to 256 characters
				"status": "active" // item status (Enum: "active" or "completed")
			};
		var path_post = "/v2/householdlists/"+returnValue[0]+"/items";
		console.log('items===>', data);
		const querystring = require('querystring');
		var postData = JSON.stringify(data);

		console.log('postData is :', postData);
		var options = {
			host: api_url,
			port: api_port,
			path: path_post,
			method: 'POST',
			headers: {
			'Authorization': 'Bearer ' + consent_token,
			'Content-Type': 'application/json'
			},
			json: data
		};

		//var userId = this.event.session.user.userId;
		console.log("UserId generated is===>",userId);
		console.log("Before posting");
		var req = https.request(options, (res) => {
		console.log('STATUS: ', res.statusCode);
		console.log('HEADERS: ', JSON.stringify(res.headers));

		if(res.statusCode === 403) {
			console.log("permissions are not granted");
			return;
		 }
			 var chunks = '';
		 res.on('data', function (data) {
				chunks+= data;
		   });
		  res.on("end", function () {
			console.log(chunks);
		  });

		  if(res && (res.statusCode == 201 )) {
			console.log("In status 201 ====>");
			var Output = returnValue[1] + " added to the " + "list";
			console.log('response:',Output);
			that.emit(":responseReady");
		  }
		   else
		  {
			console.log("Problem in res code");
		  }

			}).on('error', function(e) {
			 console.log(e);
		});
		req.write(postData);
		req.end();
		console.log("=====After post==========");
    });

}


/**
 * This is the handler for the delete top to-do intent.
 */
const clearTopToDoHandler = function() {
    var speechOutput = "";
    var that = this;
    console.info("Starting clear top todo handler");
	console.log("clearTopToDoHandler",states);
    clearTopToDoAction(this.event.session, function(status) {
        if(!status) {
            speechOutput = "Alexa List permissions are missing. You can grant permissions within the Alexa app.";
            var permissions = ["write::alexa:household:list"];
            that.emit(":tellWithPermissionCard", speechOutput, permissions);
        } else if(status === list_is_empty) {
            speechOutput = "I could not delete your top todo. Your todo list is empty.";
            that.response.speak(speechOutput)
			             .shouldEndSession(false);
            that.emit(":responseReady");
        } else if(status === 200 ) {
            speechOutput = "I successfully deleted your top todo.";
            this.response.speak(speechOutput)
			             .shouldEndSession(false);
            that.emit(":responseReady");
        } else {
          speechOutput = "I could not delete the todo. The developers are debugging response code " + status;
          this.response.speak(speechOutput)
		               .shouldEndSession(false);
          that.emit(":responseReady");
        }
    });
    console.info("Ending clear top todo handler");
};

// --------------- Helper List API functions -----------------------

/**
 * List API to retrieve the List of Lists : Lists Metadata.
 */
const getListsMetadata = function(context, callback) {
    /* if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }*/
    console.log("getListsMetadata",states);
    consent_token = context.System.apiAccessToken;
    console.log("Starting the get list metadata call.");
    var options = {
        host: api_url,
        port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + consent_token,
            'Content-Type': 'application/json'
        }
    }

    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

        var body = [];
 	var result = '';
        res.on('data', function(chunk) {
		if(chunk)
		{
			var resultArray;
			resultArray = JSON.parse('' + chunk);
			console.log('resultArray =>', resultArray);
			//console.log('resultArray items detail =>', resultArray.lists[1]);
			//console.log('resultArray items detail 1 =>', resultArray[1]);
            		result = resultArray.lists[1].listId + " " + resultArray.lists[1].name;
			console.log('result=>', result);
		}
		else
		{
			result = 'not a valid chunk';
			console.log('result=>', result);
		}
        }).on('end', function() {
            callback(result);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};

const getListsIdFromListMetadata = function(event, callback) {
    /* if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }*/
	var list_name = '' ;
	var item_name= '';
    userId  = event.session.user.userId;
    console.log('UserId is =>', userId);
    consent_token = event.context.System.apiAccessToken;

	if (states === "GASREMINDER"){
  	    list_name = 'to-do';

		item_name = 'get the car refeuled since you are at 1/4 tank of gas';

	} else {
		list_name = event.request.intent.slots.list.value;
	    item_name = event.request.intent.slots.itemName.value;


	}
    console.log("Starting the get list metadata call.");
    console.log('List name is =>', list_name);
    var options = {
        host: api_url,
        port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + consent_token,
            'Content-Type': 'application/json'
        }
    };

    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

              var result = [];
               var index = 0;
        res.on('data', function(chunk) {
                              if(chunk)
                              {
                                             console.log('list name ====>',   list_name);
                                            if (list_name === 'to-do')
                                                            index = 1;

                                             var resultArray;
                                             resultArray = JSON.parse('' + chunk);
                                             //console.log('resultArray =>', resultArray);
                              result[0] = resultArray.lists[index].listId;
                              result[1] = item_name;
                                             console.log('result=>', result[0] + "and " +result[1]);
                              }
                              else
                              {
                                             result[0] = 'not a valid chunk';
                                             console.log('result=>', result[0]);
                              }
        }).on('end', function() {
            callback(result);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
}


const getListsIdFromToDOListMetadata = function(event, callback) {
    /* if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }*/
	var item_name;
	console.log("getListsIdFromListMetadata : event is ", JSON.stringify(event));
	userId  = event.session.user.userId;
	console.log('UserId is =>', userId);
    consent_token = event.context.System.apiAccessToken;
	if (states === "GASREMINDER") {
	    item_name = "get the car refeuled since you are at 1/4 tank of gas";
	} else {
		item_name = event.request.intent.slots.remindofwhat.value;
	}
    console.log("Starting the get list metadata call.");
   var options = {
        host: api_url,
        port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + consent_token,
            'Content-Type': 'application/json'
        }
    };

    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

 	var result = [];
	var index = 1;
        res.on('data', function(chunk) {
		if(chunk)
		{
			var resultArray;
			resultArray = JSON.parse('' + chunk);
			//console.log('resultArray =>', resultArray);
            result[0] = resultArray.lists[index].listId;
            result[1] = item_name;
			console.log('result=>', result[0] + "and " +result[1]);
		}
		else
		{
			result[0] = 'not a valid chunk';
			console.log('result=>', result[0]);
		}
        }).on('end', function() {
            callback(result);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};



const getToDoAndShoppingLists = function(event,session, callback) {
    if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }

    console.log("Starting get getToDoAndShoppingList list call.");

    getAllListsMetadata(event,session, function(returnValue) {
        if(!returnValue) {
            console.log("permissions are not defined");
            callback(null);
            return;
        }
        var obj = JSON.parse(returnValue);
		console.log("getToDoAndShoppingLists : Full Meta data list response :" + obj)
        var todo_path = "";
		var shopping_path = "";
        for (var i=0; i < obj.lists.length; i++) {
			if (obj.lists[i].name === "Alexa to-do list") {
					for (var j=0; j < obj.lists[i].statusMap.length; j++) {
						if (obj.lists[i].statusMap[j].status === "active") {
							todo_path = obj.lists[i].statusMap[j].href;
						}
					}
			} else if ( obj.lists[i].name === "Alexa shopping list"){
					for (var j=0; j < obj.lists[i].statusMap.length; j++) {
						if (obj.lists[i].statusMap[j].status === "active") {
							shopping_path = obj.lists[i].statusMap[j].href;
						}
					}
			}
	    }

	    console.log('todo_path: ', todo_path);
		console.log('shopping path: ' , shopping_path);

		if (states === "EVENTS") {
			var options = {
				   host: api_url,
				   port: api_port,
				   path: todo_path,
				   method: 'GET',
				   headers: {
					   'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
					   'Content-Type': 'application/json'
				   }
				}

			var req = https.request(options, (res) => {
				   console.log('getToDoAndShoppingLists ToDoList STATUS: ', res.statusCode);
				   console.log('getToDoAndShoppingLists ToDoList HEADERS: ', JSON.stringify(res.headers));

				   if(res.statusCode === 403) {
					 console.log("permissions are not granted for ToDoList ");
					 callback(null);
					 return;
				   }

				   var body = [];
				   res.on('data', function(chunk) {
					   body.push(chunk);
					}).on('end', function() {
					   body = Buffer.concat(body).toString();
					   console.log("***********To Do Response**********",JSON.parse(body));
					   if (JSON.parse(body).items.length === 0) {
						  callback(list_is_empty);
					   } else {
						  todo_list = body;
						  callback(200);
					   }
					   //callback(JSON.parse(body));
					});

					res.on('error', (e) => {
					   console.log(` getToDOList: Problem with request: ${e.message}`);
					});
				 }).end();

		} else {


				var options1 = {
				   host: api_url,
				   port: api_port,
				   path: shopping_path,
				   method: 'GET',
				   headers: {
					   'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
					   'Content-Type': 'application/json'
				   }
				}
				var req1 = https.request(options1, (res1) => {
				   console.log('getToDoAndShoppingLists ShoppingList STATUS: ', res1.statusCode);
				   console.log('getToDoAndShoppingLists ShoppingList HEADERS: ', JSON.stringify(res1.headers));

				   if(res1.statusCode === 403) {
					 console.log("permissions are not granted for ShoppingList");
					 callback(null)
					 return;
				   }

				   var body = [];
				   res1.on('data', function(chunk) {
					   body.push(chunk);
					}).on('end', function() {
					   body = Buffer.concat(body).toString();
					   console.log("***********Shopping Response**********",JSON.parse(body));
					   if (JSON.parse(body).items.length === 0) {
						  callback(list_is_empty);
					   } else {
						  shopping_list = body;
						  callback(200);
					   }

					});

					res1.on('error', (e) => {
					   console.log(` getShoppList: Problem with request: ${e.message}`);
					   callback(null);
					});
				 }).end();

			}

		//if((todo_list.length === 0) && (shopping_list.length === 0)){
		  //  callback(list_is_empty);
		//} else  {
		//    callback(200);
		//}



    });
};







/**
 * List API to retrieve the List of Lists : Lists Metadata.
 */
const getAllListsMetadata = function(event,session, callback) {
    if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }

    console.log("Starting the get list metadata call.");
    var options = {
        host: api_url,
        port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
            'Content-Type': 'application/json'
        }
    }

    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

        var body = [];
        res.on('data', function(chunk) {
            body.push(chunk);
        }).on('end', function() {
            body = Buffer.concat(body).toString();
            callback(body);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};


/**
 * List API to retrieve the customer to-do list.
 */
const getToDoList = function(context, callback) {
    /* if(!session.user.permissions) {
        console.log("permissions are not defined");
        callback(null);
        return;
    }*/
    //consent_token = session.user.permissions.consentToken;

    consent_token = context.System.apiAccessToken;
    console.log("Starting get todo list call.");
	var retCode = '';

    getListsMetadata(context, function(returnValue) {
 	retCode = returnValue;
        if(!returnValue) {
            console.log("permissions are not defined");
            callback(null);
            return;
        }
     /*   var obj = JSON.parse(returnValue);
        var todo_path = "";
        for (i=0; i < obj.lists.length; i++) {
	    if (obj.lists[i].name === "Alexa to-do list") {
                for (j=0; j < obj.lists[i].statusMap.length; j++) {
                    if (obj.lists[i].statusMap[j].status === "active") {
                        todo_path = obj.lists[i].statusMap[j].href;
                        break;
		    }
		}
                break;
	    }
	}

        var options = {
           host: api_url,
           port: api_port,
           path: todo_path,
           method: 'GET',
           headers: {
               'Authorization': 'Bearer ' + consent_token,
               'Content-Type': 'application/json'
           }
        }

        var req = https.request(options, (res) => {
           console.log('STATUS: ', res.statusCode);
           console.log('HEADERS: ', JSON.stringify(res.headers));

           if(res.statusCode === 403) {
             console.log("permissions are not granted");
             callback(null);
             return;
           }

           var body = [];
           res.on('data', function(chunk) {
               body.push(chunk);
            }).on('end', function() {
               body = Buffer.concat(body).toString();
               callback(JSON.parse(body));
            });

            res.on('error', (e) => {
               console.log(`Problem with request: ${e.message}`);
            });
         }).end();*/
    });
   // line added
   callback(retCode);
};

/**
 * Helper function to retrieve the top to-do item.
 */
const getTopToDoItem = function(context, callback) {
    getToDoList(context, function(returnValue) {
       if(!returnValue) {
           callback(null);
       }
       /*else if(!returnValue.items || returnValue.items.length === 0) {
           callback(list_is_empty);
       }
       else {
           callback(returnValue.items[0].value);
       } */
	callback(returnValue);
    });
};

/**
 * List API to delete the top todo item.
 */
const clearTopToDoAction = function(session, callback) {
    getToDoList(session, function(returnValue) {
        if(!returnValue) {
	    callback(null);
	    return;
	}
	else if(!returnValue.items || returnValue.items.length === 0) {
	    callback(list_is_empty);
	    return;
	}

	if(!session.user.permissions) {
	    console.log("permissions are not defined");
	    callback(null);
	    return;
	}
	consent_token = session.user.permissions.consentToken;

	var path = "/v2/householdlists/_listId_/items/_itemId_";
	path = path.replace("_listId_", returnValue.listId);
	path = path.replace("_itemId_", returnValue.items[0].id);

	var options = {
	    host: api_url,
	    port: api_port,
	    path: path,
	    method: 'DELETE',
	    headers: {
		'Authorization': 'Bearer ' + consent_token,
		'Content-Type': 'application/json'
	    }
	}

	var req = https.request(options, (res) => {
		console.log('STATUS: ', res.statusCode);
		console.log('HEADERS: ', JSON.stringify(res.headers));

		if(res.statusCode === 403) {
		    console.log("permissions are not granted");
		    callback(null);
		    return;
		}

		var body = [];
		res.on('data', function(chunk) {
		    body.push(chunk);
		}).on('end', function() {
		    body = Buffer.concat(body).toString();
		    callback(res.statusCode);
		});

		res.on('error', (e) => {
		    console.log(`Problem with request: ${e.message}`);
		});

	    }).end();
	});
};



/* Handler to handle add items to list */
const addItemToListHandler = function() {
    var speechOutput = "";
    var that = this;

    /* if(!session.user.permissions) {
    console.log("permissions are not defined");
    callback(null);
    return;
    }*/
    console.log("Starting the addItemToListHandler.**********",this.attributes['states']);

    getListsIdFromListMetadata(this.event, function(returnValue)
    {
		console.log('getListsIdFromListMetadata ===>', returnValue[0], returnValue[1]);
        var item_name = '';
		item_name = returnValue[1];
		var data = {
            "value": item_name, //item value, with a string description up to 256 characters
            "status": "active" // item status (Enum: "active" or "completed")
        };
		var path_post = "/v2/householdlists/"+returnValue[0]+"/items";
		console.log('items===>', data);
		const querystring = require('querystring');
        var postData = JSON.stringify(data);

		console.log('postData is :', postData);
		var options = {
	    host: api_url,
	    port: api_port,
	    path: path_post,
	    method: 'POST',
	    headers: {
	    'Authorization': 'Bearer ' + consent_token,
	    'Content-Type': 'application/json'
	    },
	    json: data
	};

	//var userId = this.event.session.user.userId;
	console.log("UserId generated is===>",userId);
	console.log("Before posting");
        var req = https.request(options, (res) => {
	console.log('STATUS: ', res.statusCode);
	console.log('HEADERS: ', JSON.stringify(res.headers));

	if(res.statusCode === 403) {
	    console.log("permissions are not granted");
	    return;
	 }
         var chunks = '';
	 res.on('data', function (data) {
		chunks+= data;
	   });
	  res.on("end", function () {
	  console.log(chunks);
	  });

	  if(res && (res.statusCode == 201 )) {
		console.log("In status 201 ====>");
   		var speechOutput = "OK, I’ve added " + returnValue[1] + " to your list " + '<break time="1s"/>' + " Do you need anything else?";
		    states = "ADDITEM";
    		console.log('response:',speechOutput);
    		that.response.speak(speechOutput)
			             .shouldEndSession(false);
   		that.emit(":responseReady");
	  }
	   else
	  {
		console.log("Problem in res code");
	  }

        }).on('error', function(e) {
	     console.log(e);
	});
        req.write(postData);
	req.end();
	console.log("=====After post==========");
    });
};


const accountLinkedHandler = function(){
	console.log("----------ACCOUNT LINKED HANDLER--------->",JSON.stringify(this.event.request.body.accessToken));
	const userId = this.event.context.System.user.userId;
	USER_ID = userId;
	var that = this;
	var data = {
		"skillId": APP_ID,
		"userId": userId,
		"accessToken": this.event.request.body.accessToken
	};

	userId_save_url ="ec2-18-220-171-195.us-east-2.compute.amazonaws.com";
	var path_post = "/saveSkillInfo";
	var options = {
		requestCert: false, 
		rejectUnauthorized: false,
		host: userId_save_url,
		port: 4011,
		path: path_post,
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		json: data
	};

	var postData = JSON.stringify(data);

	console.log('postData is :', postData);
	console.log("OPTIONS----------->",options);
	var req = https.request(options, (res) => {
		console.log('STATUS: ', res.statusCode);
		console.log('HEADERS: ', JSON.stringify(res.headers));

		if(res.statusCode === 403) {
			console.log("permissions are not granted");
			return;
		 }
	    var chunks = '';
		res.on('data', function (data) {
				chunks+= data;
		});
	    res.on("end", function () {
			console.log(chunks);
		});

		if(res && (res.statusCode == 200 )) {
			console.log("SkillId and UserID saved Successfully");
			var speechOutput = "Skill Enabled Successfully";
			that.response.speak(speechOutput)
		    .shouldEndSession(false);
			that.emit(':tellWithCard', speechOutput, SKILL_NAME,
                      speechOutput);
			that.emit(":responseReady");
		} else {
			console.log("SkillId and UserId not  saved Successfully");
			var errorOutput = "There is some issue with the Server, Please try again after sometime !";
			that.response.speak(errorOutput)
		    .shouldEndSession(false);
			that.emit(':tellWithCard', errorOutput, SKILL_NAME,
                      errorOutput);
			that.emit(":responseReady");
		}

	}).on('error', function(e) {
			 console.log(e);
	});

	req.write(postData);
	req.end();
	console.log("=====After post==========");


}

const skillEnabledHandler = function(){

    console.log("----------SKILL ENABLED HANDLER--------->");
};

var pfunc = function(err, data) { 
console.log("This is data1", JSON.stringify(data));    
if (err) {
        console.log(err, err.stack);
    } else {
        console.log("This is data", JSON.stringify(data));
    }
}

const skillDisabledHandler = function(){
	const userId = this.event.context.System.user.userId;

    console.log(`skill was disabled for user: ${userId}`);
};




const outOfSessionListModification = function(event,callback) {

	var speechOutput = "";
	console.log("Starting messageRecievedHandler");
    getListsIdFromListMetadataForOutSessionRequest(event,function(returnValue)
    {
        console.log('getListsIdFromListMetadata ===>', returnValue[0], returnValue[1]);
        var item_name = '';
        item_name = returnValue[1];


        var data = {
            "value": item_name, //item value, with a string description up to 256 characters
            "status": "active" // item status (Enum: "active" or "completed")
        };
        var path_post = "/v2/householdlists/"+returnValue[0]+"/items";
        console.log('items===>', data);
        const querystring = require('querystring');
        var postData = JSON.stringify(data);

        console.log('postData is :', postData);
        var options = {
            host: api_url,
            port: api_port,
            path: path_post,
            method: 'POST',
            headers: {
            'Authorization': 'Bearer ' + event.context.System.apiAccessToken,
            'Content-Type': 'application/json'
            },
            json: data
        };


        console.log("Before posting");
        var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            return;
         }
         var chunks = '';
         res.on('data', function (data) {
                chunks+= data;
           });


          if(res && (res.statusCode == 201 )) {
                console.log("In status 201 ====>");
                var speechOutput = returnValue[1] + " added to the " + "list";
                console.log('response:',speechOutput);
				console.log("I am in outOfSessionListModification , entry done in list");
          }
           else
          {
                console.log("Problem in res code");
          }

		res.on("end", function () {
          console.log(chunks);
		  callback(res.statusCode);

        });

        }).on('error', function(e) {
             console.log(e);
        });
        req.write(postData);
        req.end();
        console.log("=====After post==========");
    });


    console.log("Ending messageRecievedHandler");
};





const getListsIdFromListMetadataForOutSessionRequest = function(event, callback) {


	console.log("getListsIdFromListMetadataForOutSessionRequest starting");

	console.log("Event is ===>",JSON.stringify(event.request));


//consent_token = event.request.message.request.apiaccess_token;
consent_token = event.context.System.apiAccessToken;
   // var list_name = event.request.intent.slots.list.value;
    var list_name = event.request.message.request.list_name;
	var item_name = event.request.message.request.message.notice;

    console.log("Starting the get list metadata call.");
    console.log('List name is =>', list_name);
     console.log('Item name is =>', item_name);

	var options = {
        host: api_url,
        port: api_port,
        path: '/v2/householdlists/',
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + consent_token,
            'Content-Type': 'application/json'
        }
    };

    var req = https.request(options, (res) => {
        console.log('STATUS: ', res.statusCode);
        console.log('HEADERS: ', JSON.stringify(res.headers));

        if(res.statusCode === 403) {
            console.log("permissions are not granted");
            callback(null);
            return;
        }

        var result = [];
        var index = 0;
        res.on('data', function(chunk) {
                if(chunk)
                {
                        console.log('list name ====>',   list_name);
                        if (list_name === 'to-do')
                                index = 1;

                        var resultArray;
                        resultArray = JSON.parse('' + chunk);
                        //console.log('resultArray =>', resultArray);
                        result[0] = resultArray.lists[index].listId;
						if (index === 0){
							//result[1] = "Steve asked you to get some " + item_name;
							  result[1] = item_name;
						}
						else {
							//result[1] = "Steve asked you to " + item_name;
							result[1] =  item_name;
						}
                        console.log('result=>', result[0] + "and " +result[1]);
                }
                else
                {
                        result[0] = 'not a valid chunk';
						console.log('result=>', result[0]);
                }
        }).on('end', function() {
             callback(result);
        });

        res.on('error', (e) => {
            console.log(`Problem with request: ${e.message}`);
        });
    }).end();
};


const generateResponse = (message) => {
  const authResponse = {};
  authResponse.message = message;
  return authResponse;
};

const buildResponse = function(options) {
   var response = {
    version: "1.0",
    response: {
      outputSpeech: {
        type: "SSML",
        ssml: "<speak>"+options.speechText+"</speak>"
      },
      shouldEndSession: options.endSession
    }
  };

  console.log("Response:\n"+JSON.stringify(response,null,2));
  return response;
};






// ------------------------------------------------------Define events and intents---------------------------------------------------------------
const NEW_SESSION = "NewSession";
const LAUNCH_REQUEST = "LaunchRequest";
const SESSION_ENDED = "SessionEndedRequest";
const UNHANDLED = "Unhandled";

const AMAZON_HELP = "AMAZON.HelpIntent";
const AMAZON_CANCEL = "AMAZON.CancelIntent";
const AMAZON_STOP = "AMAZON.StopIntent";
const AMAZON_YES = "AMAZON.YesIntent";
const AMAZON_NO = "AMAZON.NoIntent";
const SKILL_ENABLED = "AlexaSkillEvent.SkillEnabled";
const SKILL_DISABLED = "AlexaSkillEvent.SkillDisabled";
const OUT_OF_SESSION_MESSAGE = "Messaging.MessageReceived";
const ACCOUNT_LINKED = "AlexaSkillEvent.SkillAccountLinked";
const handlers = {};

//-----------------------------------Event handlers-----------------------------------------------------------------------------------
handlers[NEW_SESSION] = newSessionRequestHandler;
handlers[LAUNCH_REQUEST] = launchRequestHandler;
handlers[SESSION_ENDED] = sessionEndedRequestHandler;
handlers[SKILL_ENABLED] = skillEnabledHandler;
handlers[SKILL_DISABLED] = skillDisabledHandler;
handlers[ACCOUNT_LINKED] = accountLinkedHandler;
handlers[AMAZON_CANCEL] = amazonCancelHandler;
handlers[AMAZON_STOP] = amazonStopHandler;
handlers[AMAZON_HELP] = amazonHelpHandler;
handlers[AMAZON_YES] = amazonYesHandler;
handlers[AMAZON_NO] = amazonNoHandler;


//---------------------------------------------------Intent handlers------------------------------------------------------------------
handlers[OUT_OF_SESSION_MESSAGE] =  outOfSessionHandler;
handlers[UNHANDLED] = unhandledRequestHandler;
