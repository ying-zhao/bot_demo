const MongoClient = require('mongodb').MongoClient;
const DB_CONN_STR = 'mongodb://localhost:27017/BOT_DEMO';
const artistUtils = {};

artistUtils.selectArtist = function (name) {
    return new Promise((resolve,reject)=>{
        MongoClient.connect(DB_CONN_STR,function (err,db) {
           // db.collection('id').find({id : key.toString() }).toArray(function (err,result) {
            db.collection('artists').find({name : name}).toArray(function (err,result) {
                if(!err && result.length > 0 ){
                    console.log('type=>'+result);
                    db.collection('artists').find({type : result[0].type}).toArray(function(err,result2){
                        if (!err){
                            console.log('artists=>'+result2);
                            db.close();
                            resolve (result2);
                        }
                        else{
                            console.log('Error:'+err);
                            reject (err);
                        }
                    })
                }else{
                    console.log('Error:'+err);
                    reject (err);
                }
            });
        });
    })
};
//artistUtils.selectArtist('Madonna').then(result=>console.log(result));
module.exports = artistUtils;