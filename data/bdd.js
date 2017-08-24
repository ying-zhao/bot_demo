const MongoClient = require('mongodb').MongoClient;
const DB_CONN_STR = 'mongodb://localhost:27017/BOT_DEMO';

const idUtils = {};
idUtils.insertID = function (idMap) {
        MongoClient.connect(DB_CONN_STR,function(err,db){
            db.collection('id').insert(idMap,function (err,result) {
                if (!err) {
                    console.log(result);
                    db.close();
                    return result
                } else {
                    console.log('Error:' + err);
                    return err;
                }
            });
        }.bind(this));
};

idUtils.selectID = function (key) {
    return new Promise((resolve,reject)=>{
        MongoClient.connect(DB_CONN_STR,function (err,db) {
            db.collection('id').find({id : key.toString() }).toArray(function (err,result) {
                if(!err){
                    db.close();
                    resolve (result);
                }else{
                    console.log('Error:'+err);
                    reject (err);
                }
            });
        });
    })
};
// idUtils.selectID(1424150424367847).then(result=>console.log(result));
module.exports = idUtils;

// insertID({id:1,name:"ZHAO"});

