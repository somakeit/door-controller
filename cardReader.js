var fs = require('fs');
//winston.handleExceptions(); //TODO: need to give explicit handler

function CardReader(params) {
  this.winston = params.winston;
  this.device = params.device; //TODO throw if unset
  this.cardsFile = params.knownCardsFile;
  this.winston.log('info',"Loading reader for device/file '%s' with known cards file '%s'", this.device, this.knownCardsFile);
  this.knownCards = {};
  this.readStream = fs.createReadStream(this.device); //TODO throw if unset

  this._loadKnownCardsSync();
  //Watch for new file
  var self = this;
  fs.watchFile(this.knownCardsFile, function(curr,prev) {
    if (curr.mtime != prev.mtime) {
      self.winston.log('info','cards file updated, reloading...');
      self._loadKnownCards();
    }
  });
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
  fs.readFile(this.cardsFile, {encoding: "utf8"}, this._parseKnownCardsData.bind(this));
}

CardReader.prototype._parseKnownCardsData = function(err, data) {
  function handleError(err) {
    this.winston.log('error', "Could not read cards from file: " + err.message);
    this.winston.log('silly', err.stack);
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
          self.winston.log('info','Card %s is %s', cardId,onOffLabel);
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
      self.winston.log('info',"Found card belonging to %s",card.username);
      callback(card,onOff);
    }else{
      //TODO: throw? warn only?
      self.winston.warn("Unknown card found with id %s",cardId);
    }
  });
};

module.exports = CardReader;
