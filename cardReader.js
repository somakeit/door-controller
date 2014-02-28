var fs = require('fs');
var requestify = require('requestify');
//winston.handleExceptions(); //TODO: need to give explicit handler

function CardReader(params) {
  // Early binding makes it easy to remove event listeners.
  var methodsToBind = ['_knownCardsFileChanged', '_parseKnownCardsData', 'setHttpRefresher'];
  for (var i = 0, key; key = methodsToBind[i++];) {
    try {
      this[key] = this[key].bind(this);
    } catch (e) {
      console.error("COULD NOT BIND "+key);
      throw e;
    }
  }

  this.winston = params.winston;
  this.device = params.device; //TODO throw if unset
  this.cardsFile = params.knownCardsFile;
  this.winston.log('info',"Loading reader for device/file '%s'", this.device);
  this.knownCards = {};
  this.readStream = fs.createReadStream(this.device); //TODO throw if unset

  this._loadKnownCardsSync();

  //Watch for new file
  fs.watchFile(this.knownCardsFile, this._knownCardsFileChanged);
}

CardReader.prototype.destroy = function() {
  // We must unlisten everything we've listened to.
  fs.unwatchFile(this.knownCardsFile, this._knownCardsFileChanged);
  this.readStream.removeAllListeners();
}

CardReader.prototype._knownCardsFileChanged = function(curr,prev) {
  if (curr.mtime != prev.mtime) {
    this.winston.log('info','cards file updated, reloading...');
    this._loadKnownCards();
  }
}

CardReader.prototype._loadKnownCardsSync = function() {
  var data = null, err = null;
  try {
    data = fs.readFileSync(this.cardsFile, {encoding: "utf8"});
  } catch (e) {
    err = e;
  }
  this._parseKnownCardsData(err, data);
}

CardReader.prototype._loadKnownCards = function() {
  fs.readFile(this.cardsFile, {encoding: "utf8"}, this._parseKnownCardsData);
}

CardReader.prototype._parseKnownCardsData = function(err, data) {
  var self = this;
  function handleError(err) {
    self.winston.log('error', "Could not read cards from file: " + err.message);
    self.winston.log('verbose', err.stack);
  }
  try {
    if (err) throw err;
    var cards = JSON.parse(data);
    if (typeof cards != 'object') throw new Error("data was not an object");
    this.knownCards = cards;
    //For some reason via the watchFile callback the above doesn't update us in memory... :s
    this.winston.log('info', "loaded %s cards from file", (Object.keys(this.knownCards)).length);
  } catch (e) {
    return handleError(e);
  }
}

CardReader.prototype.read = function(callback) {
  var rs = this.readStream;
  var self = this;
  rs.setEncoding('hex');
  rs.on('readable', function() {
    var chunk;
    while (null !== (chunk = rs.read(2))) {
      //x02 identifies start of card
      if(chunk == "02"){
        var onOff = rs.read(2);
        //x01 = on, x02 = off
        var onOffLabel = onOff == '01' ? 'on'  
                       : onOff == '02' ? 'off' 
                       : 'unknown';
        if(onOffLabel !== 'unknown' ){
          //next read to get rid of any nulls (there are often several)
          chunk = rs.read(2);
          var i=0;
          while(chunk == '00'){
            chunk=rs.read(2);
            i++;
            if(i==10){
              self.winston.log('warn','warning, found 10 null bytes instead of the card id');
              return;
            }
          }
          // next byte is the length field. (actually are any of the prior nulls part of a really long length field?)
          //TODO: AAARGH - no internet. How do you convert a hex string x0a to an integer (10) in nodejs?
          var length = chunk;
          // Finally read the number of bytes to get our id
          var cardId = rs.read(length*2);
          self.winston.log('verbose','Card %s is %s', cardId,onOffLabel);
          if(callback){
            callback(cardId,onOffLabel);
          }
        }else{
          //TODO: throw?
          self.winston.log('error',"Unknown state byte received from reader '%s'",onOffLabel);
        }
      }
    }
  });
};

CardReader.prototype.onFoundCard = function(callback) {
  var self = this;
  this.read(function(cardId,onOff){
    var card = self.knownCards[cardId];
    if(card){
      self.winston.log('debug',"Found card belonging to %s",card.username);
      callback(card,onOff);
    }else{
      //TODO: throw? warn only?
      self.winston.log('warn',"Unknown card found with id %s",cardId);
    }
  });
};

// set http refresh url and interval, Interval is in minutes
CardReader.prototype.setHttpRefresher = function(httpurl, refreshinterval) {
  var interval = refreshinterval * 60 * 1000;

  this._doRefreshCardsFromHttp(httpurl);
  setTimeout(function() { 
    this._doRefreshCardsFromHttp(httpurl);
  }, interval);
}

CardReader.prototype._doRefreshCardsFromHttp = function(httpurl) {
  this.winston.log('info','loading new file from %s', httpurl);
  var self = this;
  requestify.get( httpurl, {
               cookies: {'SECRET': 'whateveryouwanthereitsnotimportant'}
              }).then( function(response) {
    console.log( response.getBody() );
    //TODO: validate card data
    // load card data
    // write card data to file (in case we restart without network)
  }).catch(function (error) {
    // Handle any error from all above steps
    self.winston.log('error', 'Got ERROR loading cards from http. Got code ',error.code);
    self.winston.log('error', error.body);
  });
}

module.exports = CardReader;
