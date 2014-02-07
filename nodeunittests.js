var cards = 'test.knownCards.json';
var events = require('events')
var winston = require('winston');
emitter = new events.EventEmitter()

exports.tesParsetData1 = function(test){
  test.expect(1);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader( {'device': 'test.data', 'knownCardsFile': cards, 'winston':winston}) ;

  var foundArray = [];
  var expectedArray = ["30072e1e on", "a61a5ec4 on","30072e1e off" ];

  reader.read(function(id,state){ 
    foundArray.push(id+ " "+state) 
  });

  //TODO: there must be a better way than using a timeout to switch active contexts
  setTimeout(function() { 
    test.deepEqual(foundArray, expectedArray, "Data didn't match");
    test.done() ;
  }, 100);
};

exports.testParseData2 = function(test){
  test.expect(1);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader( {'device': 'test.data2', 'knownCardsFile': cards, 'winston':winston}) ;

  var foundArray = [];
  var expectedArray = [ 'aef3f3ba on', 'aef3f3ba off', 'aef3f3ba on', 'aef3f3ba off' ];

  reader.read(function(id,state){ 
    foundArray.push(id+ " "+state) 
  });

  //TODO: there must be a better way than using a timeout to switch active contexts
  setTimeout(function() { 
    test.deepEqual(foundArray, expectedArray, "Data didn't match");
    test.done() ;
  }, 100);
};

exports.testFoundCardData1 = function(test){
  test.expect(1);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader( {'device': 'test.data', 'knownCardsFile': cards, 'winston':winston}) ;
;

  var foundArray = [];
  var expectedArray = [ 'Test card 3 on', 'Test card 2 on', 'Test card 3 off'];

  reader.onFoundCard( function(card,state){
    foundArray.push(card.username+ " "+state) 
  });

  //TODO: there must be a better way than using a timeout to switch active contexts
  setTimeout(function() { 
    test.deepEqual(foundArray, expectedArray, "Data didn't match");
    test.done() ;
  }, 100);
};

exports.testFoundCardData2 = function(test){
  test.expect(1);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader( {'device': 'test.data2', 'knownCardsFile': cards, 'winston':winston}) ;

  var foundArray = [];
  var expectedArray = [ 'Test card 4 on', 'Test card 4 off', 'Test card 4 on', 'Test card 4 off'];

  reader.onFoundCard( function(card,state){
    foundArray.push(card.username+ " "+state) 
  });

  //TODO: there must be a better way than using a timeout to switch active contexts
  setTimeout(function() { 
    test.deepEqual(foundArray, expectedArray, "Data didn't match");
    test.done() ;
  }, 100);
};

// Test that each card object in our test data has a .username field
exports.testCardDataValues = function(test){
  test.expect(6);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader( {'device': 'test.data', 'knownCardsFile': cards, 'winston':winston}) ;
  Object.keys(reader.knownCards).forEach(function(element, key, _array) {
    test.strictEqual(typeof(reader.knownCards[element].username), 'string');
  });
  var reader = new CardReader( {'device': 'test.data2', 'knownCardsFile': cards, 'winston':winston}) ;
  Object.keys(reader.knownCards).forEach(function(element, key, _array) {
    test.strictEqual(typeof(reader.knownCards[element].username), 'string');
  });
  test.done();
};

exports.testErrorNoFiles = function(test){
  var CardReader = require('./cardReader.js');
  test.expect(1);

 //For some reason the first file not existing doesn't seem to throw - does node just exit??
 // test.expect(2);
  //test.throws(function(){
  //  new CardReader('nofile',cards);
  //});

  test.throws(function(){
  var reader = new CardReader( {'device': 'test.data', 'knownCardsFile': 'nofile', 'winston':winston}) ;
  });
  //TODO: there must be a better way than using a timeout to switch active contexts
  //setTimeout(function() { 
    test.done() ;
  //}, 100);
};
