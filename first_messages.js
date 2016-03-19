var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var prompt = require('prompt');
var glob = require('glob');
var promise = require('promise');

var pry = require('pryjs')


var FirstMessages = function(chatDbFile, contactsDbFile){
  this.chatDbFile = chatDbFile
  this.contactsDbFile = contactsDbFile
}

FirstMessages.prototype.startCommandLine = function() {
  var self = this;
  if(fs.existsSync( this.chatDbFile) ){
    var db = new sqlite3.Database(this.chatDbFile);
    if(fs.existsSync(this.contactsDbFile)){ // load contacts if we have contacts file
      var contactDb = new sqlite3.Database(this.contactsDbFile);
      self.loadContactNames(contactDb).then(function(numberNameMap){
        self.loadMessages(db, numberNameMap);
      })
    }else{
      this.loadMessages(db);
    }

  }else{
    console.log("Message database does not exist");
  }

  

}

FirstMessages.prototype.loadMessages = function(db, numberNameMap){
  var self = this
  var users = {};
  numberNameMap = numberNameMap || {}

  db.all("SELECT ROWID, id FROM `handle`;", function(err, rows) {
    for(var i in rows){
      var cleanNumber = rows[i].id.replace(/\D/g,'');

      var secondHalf = (numberNameMap[cleanNumber]) ? " Name: " + numberNameMap[cleanNumber] : " Number: " + cleanNumber

      users[rows[i].ROWID] = cleanNumber
      console.log("ID: " + rows[i].ROWID + secondHalf );
    }
    self.showMessages(db);
    
  })
}

FirstMessages.prototype.showMessages = function(db){
  var self = this
  console.log('User to load messages: ');
  prompt.start();
  prompt.get(['ID'], function (err, promptResult) {
    if (err) { return onErr(err); }
    db.each("select * from message where handle_id=" + promptResult.ID + " ORDER BY ROWID LIMIT 20;", function(err, result) {
      if(result){
        var prefix = result.is_from_me ? "You: " : "Other: " 
        console.log(prefix + result.text);
      }else{
        console.log("No messages found")
      }
    });

    self.showMessages(db)
  });
}

FirstMessages.prototype.loadContactNames = function(db){
  var self = this
  return new Promise(function (fulfill, reject){
    db.all("select ZFULLNUMBER, ZFIRSTNAME, ZLASTNAME from ZABCDPHONENUMBER JOIN ZABCDRECORD ON ZABCDPHONENUMBER.ZOWNER = ZABCDRECORD.Z_PK;", function(err, rows) {
      if(err){
        reject(err)
      }
      var numberNameMap = {}
      for(var i in rows){
        var cleanNumber = rows[i].ZFULLNUMBER.replace(/\D/g,'');
        if(cleanNumber.length == 10){
          cleanNumber = "1" + cleanNumber
        }
        numberNameMap[cleanNumber] = (rows[i].ZFIRSTNAME || "") + (rows[i].ZLSTNAME || "");
      }
      fulfill(numberNameMap);
      
    })
  });
  
}

var getContactDBFile = function(){
  return new Promise(function (fulfill, reject){
    glob(process.env.HOME+"/Library/Application Support/AddressBook/Sources/**/*.abcddb", function (er, files) {
      files.sort(function(file) {
        var stats = fs.statSync(file)
        return stats["size"]
      })

      fulfill(files[0]) // take the largest DB
    }) 
  })
}

var dbFile = process.env.HOME+"/Library/Messages/chat.db";

getContactDBFile().then(function(chatDbFile){
  var chat = new FirstMessages(dbFile,chatDbFile)
  chat.startCommandLine()
});





