var events = require('events');
var gpio = require('pi-gpio');
var async = require('async');

var columns = [
  '16',
  '18',
  '7'
];
var rows = [
  '11',
  '12',
  '13',
  '15'
];

var table = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['*', 0, '#']
];

var Keypad = new events.EventEmitter();

module.exports = Keypad;

function ignoreErrors(fn) {
  return function() {
    fn()
  }
}

async.series({
  clearColumns: function(done) {
    console.log("Closing columns");
    async.mapSeries(columns, function(pin, next) {
      gpio.close(pin, ignoreErrors(next));
    }, done);
  },
  clearRows: function(done) {
    console.log("Closing rows");
    async.mapSeries(rows, function(pin, next) {
      gpio.close(pin, ignoreErrors(next));
    }, done);
  },
  setupColumns: function(done) {
    console.log("Opening columns");
    async.mapSeries(columns, function(pin, next) {
      gpio.open(pin, "output", function(err) {
        gpio.write(pin, false, next);
      });
    }, done);
  },
  setupRows: function(done) {
    console.log("Opening rows");
    async.mapSeries(rows, function(pin, next) {
      gpio.open(pin, "input pulldown", ignoreErrors(next));
    }, done);
  }
}, function(err) {
  console.log("READY!");
  Keypad.ready = true;
  Keypad.emit('ready');
  // Main

  var depressed = false;
  var lastKeypress = null;
  var entry = null
  read();

  function read() {
    var match = null;
    function checkColumn(columnIndex, done) {
      var columnPin = columns[columnIndex];
      function checkRow(rowIndex, done) {
        var rowPin = rows[rowIndex];
        gpio.read(rowPin, function(err, result) {
          if (result) {
            match = [columnIndex, rowIndex];
          }
          done();
        });
      }
      gpio.write(columnPin, true, function() {
        async.mapSeries([0, 1, 2, 3], checkRow, function() {
          gpio.write(columnPin, false, done);
        });
      });
    }
    async.mapSeries([0, 1, 2], checkColumn, function() {
      if (match && !depressed) {
        depressed = true;
        lastKeypress = +new Date();
        var char = String(table[match[1]][match[0]]);
        entry = entry || "";
        if (char == "#" && entry) {
          Keypad.emit('pin', entry);
          entry = null;
        } else {
          entry = entry + char;
        }
      } else if (!match) {
        depressed = false;
      }
      if (lastKeypress && (+new Date() - lastKeypress) > 15 * 1000) {
        // Timeout
        entry = null;
        lastKeypress = null;
        Keypad.emit('timeout');
      }
      setTimeout(read, 25);
    });
  }
});
