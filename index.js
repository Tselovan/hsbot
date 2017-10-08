'use strict';



var unirest = require('unirest');
var path = require('path');
var request = require('request');

var TOKEN = '441337241:AAHnqvmiX-3saI4mDW2rHi_07of6XbnTiZs';
var apiToken = 'kkJ2EXhLlwmshcOYqOp4guY6C258p1kIRwhjsnkzFxZvlvxvFB';

var baseRequest = request.defaults({
    baseUrl: 'https://api.telegram.org/bot' + TOKEN + '/'
});

var noop = function (err) {
    if(err) { console.log(err); }
};
var callMethod = function (methodName, params, cb) {
    cb = cb || noop;
    var req = {uri: methodName, method: 'POST'};
    if (Object.keys(params).length) {
        req.formData = params;
    }
    baseRequest(req, function (err, response, body) {
        if (err) {
            return cb(err);
        }
        cb(err, JSON.parse(body));
    });
};

var getUpdatesOffset = 0;
var getUpdates = function (cb) {
    var params = {offset: getUpdatesOffset, timeout: 60};
    callMethod('getUpdates', params, function (err, data) {
        if (err) {
            return cb(err);
        }
        if (data.result.length) {
            getUpdatesOffset = data.result[data.result.length - 1].update_id + 1;
        }
        cb(err, data);
    });
}

var sendCardImg = function(chatId,cardId)
{ 
	var requestUrl = 'https://omgvamp-hearthstone-v1.p.mashape.com/cards/'+cardId;
	
	unirest.get(requestUrl)
		.header("X-Mashape-Key", apiToken)
		.end(function (result) 
		{console.log(result.body);
			var imgUrl = result.body[0].imgGold;
			callMethod('sendDocument', {chat_id: chatId, document: imgUrl});			
		});
}

var handlers = [];
	handlers['/search'] = function (message,secondText) {
				var requestUrl = "https://omgvamp-hearthstone-v1.p.mashape.com/cards/search/"+secondText;
				
				unirest.get(requestUrl)
				.header("X-Mashape-Key", apiToken)
				.end(function (result) {
				  
				  var resultArr = result.body;
				  var msg = '';
				  var resultCount = 0;

				  if (!resultArr.error) 
					  {
						  resultArr.forEach(function callback(currentValue, index, array) 
							{
								var currCard = currentValue;
								
								if (currCard.cardSet !='Tavern Brawl')
								{
									msg += currCard.name +' /'+currCard.cardId+'\n';
									var cardId = '/'+currCard.cardId;
									handlers[cardId] = function (message,secondText){sendCardImg(message.chat.id,currCard.cardId);};
									resultCount++;
								}
							}); 
					  }
				else
					{
						msg = resultArr.message;				
					}
				  if(resultCount == 0)
				  {
					 msg= 'Card not found';
				  }
				  callMethod('sendMessage', {chat_id: message.chat.id, text: msg});
				  
				});
			   
			};

var commands = Object.keys(handlers);

var messageHandler = function (update) {
	
    if (!update.message || !update.message.text) {
        return console.log('unhandled update', update);
    }
	
	var command = '/search';

	if (update.message.text.trim() !='' && update.message.text.substring(0,1) =='/') {
        var command = update.message.text;
    }

    else {
        var command = '/search';
    }
	
	if (handlers[command] !=undefined){
		return handlers[command](update.message,update.message.text);
	}
};

var runBot = function () {
    getUpdates(function (err, data) {
        if (err) {
            console.log(err);
            return runBot();
        }
        if (!data.ok) {
            console.log(data);
            return runBot();
        }
        data.result.map(messageHandler);
        runBot();
    });
};

callMethod('getMe', {}, function (err, data) {
    if (err) {
        throw err;
    }
    runBot();
});