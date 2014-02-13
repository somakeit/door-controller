var fs = require('fs');
var http = require('http');
var https = require('https');
//winston.handleExceptions(); //TODO: need to give explicit handler

function CardReader(params) {
  this.winston = params.winston;
  this.device = params.device; //TODO throw if unset
  this.cardsFile = params.knownCardsFile;
  this.winston.log('info',"Loading reader for device/file '%s'", this.device);
  this.knownCards = {};
  this.readStream = fs.createReadStream(this.device); //TODO throw if unset

  //Watch for new file
  var self = this;
  console.log(this.cardsFile);
  if(this.cardsFile){
    this._loadKnownCards();
    fs.watchFile(this.knownCardsFile, function(curr,prev) {
      if (curr.mtime != prev.mtime) {
        self.winston.log('info','cards file updated, reloading...');
        self._loadKnownCards();
      }   
    });
  }
}

CardReader.prototype._loadKnownCards = function (){
  var data = fs.readFileSync(this.cardsFile, {encoding: "utf8"});
  //TODO: explicitly catch invalid parse?
  this.knownCards = JSON.parse(data);
  //For some reason via the watchFile callback the above doesn't update us in memory... :s
  this.winston.log('info', "loaded %s cards from file %s", (Object.keys(this.knownCards)).length, this.cardsFile);
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

// set http refresh url and interval, Interval is in minutes
CardReader.prototype.setHttpRefresher = function(httpurl, refreshinterval) {
  var interval = refreshinterval * 60 * 1000;
  var self = this;
  this.winston.log('info','loading new file from %s', httpurl);
  var options = { 'headers': {'Cookie':'SECRET=whateveryouwanthereitsnotimportant'},
                  'url': httpurl};

  //-b 'SECRET=whateveryouwanthereitsnotimportant'
  http.get(options, function(res){
    res.on('data', function(d) {
      console.log(d);
      var newCards = JSON.parse(d);
      //TODO validate contents
      this.knownCards = newCards;
      this.winston.log('info', "loaded %s cards from web", (Object.keys(this.knownCards)).length);
    });
  }).on('error',function(e){
    self.winston.log('error','error loading new file from %s',httpurl);
    self.winston.log('error', e);
  });
  setTimeout(function() { 
    self.setHttpRefresher(httpurl,refreshinterval);
  }, interval);
}

module.exports = CardReader;
