var fs = require('fs');
var winston = require('winston');
//winston.handleExceptions(); //TODO: need to give explicit handler

function CardReader(device, knownCardsFile) {
  winston.log('info',"Loading reader for device/file '%s' with known cards file '%s'", device, knownCardsFile);
  this.device = device; //TODO throw if unset
  this.knownCards = {};
  this.cardsFile = knownCardsFile;
  this.readStream = fs.createReadStream(device); //TODO throw if unset

  this._loadKnownCards();
  //Watch for new file
  var self = this;
  fs.watchFile(knownCardsFile, function(curr,prev) {
    if (curr.mtime != prev.mtime) {
      winston.log('info','cards file updated, reloading...');
      self._loadKnownCards();
    }   
  });
}

CardReader.prototype._loadKnownCards = function (){
  var data = fs.readFileSync(this.cardsFile, {encoding: "utf8"});
  //TODO: explicitly catch invalid parse?
  this.knownCards = JSON.parse(data);
  //For some reason via the watchFile callback the above doesn't update us in memory... :s
  winston.log('info', "loaded %s cards from file", (Object.keys(this.knownCards)).length);
}

CardReader.prototype.read = function(callback) {
  var rs = this.readStream;
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
              winston.log('warn','warning, found 10 null bytes instead of the card id');
              return;
            }
          }
          // next byte is the length field. (actually are any of the prior nulls part of a really long length field?)
          //TODO: AAARGH - no internet. How do you convert a hex string x0a to an integer (10) in nodejs?
          var length = chunk;
          // Finally read the number of bytes to get our id
          var cardId = rs.read(length*2);
          winston.log('info','Card %s is %s', cardId,onOffLabel);
          if(callback){
            callback(cardId,onOffLabel);
          }
        }else{
          //TODO: throw?
          winston.log('error',"Unknown state byte received from reader '%s'",onOffLabel);
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
      winston.log('info',"Found card belonging to %s",card.name);
      callback(card,onOff);
    }else{
      //TODO: throw? warn only?
      winston.warn("Unknown card found with id %s",cardId);
    }
  });
};

module.exports = CardReader;
