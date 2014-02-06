var fs = require('fs');
var winston = require('winston');
winston.handleExceptions();

function CardReader(device, knownCardsFile) {
  winston.log('info',"Loading reader for device/file '%s' with known cards file '%s'", device, knownCardsFile);
  this.device = device; //TODO throw if unset
  this.knownCards = [];
  this.readStream = fs.createReadStream(device); //TODO throw if unset

  data = fs.readFileSync(knownCardsFile, {encoding: "utf8"});
  this.knownCards = JSON.parse(data);
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
          // 8byte [16char](?)  card id - Might be shorter - 5byte?
          // Current tested cards seem to be about 5, but I don't know how long a card id really
          // should be, so might be safer to read longer? It will be important to fix this
          // before we start storing known card id's
          //  -Reading one of my cards with my phone NFC tag reader I get an ID that is 4 bytes 
          //   long. The usb reader gives the same id but with a leading x04. Perhaps the x04 is
          //   the length of the id - My NFC app does say UID[4] as before the id.
          var cardId = rs.read(16);
          winston.log('info','Card %s is %s', cardId,onOffLabel);
          if(callback){
            callback(cardId,onOffLabel);
          }
        }else{
          //TODO: throw?
          winston.error("Unknown state byte received from reader '%s'",onOffLabel);
        }
      }
    }
  });
};

CardReader.prototype.onFoundCard = function(callback) {
  var knownCards = this.knownCards;
  this.read(function(cardId,onOff){
    var card = knownCards[cardId];
    if(card){
      winston.log('info',"Found card belongning to %s",card);
      callback(card,onOff);
    }else{
      //TODO: throw? warn only?
      winston.warn("Unknown card found with id %s",cardId);
    }
  });
};

module.exports = CardReader;
