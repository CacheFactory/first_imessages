var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var prompt = require('prompt');


var dbFile = process.env.HOME+"/Library/Messages/chat.db";
var contactDbFile = process.env.HOME+"/Library/Application Support/AddressBook/Sources/7DD08DF2-701B-4EDC-9FC5-B94C57231460/AddressBook-v22.abcddb";

var loadContacts = function(db, numberNameMap){
  var users = {};
  numberNameMap = numberNameMap || {}

  db.all("SELECT ROWID, id From handle;", function(err, rows) {
    for(var i in rows){
      var cleanNumber = rows[i].id.replace(/\D/g,'');

      var secondHalf = (numberNameMap[cleanNumber]) ? " Name: " + numberNameMap[cleanNumber] : " Number: " + cleanNumber

      users[rows[i].ROWID] = cleanNumber
      console.log("ID: " + rows[i].ROWID + secondHalf );
    }

    showMessages(db);
    
  })
}

var showMessages = function(db){
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

    showMessages(db)
  });
}

var loadContactNames = function(db, callback){
  db.all("select ZFULLNUMBER, ZFIRSTNAME, ZLASTNAME from ZABCDPHONENUMBER JOIN ZABCDRECORD ON ZABCDPHONENUMBER.ZOWNER = ZABCDRECORD.Z_PK;", function(err, rows) {
    var numberNameMap = {}
    
    for(var i in rows){
      var cleanNumber = rows[i].ZFULLNUMBER.replace(/\D/g,'');
      if(cleanNumber.length == 10){
        cleanNumber = "1" + cleanNumber
      }
      numberNameMap[cleanNumber] = (rows[i].ZFIRSTNAME || "") + (rows[i].ZLSTNAME || "");
    }
    callback(numberNameMap);
    
  })
  
}

if(fs.existsSync(dbFile)){
  var db = new sqlite3.Database(dbFile);
  

  if(fs.existsSync(contactDbFile)){
    var contactDb = new sqlite3.Database(contactDbFile);
    loadContactNames(contactDb, function(numberNameMap){
      loadContacts(db, numberNameMap);
    })
  }else{
    loadContacts(db);
  }

  

}else{
  console.log("Message database does not exist");
}

