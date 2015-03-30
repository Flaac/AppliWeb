var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');

var tableau_missile = new Array();
var tableau_player_ID = new Array();
var tableau_player_coord = new Array();
var pret = 0;
var nb_personnes = 0;
var masterChief =  " ";

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
	

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
		if(masterChief==" ")
		{
			masterChief=pseudo;
			console.log("new masterChief !! "+pseudo);
			socket.emit('newMasterChief',masterChief);
			socket.broadcast.emit('newMasterChief',masterChief);
		}
		socket.broadcast.emit('nouveau_client', pseudo);
        tableau_player_ID.push(pseudo);
        tableau_player_coord.push(50);
        tableau_player_coord.push(50);
        nb_personnes = nb_personnes +1;
		
        socket.emit('nb_connect',nb_personnes);
        console.log(pseudo+" est connecté !");
		for(var i = 0; i < tableau_player_ID.length-1; i++) 
		{
			socket.emit('autre_joueur',{pseudo : tableau_player_ID[i], X : tableau_player_coord[2*i], Y : tableau_player_coord[2*i+1]});
		}
		

    })

	socket.on('position', function(data)
    {
        for (var i = 0; i < tableau_player_ID.length; i++) 
        {
            if(tableau_player_ID[i]==data.pseudo)
            {
                tableau_player_coord[2*i] = data.positionX;
                tableau_player_coord[2*i+1] = data.positionY;
            }
        };
        socket.broadcast.emit('position',data);
    })

	socket.on('newEnemy',function(data)
	{
		socket.broadcast.emit('newEnemy',data);
	})
	
	socket.on('mort',function(pseudo)
	{
		socket.broadcast.emit('mort',pseudo);
		for (var i = 0; i < tableau_player_ID.length; i++) 
        {
            if(tableau_player_ID[i]==socket.pseudo)
            {
				tableau_player_ID.splice(i,1);
                tableau_player_coord.splice(2*i,2);
            }
        }
		if(socket.pseudo==masterChief&&tableau_player_ID.length>0)
		{
			console.log("changement masterChief");
			masterChief=tableau_player_ID[0];
			socket.broadcast.emit('newMasterChief',masterChief);
		}else{
			console.log("y'a personne!!");
			masterChief=" ";
			socket.broadcast.emit('newMasterChief',masterChief);
		}
	})
	
	socket.on('nextLevel',function()
	{
		socket.broadcast.emit('nextLevel');
	})
	
	socket.on('pret',function()
	{
		pret=pret+1;
		if(pret==tableau_player_ID.length)
		{
			socket.emit('start');
			socket.broadcast.emit('start');
		}
	})
	// Gere tous les missiles
    // Ici on les stocke (indispensable ?)
    socket.on('creationLigne',function(data)
    {
        tableau_missile.push(data.x1);
        tableau_missile.push(data.y1);
        tableau_missile.push(data.x2);
        tableau_missile.push(data.y2);
        socket.broadcast.emit('creationLigne',data);
        setTimeout(function()
        {
            tableau_missile.shift();tableau_missile.shift();
            tableau_missile.shift();tableau_missile.shift();
        },100);

    })
	
	socket.on('disconnect',function(data)
    {
        console.log("Un client de moins !"+ socket.pseudo);
		for (var i = 0; i < tableau_player_ID.length; i++) 
        {
            if(tableau_player_ID[i]==socket.pseudo)
            {
				tableau_player_ID.splice(i,1);
                tableau_player_coord.splice(2*i,2);
            }
        }
		if(socket.pseudo==masterChief&&tableau_player_ID.length>0)
		{
			masterChief=tableau_player_ID[0];
			socket.broadcast.emit('newMasterChief',masterChief);
		}else{
			masterChief=" ";
			socket.broadcast.emit('newMasterChief',masterChief);
		}
		socket.broadcast.emit('mort_joueur',socket.pseudo);
		console.log(tableau_player_ID);
        nb_personnes = nb_personnes - 1;
        socket.emit('nb_connect', nb_personnes);
    })
	
	socket.on('mouvementEnemy',function(data)
	{
		socket.broadcast.emit('mouvementEnemy',data);
	})
	
	socket.on('enemyKill',function(id)
	{
		socket.broadcast.emit('enemyKill',id);
	})
});

server.listen(8080);
