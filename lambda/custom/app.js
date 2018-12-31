
var obj = require('alexa-sdk');
var data={
	"version": "1.0",
	"session": {
		"new": false,
		"sessionId": "amzn1.echo-api.session.68353d5c-d387-4a25-b89f-b20fa5d1e69f",
		"application": {
			"applicationId": "amzn1.ask.skill.ac989ee0-ed78-4f2f-a991-c0d62f757469"
		},
		"attributes": {
			"UserId": "amzn1.ask.account.AHZ4QDFLFW5XMZU55CZ5UNGCFIZC34D7XAZJVZWIUOXQU33RGZQY3X3JBB4ZOEFISXO3HJNFTYYFESJJ4OGJHBJTLV63JGAVFSZBDRYJWUCSSELRR7WNFMHHMUMRW53RDTZLMP5QFCMPAMFHDCWWOFW7NXWQ2UJ22NSMAOTM6C7S4EWKJMZIJH3EMJ6ZNQ5SBVSVA6IHKBFHWTA",
			"states": ""
		},
		"user": {
			"userId": "amzn1.ask.account.AHZ4QDFLFW5XMZU55CZ5UNGCFIZC34D7XAZJVZWIUOXQU33RGZQY3X3JBB4ZOEFISXO3HJNFTYYFESJJ4OGJHBJTLV63JGAVFSZBDRYJWUCSSELRR7WNFMHHMUMRW53RDTZLMP5QFCMPAMFHDCWWOFW7NXWQ2UJ22NSMAOTM6C7S4EWKJMZIJH3EMJ6ZNQ5SBVSVA6IHKBFHWTA",
			"accessToken": "[B@1c9d0041"
		}
	},
	"context": {
		"System": {
			"application": {
				"applicationId": "amzn1.ask.skill.ac989ee0-ed78-4f2f-a991-c0d62f757469"
			},
			"user": {
				"userId": "amzn1.ask.account.AHZ4QDFLFW5XMZU55CZ5UNGCFIZC34D7XAZJVZWIUOXQU33RGZQY3X3JBB4ZOEFISXO3HJNFTYYFESJJ4OGJHBJTLV63JGAVFSZBDRYJWUCSSELRR7WNFMHHMUMRW53RDTZLMP5QFCMPAMFHDCWWOFW7NXWQ2UJ22NSMAOTM6C7S4EWKJMZIJH3EMJ6ZNQ5SBVSVA6IHKBFHWTA",
				"accessToken": "[B@1c9d0041"
			},
			"device": {
				"deviceId": "amzn1.ask.device.AGCOERCXEZJ6N2T74KCNPLRXI336LITQGBN3DVIU6IFF453Z3XHQ5ROI2CXFFI4WZNA5IJV3HQSTUD2JK3YYXQNVQKDX2YFZQFF3Z75DTTDQIHSL3S2ZRCRBQG5SZTAYI47DSHJTZMXRC7AKCBJABCGTU32Q",
				"supportedInterfaces": {}
			},
			"apiEndpoint": "https://api.eu.amazonalexa.com",
			"apiAccessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjEifQ.eyJhdWQiOiJodHRwczovL2FwaS5hbWF6b25hbGV4YS5jb20iLCJpc3MiOiJBbGV4YVNraWxsS2l0Iiwic3ViIjoiYW16bjEuYXNrLnNraWxsLmFjOTg5ZWUwLWVkNzgtNGYyZi1hOTkxLWMwZDYyZjc1NzQ2OSIsImV4cCI6MTUyOTY2MjY1NiwiaWF0IjoxNTI5NjU5MDU2LCJuYmYiOjE1Mjk2NTkwNTYsInByaXZhdGVDbGFpbXMiOnsiY29uc2VudFRva2VuIjpudWxsLCJkZXZpY2VJZCI6ImFtem4xLmFzay5kZXZpY2UuQUdDT0VSQ1hFWko2TjJUNzRLQ05QTFJYSTMzNkxJVFFHQk4zRFZJVTZJRkY0NTNaM1hIUTVST0kyQ1hGRkk0V1pOQTVJSlYzSFFTVFVEMkpLM1lZWFFOVlFLRFgyWUZaUUZGM1o3NURUVERRSUhTTDNTMlpSQ1JCUUc1U1pUQVlJNDdEU0hKVFpNWFJDN0FLQ0JKQUJDR1RVMzJRIiwidXNlcklkIjoiYW16bjEuYXNrLmFjY291bnQuQUhaNFFERkxGVzVYTVpVNTVDWjVVTkdDRklaQzM0RDdYQVpKVlpXSVVPWFFVMzNSR1pRWTNYM0pCQjRaT0VGSVNYTzNISk5GVFlZRkVTSko0T0dKSEJKVExWNjNKR0FWRlNaQkRSWUpXVUNTU0VMUlI3V05GTUhITVVNUlc1M1JEVFpMTVA1UUZDTVBBTUZIRENXV09GVzdOWFdRMlVKMjJOU01BT1RNNkM3UzRFV0tKTVpJSkgzRU1KNlpOUTVTQlZTVkE2SUhLQkZIV1RBIn19.ew-JR3QTkwV0IPAhXnOjiTMPnxOPvi0kx7cTORNANXpb30izcdiegcQ06bgK3zBMKSyJVf6uL0_6Y97nlQn8GISIuI9cQx7zX9lxbVWlG3nt-bhDTDVR8Qghub_xWpnWO1Pe5N22ztIKCKInapLXz7ki1mHzOX_dxg4-wtzxSCv6mFiKZqYpgpfHAIRbIX38lc8wnsyokcYn3fPRbSkzxcRcqwUNY_fPBALMmau3lR6WeGQ9Au38cGfnzfDAyGHba8WBiPnqSyx2BzdqY6HkK_Ka-8BqJ3ckwQUExduvu3e0OPkkbGsTmvklxdzTksdFlbjBTS7VrZP2EyioToyEHA"
		}
	},
	"request": {
		"type": "IntentRequest",
		"requestId": "amzn1.echo-api.request.7403a416-aa3f-4bdd-bfe3-50045618b830",
		"timestamp": "2018-06-22T09:17:36Z",
		"locale": "en-US",
		"intent": {
			"name": "JokeIntent",
			"confirmationStatus": "NONE",
			"slots": {
				"JOKE_TYPE": {
					"name": "JOKE_TYPE",
					"value": "kid",
					"resolutions": {
						"resolutionsPerAuthority": [
							{
								"authority": "amzn1.er-authority.echo-sdk.amzn1.ask.skill.ac989ee0-ed78-4f2f-a991-c0d62f757469.JOKE_TYPE",
								"status": {
									"code": "ER_SUCCESS_MATCH"
								},
								"values": [
									{
										"value": {
											"name": "kid",
											"id": "7de007e43f108e4b54b079f66e4285d8"
										}
									}
								]
							}
						]
					},
					"confirmationStatus": "NONE"
				}
			}
		}
	}
}



var intentName = data.request.intent.name;
var obj = (data.request.intent.slots);
		
var slots = {};
		for (var key in obj) {
			
			var obj1 = JSON.parse(key);
			slots[obj1.name] = obj1.value;
			
		}