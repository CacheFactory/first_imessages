var sqlite3 = require('sqlite3').verbose();
var fs = require("fs");
var prompt = require('prompt');


prompt.start();

var dbFile = process.env.HOME+"/Library/Messages/chat.db";

if(fs.existsSync(dbFile)){
  var db = new sqlite3.Database(dbFile);

  var users = {};

  db.all("SELECT ROWID, id From handle;", function(err, rows) {
    for(var i in rows){
      users[rows[i].ROWID] = rows[i].id
      console.log("ID: " + rows[i].ROWID + ": NUMBER: " + rows[i].id );
    }

    console.log('User to load messages: ');

    prompt.get(['id'], function (err, result) {
      if (err) { return onErr(err); }
      db.each("select * from message where handle_id=" + result.id + " ORDER BY ROWID LIMIT 20;", function(err, results) {
        console.log(results.text)
      });
      

    });
  })

}else{
  console.log("Message database does not exist");
}


