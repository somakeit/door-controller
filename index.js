var Keypad = require('./keypad');
var bcrypt = require('bcrypt');
var requestify = require('requestify');

var SECRET = fs.readFileSync('secret', {encoding: "utf8"}).trim();
var DATABASE_FILE = "./database.json";
var LOCK_PIN = 7;
var LOCK_OPEN_TIME = 6 * 1000;
var LOCATION = 'DOOR1';

var databaseUpdateUrl = 'https://members.somakeit.org.uk/pincodes';

var database = null;
try {
  database = require(DATABASE_FILE);
} catch (e) {
  console.error("Failed to read database, starting from scratch");
  database = {};
}

function updateCards() {
  requestify.get(httpurl, {
    cookies: {'SECRET': SECRET}
  }).then(function(response) {
    var newCards = response.getBody();
    try {
      database = JSON.parse(newCards);
      fs.writeFile(DATABASE_FILE, JSON.stringify(database, null, 2));
    } catch(e) {
      console.error("Failed to read new cards");
    }
  });
}
updateCards();
setInterval(updateCards, 5 * 60 * 1000);

gpio.open(LOCK_PIN, "output", function(err) {
  if (err) throw err;
  // LOCK THE DOOR!
  gpio.write(LOCK_PIN, false);

  function fail(data) {
    // Light up an LED?

    // Notify the server
    var body = {
      user_id: data ? data.user_id : null,
      location: LOCATION,
      successful: '0',
      when: +new Date()
    };
    requestify.post(databaseUpdateUrl + "/open", body, {cookies: {'SECRET': this.restSecret}});
  }

  function success(data) {
    // OPEN THE DOOR!
    gpio.write(LOCK_PIN, true);

    // Notify the server
    var body = {
      user_id: data.user_id,
      location: LOCATION,
      successful: '1',
      when: +new Date()
    };
    requestify.post(databaseUpdateUrl + "/open", body, {cookies: {'SECRET': this.restSecret}});

    // Wait a while
    setTimeout(function() {
      // LOCK THE DOOR!
      gpio.write(LOCK_PIN, false);
    }, LOCK_OPEN_TIME);
  }

  Keypad.on('pin', function(code) {
    if (!code || code.length != 12) {
      return fail();
    }
    var userId = parseInt(code.substr(0, 4), 10);
    var data = database[userId];
    if (data) {
      var hash = data.hashed_pincode;
      bcrypt.compare(code, hash, function(err, correct) {
        if (err || !correct) {
          return fail(data);
        }
        if (!data.keyholder) {
          return fail(data);
        }
        return success(data);
      });
    } else {
      return fail();
    }
  });
});
