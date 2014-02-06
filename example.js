#!/usr/bin/node

var CardReader = require('./cardReader.js');

var reader = new CardReader('test.data', 'test.knownCards.json');
reader.onFoundCard( function(card,state){
  console.log("''%s'' (%s)",card.name,state)
});

//var reader = new CardReader('test.data2', 'test.knownCards.json');
//reader.onFoundCard( function(card,state){console.log("''%s'' (%s)",card.name,state)});

