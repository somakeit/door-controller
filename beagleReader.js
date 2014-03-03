#!/usr/bin/node
var winston = require('winston');
var CardReader = require('./cardReader.js');
var b = require('bonescript');

//set up logging
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, {level:'info', colorize:'false'});

// Options
var openTime = 10 * 1000; //10 sec open time
var door = "P8_10";
var led = "USR3";

// Set output modes, set IO to off
b.pinMode(door, b.OUTPUT);
b.digitalWrite(door, b.LOW);
b.pinMode(led, b.OUTPUT);
b.digitalWrite(led, b.LOW);

// quick util func to blink our led when the door is open
var ledState = 0;
blink = function() {
  ledState = ledState ? 0 : 1;
  b.digitalWrite(led, ledState);

};

// finally initialise our card reader
var reader = new CardReader({'device':'/dev/mirror', 'knownCardsFile':'knownCards.json', "winston":winston});

// set http update every 4 hours
reader.setHttpRefresher('https://members.somakeit.org.uk/adminapi/cards',2*60);

// when we find a card, open the door
reader.onFoundCard( function(card,state){
  if(state == "on"){
    //Open door, start blinking led
    winston.log('info', "Opening door for user %s", card.fullname)
    b.digitalWrite(door, b.HIGH);
    blinkTimer = setInterval(blink, 50);

    //After elapsed time, lock door, stop blinking
    setTimeout(function() { 
      //TODO: detect a second person coming in, cancel this timeout and use a later one
      winston.log('info', "Closing door");
      b.digitalWrite(door, b.LOW);
      clearInterval(blinkTimer);
      b.digitalWrite(led, b.LOW);
    }, openTime);
  }

});


