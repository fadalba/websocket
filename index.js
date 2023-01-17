// on install avec npm install http, url et ws
//ws : Qui va nous permettre de créer une connexion Web-socket
//http : Qui va nous permettre de créer un serveur HTTP
//url : Qui va nous permettre de gérer et parser des url pour le serveur HTTP
const http = require('http');
const url = require('url');
const wsServer = require('ws').Server;
 // on a besoin de 2 variables qui vont correspondre aux ports de connexions pour le serveur http et les WebSockets. 
 
const HTTP_PORT = 8080;                                                                                                                                                                                                                                                                                                                                             
const WS_PORT = 4040;

// La fonction anonyme passée en paramètre de http.createServeur() se déclenche lorsqu’un client http va se connecter au serveur 
//et la fonction passée en paramètre de listen() se déclenche lorsque le serveur commence à écouter le port HTTP_PORT 
//(en gros, lorsque le serveur est prêt).
// on peut tester le server avec node index.js
http.createServer(function(req, res) {
  //  On utilise url.parse() pour récupérer l’url complète de la requête. Cela va nous permettre de pouvoir implémenter des 
 //   comportement différents en fonction de l’url. Pour l’instant, si on détecte que la requête a été faite sur le 
   // chemin “/broadcast” on retourne au client HTTP le message qu’il nous a envoyé afin de confirmer sa bonne réception.
  // On utilise parsedUrl.query pour récupérer les paramètres de la requête GET qui ont été passés dans l’url. 
  //Dans notre cas on désire que le client ait passé le paramètre “message”
   let parsedUrl = url.parse(req.url, true);
    let query = parsedUrl.query;
    let reponse = 'Bonjour Fadel, vous n"avez pas de message';
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });

    if (parsedUrl.pathname == '/broadcast' &&
        query.message != null
    ) {
        res.end('Bonjour Fadel, votre message est :' + query.message);
       // On utilise le serveur WebSocket pour parcourir tous les clients connectés puis leur envoyer le message msg passé 
     //   en paramètre de la fonction broadcast().
        broadcast(query.message);
    }
    res.end(reponse);
}).listen(HTTP_PORT, function() {
    console.log("HTTP Server ouvert sur: http://localhost:%s", HTTP_PORT);
});

//new wsServeur() va créer un serveur WebSocket accessible sur ws://localhost et sur le port WS_PORT (4040 dans notre cas)
const ws = new wsServer({ port: WS_PORT }, function() {
    console.log("Bonjour Fadel, votre Web socket est au port: ws://localhost:%s", WS_PORT);
});

ws.on('connection', function connection(ws) {
    console.log('bonjour Fadel, nouvelle donnée');
});

/** parcours de la liste des clients  connectés**/
function broadcast(msg) {
    ws.clients.forEach(function each(client) {
        client.send(msg); 
    });
};

//Maintenant, lorsque vous relancez le serveur Node et que vous allez sur l’url :

//http://localhost:8080/broadcast?message=Hello


/* *********************************************************coté arduino**************************************** */

var express = require('express');
/* var config = require('./config'); */
var fileUpload = require('express-fileupload');
var fs = require('fs');
var router = express.Router();
var app = express();
var assert = require('assert');

var server = http.createServer(app);
var mongodb = require('mongodb');
var io = require("socket.io")(server);
var mongoose = require('mongoose');
var MongoClient = require('mongodb').MongoClient;
var binary = mongodb.Binary;

app.use(express.static('public'));

// Set Templating Engine
/* app.use(expressLayouts);
app.set('layout', './layouts/full-width'); */
// Routes
/* app.get('/about', (req, res) => {
    res.render('about', { title: 'About Page', layout: './layouts/sidebar' });
});
app.set('view engine', 'ejs');
app.get('/css', function(req, res) {
    res.sendFile(__dirname + '/css/index.css');
});
app.get('/js', function(req, res) {
    res.sendFile(__dirname + '/js/script.js');
});
app.get('/header', function(req, res) {
    res.sendFile(__dirname + '/views/partials/header.ejs');
});
app.use(express.static("public")); */

//la racine pour les fichiers
router.get('/', function(req, res) {
    getFiles(res);
});

var Url = "mongodb+srv://fadalba:Thiaroye44@cluster0.daoknxe.mongodb.net/test"; 
server.listen(4000, function() {
    console.log('Demarrage du serveur Mongo au port', 4000);
})

const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const port = new SerialPort({ path: '/dev/ttyUSB0', baudRate: 9600 })// Si la vitesse de transmission est de 9600 (norme pour nos balances), 
//cela signifie que l'appareil peut envoyer 9600 bits par seconde à la sortie maximale et le port USB est définie

// On lit les donnees par ligne telles quelles apparaissent
const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))
/*  parser.on('data', console.log)  */
parser.on('open', function() {
    console.log('Connexion ouverte');
 });

parser.on('data', function(data) {
    console.log(data);
    io.emit('temp', data); // envoi de la température avec emit
    console.log(data);
    //decoupe des donnees venant de la carte Arduino
    var temperature = data.slice(0, 2); //decoupe de la temperature
    var humidite = data.slice(5, 7); //decoupe de l'humidite
    //calcul de la date et l'heure 
    var datHeure = new Date(); // date
    var min = datHeure.getMinutes();
    var heur = datHeure.getHours(); //heure
    var sec = datHeure.getSeconds(); //secondes
    var mois = datHeure.getDate(); //renvoie le chiffre du jour du mois 
    var numMois = datHeure.getMonth() + 1; //le mois en chiffre
    var laDate = datHeure.getFullYear(); // me renvoie en chiffre l'annee
    if (numMois < 10) { numMois = '0' + numMois; } // si le jour est <10 on affiche 0 devant
    if (mois < 10) { mois = '0' + mois; } // si le mois est <10 on affiche 0 devant
    if (sec < 10) { sec = '0' + sec; }
    if (min < 10) { min = '0' + min; }
    var heureInsertion = heur + ':' + min + ':' + sec;
    var heureEtDate = mois + '/' + numMois + '/' + laDate;
   
    //fin test
    if ((heur == 08 && min == 00 && sec == 00) || (heur == 12 && min == 00 && sec == 00) || (heur == 19 && min == 00 && sec == 00)) {
        var tempe = parseInt(temperature);
        var humi = parseInt(humidite);
        console.log("En Chiffre" + tempe);
        console.log("En chaine de caractere" + temperature);
        //l'objet qui contient la temperature, humidite et la date
        var tempEtHum = { 'Temperature': tempe, 'Humidity': humi, 'Date': heureEtDate, 'Heure': heureInsertion };
        //Connexion a mongodb et insertion Temperature et humidite
        MongoClient.connect(Url, { useUnifiedTopology: true }, function(err, db) {
            if (err) throw err;
            var dbo = db.db("gest_temp"); // nom de ma bdd
            dbo.collection("temperature_hum").insertOne(tempEtHum, function(err, res) {
                if (err) throw err;
                console.log("1 document inséré");
                db.close();
            });
        });

    } //Fin if
});
app.get('', (req, res) => {


    //Fonction pour la recuperation de la moyenne temperature
    MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
        if (err) throw err;
        var dbo = db.db("gest_temp");
        assert.equal(null, err);
        //Declaration des variables are
        var tempDixNeufHeure;
        var humDixNeufHeure;
        var tempDouzeHeure;
        var humDouzeHeure;
        var tempHuitHeure;
        var humHuitHeure;
        var moyH;
        var moyT;
        //fin
        var col = dbo.collection('temperature_hum');
        col.aggregate([{ $group: { _id: "_id", moyeTemp: { $avg: "$Temperature" } } }]).toArray(function(err, items) {
            console.log(items);
            moyT = items[0].moyeTemp;
            console.log(moyT);
        });
        //Moyenne humidite donnees
        col.aggregate([{ $group: { _id: "_id", moyeHum: { $avg: "$Humidity" } } }]).toArray(function(err, humi) {
            console.log(humi);
            moyH = humi[0].moyeHum;
            console.log(moyH);
        });
        //recuperation de la temperature de 8h
        col.find({ Heure: "08:00:00" }, { Temperature: 1 }).toArray(function(err, tem1) {
            console.log(tem1);
            tempHuitHeure = tem1[0].Temperature;
            humHuitHeure = tem1[0].Humidity;
            console.log("Temperature Huit heure:\t" + tempHuitHeure);
            console.log("Humidite Huit heure :\t" + humHuitHeure);
        });
        //recuperation de la temperature de 12h
        col.find({ Heure: "12:00:00" }, { Temperature: 1 }).toArray(function(err, tem2) {
            console.log(tem2);
            tempDouzeHeure = tem2[0].Temperature;
            humDouzeHeure = tem2[0].Humidity;
            console.log("Temperature Douze heure:\t" + tempDouzeHeure);
            console.log("Humidite Douze heure :\t" + humDouzeHeure);
        });
        //recuperation de la temperature de 19h
        col.find({ Heure: "19:00:00" }, { Temperature: 1 }).toArray(function(err, tem3) {
            console.log(tem3);
            tempDixNeufHeure = tem3[0].Temperature;
            humDixNeufHeure = tem3[0].Humidity;
            console.log("Temperature Dix neuf heure:\t" + tempDixNeufHeure);
            console.log("Humidite Dix neuf heure :\t" + humDixNeufHeure);

            var objet = [{
                MoyTemperature: moyT,
                MoyHumidite: moyH,
                TempHuitHeure: tempHuitHeure,
                HumiditeHuitHeure: humHuitHeure,
                TemperatureDouzeHeure: tempDouzeHeure,
                HumiditeDouzeHeure: humDouzeHeure,
                TemperatureDixNeufHeure: tempDixNeufHeure,
                HumiditeDixNeufHeure: humDixNeufHeure
            }];
            console.log("L'objet global = \t" + objet);
            res.render('index', { monObjet: objet });
            db.close();
        });

    });


});

//

//Si on arrive pas a lire sur le port, on affiche l'erreur concernee
port.on('error', function(err) {
    console.log(err);
});

app.use(fileUpload());
router.post("/upload", function(req, res) {
    var file = { name: req.body.name, file: binary(req.files.uploadedFiles.data) };
    insertFile(file, res);
});

function insertFile(file, res) {
    MongoClient.connect(Url, { useNewUrlParser: true }, function(err, base) {
        if (err) throw err;
        else {
            var db = base.db('gest_temp');
            var collection = db.collection('temperature_hum');
            try {
                collection.insertOne(file);
                console.log("nouvelle insertion");
            } catch (err) {
                console.log("Erreur lors de l'insertion.", err);
            }
            base.close();
            res.redirect('/');
        }
    });
}

function getFiles(res) {
    MongoClient.connect(Url, { useNewUrlParser: true }, function(err, base) {
        if (err) throw err;
        else {
            var db = base.db('gest_temp');
            var collection = db.collection('temperature_hum');
            collection.find({}).toArray((err, doc) => {
                if (err) throw err;
                else {
                    var buffer = doc[0].file.buffer;
                    fs.writeFileSync('uploadImage.jpg', buffer);
                }
            });
            base.close();
            res.redirect('/');
        }
    });
}
app.use("/", router);