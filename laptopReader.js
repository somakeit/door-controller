#!/usr/bin/node

var CardReader = require('./cardReader.js');

var reader = new CardReader('/dev/mirror', 'knownCards.json');
reader.onFoundCard( function(card,state){
//  console.log("''%s'' (%s)",card.name,state)
});


