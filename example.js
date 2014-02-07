#!/usr/bin/node
var winston = require('winston');


var CardReader = require('./cardReader.js');

var reader = new CardReader('test.data', 'test.knownCards.json', {"winston":winston});
reader.onFoundCard( function(card,state){
  console.log("''%s'' (%s)",card.name,state)
});

//var reader = new CardReader('test.data2', 'test.knownCards.json');
//reader.onFoundCard( function(card,state){console.log("''%s'' (%s)",card.name,state)});

