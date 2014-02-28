#!/usr/bin/node
var winston = require('winston');
var CardReader = require('./cardReader.js');
var b = require('bonescript');

var door = "P8_10";
var led = "USR3";
b.pinMode(door, 'out');
b.pinMode(led, 'out');
b.digitalWrite(led, b.LOW);

var reader = new CardReader({'device':'/dev/mirror', 'knownCardsFile':'knownCards.json', "winston":winston});
reader.onFoundCard( function(card,state){
  b.digitalWrite(door, b.HIGH);
  b.digitalWrite(led, b.HIGH);
  setTimeout(function() { 
    b.digitalWrite(door, b.LOW);
    b.digitalWrite(led, b.LOW);
  }, 100);

});


