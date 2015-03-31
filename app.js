var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs');
var cors = require('cors');
app.use(cors())

var tableau_missile = new Array();
var tableau_player_name = new Array();
var tableau_player_ID = new Array();
var tableau_player_pret = new Array();
var tableau_player_coord = new Array();
var commencer = 0;
var nb_personnes = 0;
var masterChief =  " ";

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

io.sockets.on('connection', function (socket, pseudo) {
    

    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('nouveau_client', function(data) {
        nb_personnes++;
        pseudo = ent.encode(data.pseudo);
        socket.pseudo = data.pseudo;
		if(masterChief==" ")
        {
            masterChief=data.pseudo;
            console.log("new masterChief !! "+data.pseudo_off);
            socket.emit('newMasterChief',masterChief);
            socket.broadcast.emit('newMasterChief',masterChief);
        }
        socket.broadcast.emit('nouveau_client', data);
		for(var i = 0; i < tableau_player_ID.length; i++) 
        {
            socket.emit('autre_joueur',{pseudo : tableau_player_ID[i], X : tableau_player_coord[2*i], Y : tableau_player_coord[2*i+1]});
        }
        tableau_player_ID.push(pseudo);
        tableau_player_name.push(pseudo_off);
		tableau_player_pret.push(0);
        tableau_player_coord.push(data.X);
        tableau_player_coord.push(data.Y);
        
        socket.emit('nb_connect',nb_personnes);
        console.log(data.pseudo_off+" est connecté !");
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
                tableau_player_name.splice(i,1);
                tableau_player_coord.splice(2*i,2);
            }
        }
        if(socket.pseudo==masterChief&&tableau_player_ID.length>0)
        {
            console.log("changement masterChief");
            masterChief=tableau_player_ID[0];
            socket.broadcast.emit('newMasterChief',masterChief);
			socket.emit('start');
			socket.broadcast.emit('start');
        }
		else{
            console.log("y'a personne!!");
            masterChief=" ";
            socket.broadcast.emit('newMasterChief',masterChief);
        }
    })
    
    socket.on('pret',function(pseudo)
    {
        for(var i = 0; i<tableau_player_pret.length; i++)
		{
			if(tableau_player_ID[i]==pseudo)
			{
				tableau_player_pret[i]=1;
			}
		}
		var somme = 0;
		for(var i = 0; i<tableau_player_pret.length; i++)
		{
			somme+=tableau_player_pret[i];
		}
		if(somme==tableau_player_ID.length)
		{
			commencer = 1;
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
			if(commencer==1)
			{
				socket.emit('start');
				socket.broadcast.emit('start');
			}
        }
		else{
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
