const express = require('express');
const router = express.Router();
const http = require('http');
const https = require('https');
const idUtils = require('../data/bdd')
const artistUtils = require('../data/bddArtist')
const host = 'api.worldweatheronline.com';
const wwoApiKey = 'a194c0a3549444abbc2153521172308';
const apiaiApp = require('apiai')('eec47ec68da84472a9d667020dab69c7');
const MongoClient = require('mongodb').MongoClient;
const DB_CONN_STR = 'mongodb://localhost:27017/BOT_DEMO';
request = require('request');
router.get('/webhook', function (req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === "TOKEN") {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});
router.post('/webhook', function (req, res) {
    let data = req.body;
    console.log(JSON.stringify(data));
    // Make sure this is a page subscription
    if (data.object === 'page') {
        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function (entry) {
            let pageID = entry.id;
            let timeOfEvent = entry.time;
            // Iterate over each messaging event
            entry.messaging.forEach(function (event) {
                if (event.message) {
                    // receivedMessage(event);
                    sendMessageAi(event);
                } else {
                    console.log("Webhook received unknown event: ", event);
                }
            });
        });
        res.sendStatus(200);
    }
});

function sendMessageAi(event){
    let sender = event.sender.id.toString();
    let text = event.message.text;
    let apiai = apiaiApp.textRequest(text,{
       sessionId:sender,
    });
    apiai.on('response', (response) => {
        let aiText = response.result.fulfillment.speech;
        request({
            url: 'https://graph.facebook.com/v2.6/me/messages',
            qs: {access_token: 'EAAHGd66oHxoBANpAPZCYRu6s16QO0BMokCgQJbaZBYGcWYHai2tlnzOa54rlun3sQJO0w2a5B9TtE2SwYXMdlEuV3BBpSbT1fLBcltZADpv2pjp7ZA1raZCMS03t9NbQTttlrnBjoLtRgt0RrZAdZCZB8FCFZCKWEAyGFRm67ZAh6DeuHzbo5kVCOo'},
            method: 'POST',
            json: {
                recipient: {id: sender},
                message: {text: aiText}
            }
        }, (error, response) => {
            if (error) {
                console.log('Error sending message: ', error);
            } else if (response.body.error) {
                console.log('Error: ', response.body.error);
            }
        });
    });
    apiai.on('error', (error) => {
        console.log(error);
    });
    apiai.end();
}

router.post('/botDemo',function(req,res,next){
    let intentName = req.body.result["metadata"]["intentName"];
    let date = '';
    if(intentName === "Default Welcome Intent"){
        let userid = req.body["sessionId"];
        idUtils.selectID(userid.toString()).then((result)=>{
            console.log("selectID=>"+result);
            getNameById(result,userid).then((output) => {
                // Return the results of the weather API to API.AI
                console.log("output=>"+output);
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
            }).catch((error) => {
                // If there is an error let the user know
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'speech': error, 'displayText': error }));
            });
        })
    }
    else if (intentName === "music.context" ||intentName === "music" ){
        let artistName = req.body['result']['contexts'][0]['parameters']['artist'];
        console.log('artistName=>'+artistName);
        if (artistName){
            artistUtils.selectArtist(artistName).then((result)=>{
                console.log('artists results=>'+result);
                let artists = result.filter((ele)=>{
                    return !(ele.name === artistName);
                });
                let artistPropose;
                let output;
                if (artists.length > 0){
                    artistPropose = artists[Math.floor(Math.random()* artists.length)];
                    output = 'Vous aimez la musique '+ artistPropose.type +', je vous conseille d\'écouter '+ artistPropose.name +', ça devrait vous plaire !';
                    console.log("output=>"+output);
                }else{
                    output = 'Désolé, je ne trouve pas d\'artiste correspondantes';
                    console.log("output=>"+output);
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify({ 'speech': output, 'displayText': output }));
            }).catch(err=>{
                console.log(err);
            });
        }else {
            output = 'Quel artiste écoutez vous?';
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({ 'speech': output, 'displayText': output }));

        }

    }
});

function getNameById(result,userid){
    //let selectIdData = idUtils.selectID(userid.toString());
    let selectIdData = result;
    return new Promise((resolve,reject)=>{
        let name;
        if(selectIdData.length>0){
            name = selectIdData[0].name;
            resolve('Bonjour '+name+', je suis un robot développé par Ying, et je vais te conseiller des artistes. Quel artiste écoutez vous?');
        }else{
            let hostFB = "graph.facebook.com";
            let path = "/"+userid+"?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=EAAHGd66oHxoBANpAPZCYRu6s16QO0BMokCgQJbaZBYGcWYHai2tlnzOa54rlun3sQJO0w2a5B9TtE2SwYXMdlEuV3BBpSbT1fLBcltZADpv2pjp7ZA1raZCMS03t9NbQTttlrnBjoLtRgt0RrZAdZCZB8FCFZCKWEAyGFRm67ZAh6DeuHzbo5kVCOo";
            let url="https://graph.facebook.com/v2.6/"+userid+"?fields=first_name,last_name,profile_pic,locale,timezone,gender&access_token=EAAHGd66oHxoBANpAPZCYRu6s16QO0BMokCgQJbaZBYGcWYHai2tlnzOa54rlun3sQJO0w2a5B9TtE2SwYXMdlEuV3BBpSbT1fLBcltZADpv2pjp7ZA1raZCMS03t9NbQTttlrnBjoLtRgt0RrZAdZCZB8FCFZCKWEAyGFRm67ZAh6DeuHzbo5kVCOo";
            console.log('API Request: ' + hostFB + path);
            https.get({host: hostFB, path: path},(res)=>{
                let body ='';
                res.on('data',(d) => {body += d;});
                res.on('end',()=>{
                    console.log(body);
                    let response = JSON.parse(body);
                    console.log(response);
                    let firstName = response['first_name'];
                    let lastName = response['last_name'];
                    let output = `Bonjour ${firstName} ${lastName},je suis un robot développé par Ying, et je vais te conseiller des artistes. Quel artiste écoutez vous?`;
                    console.log(output);
                    idUtils.insertID({id:userid,name:firstName+' '+lastName});
                    resolve(output);
                });
                res.on('error', (error) => {
                    console.log("err=>"+error);
                    reject(error);
                });
            });
            //
            // request.get(url).on('response',function(response){
            //    console.log(response);
            //    resolve(response);
            // }).on('error',function (err) {
            //     console.log(err);
            //     reject(err);
            // });
        }
    });
}
module.exports = router;
