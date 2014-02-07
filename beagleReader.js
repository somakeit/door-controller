#!/usr/bin/node

var CardReader = require('./cardReader.js');
var b = require('bonescript');

var door = "P8_10";
b.pinMode(door, 'out');

var reader = new CardReader({'device':'/dev/mirror', 'knownCardsFile':'knownCards.json', "winston":winston});
reader.onFoundCard( function(card,state){
  b.digitalWrite(door, b.HIGH);
  setTimeout(function() { 
    b.digitalWrite(door, b.LOW);
  }, 100);

});


