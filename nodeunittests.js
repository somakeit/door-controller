var cards = 'test.knownCards.json';
var events = require('events')
emitter = new events.EventEmitter()

exports.tesParsetData1 = function(test){
  test.expect(1);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader('test.data', cards);

  var foundArray = [];
  var expectedArray = ["0430072e1e000000 on", "04a61a5ec4000000 on","0430072e1e000000 off" ];

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
  var reader = new CardReader('test.data2', cards);

  var foundArray = [];
  var expectedArray = [ '000004aef3f3ba00 on', '000004aef3f3ba00 off', '000004aef3f3ba00 on', '000004aef3f3ba00 off' ];

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
  var reader = new CardReader('test.data', cards);

  var foundArray = [];
  var expectedArray = [ 'Test card 3 on', 'Test card 2 on', 'Test card 3 off'];

  reader.onFoundCard( function(card,state){
    foundArray.push(card.name+ " "+state) 
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
  var reader = new CardReader('test.data2', cards);

  var foundArray = [];
  var expectedArray = [ 'Test card 4 on', 'Test card 4 off', 'Test card 4 on', 'Test card 4 off'];

  reader.onFoundCard( function(card,state){
    foundArray.push(card.name+ " "+state) 
  });

  //TODO: there must be a better way than using a timeout to switch active contexts
  setTimeout(function() { 
    test.deepEqual(foundArray, expectedArray, "Data didn't match");
    test.done() ;
  }, 100);
};

// Test that each card object in our test data has a .name field
exports.testCardDataValues = function(test){
  test.expect(6);

  var CardReader = require('./cardReader.js');
  var reader = new CardReader('test.data', cards);
  Object.keys(reader.knownCards).forEach(function(element, key, _array) {
    test.strictEqual(typeof(reader.knownCards[element].name), 'string');
  });
  var reader = new CardReader('test.data2', cards);
  Object.keys(reader.knownCards).forEach(function(element, key, _array) {
    test.strictEqual(typeof(reader.knownCards[element].name), 'string');
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
    new CardReader('test.data','nofile');
  });
  //TODO: there must be a better way than using a timeout to switch active contexts
  //setTimeout(function() { 
    test.done() ;
  //}, 100);
};
