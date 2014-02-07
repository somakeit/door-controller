#!/usr/bin/node
var winston = require('winston');
var CardReader = require('./cardReader.js');

var reader = new CardReader('/dev/mirror', 'knownCards.json', {"winston":winston});
reader.onFoundCard( function(card,state){
//  console.log("''%s'' (%s)",card.name,state)
});


