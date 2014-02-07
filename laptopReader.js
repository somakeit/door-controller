#!/usr/bin/node
var winston = require('winston');
var CardReader = require('./cardReader.js');

var reader = new CardReader({'device':'/dev/mirror', 'knownCardsFile':'knownCards.json', "winston":winston});
reader.onFoundCard( function(card,state){
//  console.log("''%s'' (%s)",card.username,state)
});


