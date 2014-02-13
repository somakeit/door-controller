#!/usr/bin/node
var winston = require('winston');
var CardReader = require('./cardReader.js');

//var reader = new CardReader({'device':'test.data', 'knownCardsFile':'test.knownCards.json', "winston":winston});
var reader = new CardReader({'device':'test.data', "winston":winston});

//reader.setHttpRefresher('https://github.com/so-make-it/door-controller/raw/master/test.data2', 1);
reader.setHttpRefresher('http://localhost:1337/adminapi/cards',1);
reader.onFoundCard( function(card,state){
  console.log("''%s'' (%s)",card.username,state)
});
