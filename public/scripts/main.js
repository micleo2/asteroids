var socket = io();
/*CHAT APP CODE; BEGIN*/
$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});
socket.on('chat message', function(msg){
  $('#messages').prepend($('<li>').text(msg));
});
/*CHAT APP CODE; END*/

var width = document.body.clientWidth;
var height = document.body.clientHeight;
void setup(){
  size(width , height);
}
var gameState = "start";
var keys = [];
var asteroids = [];
var remotePlayers = [];
var enemyBullets = [];
var keyIsPressed = false;
var f = createFont("monospace", 32);
var localBulletID = 0, frameCount = 0;
var starField = [];
var showMap = true;
var GAME_X = 6000;
var GAME_Y = 6000;
function Star(x, y, d){
  this.x = x;
  this.y = y;
  this.density = d;
  this.fillNum = getRandomInt(100, 255);

  this.draw = function(){
    noStroke();
    if (frameCount % 30 == 0){
      this.fillNum = getRandomInt(50, 255);
    }
    fill(this.fillNum);
    ellipse(this.x, this.y, this.density, this.density);
  }
}

for (let x = 0; x < width/30; x++){
  starField.push(new Star(getRandomInt(0, width), getRandomInt(0, height), random() * 5 + 1));
}

function drawStars(){
  for (let n = 0; n < starField.length; n++){
    starField[n].draw();
    starField[n].x -= (p.velocity.x * starField[n].density) / 5;
    starField[n].y -= (p.velocity.y * starField[n].density) / 5;

    if (starField[n].x < -10){
      starField[n].x = width + 10;
    }else if (starField[n].x > width + 10){
      starField[n].x = -10;
    }

    if (starField[n].y < -10){
      starField[n].y = height + 10;
    }else if (starField[n].y > height + 10){
      starField[n].y = -10;
    }
  }
}

var limit = function(v, lim){
    if (v.x > lim){
        v.x = lim;
    }else if (v.x < -lim){
        v.x = -lim;
    }
    if (v.y > lim){
        v.y = lim;
    }else if (v.y < -lim){
        v.y = -lim;
    }
};

function drawPlayer(plyr){
  stroke(0, 0, 0);
  strokeWeight(0);
  fill(plyr.fillColor);
  pushMatrix();
  translate(plyr.loc.x - p.loc.x + width/2, plyr.loc.y - p.loc.y + height/2);
  var sizee = 10;
  var yOff = 21;
  rotate(plyr.rot);
  triangle(0, -plyr.r+yOff, sizee, -sizee+yOff, -sizee, -sizee+yOff);

  if (plyr.engineOn){
      var yoff = 4;
      if (random() > 0.25){
        fill(225, 69, 0);
          noStroke();
            triangle(0, plyr.r/2+yoff, 5, 10+yoff, -5, 10+yoff);
      }
  }
  popMatrix();
}

function drawLocalPlayer(plyr){
  stroke(0, 0, 0);
  strokeWeight(0);
  fill(plyr.fillColor);
  pushMatrix();
  translate(width/2, height/2);
  var sizee = 10;
  var yOff = 21;
  rotate(plyr.rot);
  triangle(0, -plyr.r+yOff, sizee, -sizee+yOff, -sizee, -sizee+yOff);

  if (plyr.engineOn){
      var yoff = 4;
      if (random() > 0.25){
        fill(225, 69, 0);
          noStroke();
            triangle(0, plyr.r/2+yoff, 5, 10+yoff, -5, 10+yoff);
      }
  }
  popMatrix();
}

var Player = function(){

    this.loc = new PVector(width / 2, height / 2);
    this.velocity = new PVector();
    this.acceleration = new PVector();

    this.rot = 0;
    this.rotA = 0;
    this.rotSpeed = 0.01;
    this.r = 44;
    this.fillColor = getRandomColor();
    this.engineOn = false;

    this.gameScore = 0;
    this.bulletsTaken = 0;

    this.update = function(){
        this.rot += this.rotA;

        if (keys[UP]){
            this.velocity.add(this.acceleration);
            this.engineOn = true;
        }else{
          this.engineOn = false;
        }
        var rotLim = 0.2;
        if (this.rotA > rotLim){
            this.rotA = rotLim;
        }
        else if (this.rotA < -rotLim){
            this.rotA = -rotLim;
        }

        if (!(keyIsPressed && keyCode === LEFT) && !(keyIsPressed && keyCode === RIGHT)){
            this.rotA *= 0.9;
        }

        limit(this.velocity, 5);
        this.loc.add(this.velocity);
        this.acceleration.mult(0);
        socket.emit("playerUpdate", this);
    };

    this.checkEdges = function(){
        var l = this.loc;
        if (l.x < -GAME_X){
            l.x = GAME_X;
        }else if (l.x > GAME_X){
            l.x = -GAME_X;
        }
        if (l.y < -GAME_Y){
            l.y = GAME_Y;
        }
        if (l.y > GAME_Y){
            l.y = -GAME_Y;
        }
    };

    this.userInput = function(){
        var s = this.rotSpeed;

        if (keys[UP]){
            var copy = new PVector(cos(this.rot - toRadians(90)), sin(this.rot - toRadians(90)));

            copy.normalize();
            copy.mult(1);

            this.acceleration.add(copy);
        }

        if (keys[LEFT]){
            this.rotA -= s;
        }
        if (keys[RIGHT]){
            this.rotA += s;
        }

    };
};

var Asteroid = function(x, y, vx, vy, s){
  this.x = x;
  this.y = y;
  this.vx = vx;
  this.vy = vy;
  this.stage = s;
  this.draw = function(){
    fill(255);
    stroke(0);
    var radi = this.stage * 20;

    ellipse(this.x, this.y, radi*2, radi*2);
  };
};

var p = new Player();
var bullets = [];

void keyPressed (){
    keys[keyCode] = true;
    keyIsPressed = true;
      if (keyCode === 32 && gameState === "start"){
          gameState = "playing";
      }
};

void keyReleased (){
  keyIsPressed = false;
    keys[keyCode] = false;
    if (keyCode === 32 && bullets.length < 7){

        var copy = new PVector(sin(p.rot), -cos(p.rot));
        copy.normalize();
        copy.mult(8);

        var vvx = copy.x;
        var vvy = copy.y;
        var bulObj = {
            x: p.loc.x + sin(p.rot)*18,
            y: p.loc.y- (cos(p.rot)*24),
            vx: vvx,
            vy: vvy,
            r: 3,
            life: 100,
            fillColor: p.fillColor,
            bulletID: localBulletID++
        };
        bullets.push(bulObj);
        socket.emit("fireBullet", bulObj);
    }else if (keyCode === 77){//letter "m"
      showMap = !showMap;
    }
};

  var drawBullets = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        var b = bulletList[i];
        fill(b.fillColor);
        stroke(0, 0, 0);
        ellipse(bulletList[i].x, bulletList[i].y, b.r*2, b.r*2);
    }
  };

  var drawLocalBullets = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        var b = bulletList[i];
        fill(b.fillColor);
        strokeWeight(0.3);
        stroke(255);
        ellipse(bulletList[i].x - p.loc.x + width/2, bulletList[i].y - p.loc.y + height/2, b.r*2, b.r*2);
    }
  };

  var handleCollisions = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        noStroke();
        var b = bulletList[i];
        b.x += b.vx;
        b.y += b.vy;
        // if (b.x < -b.r){
        //     b.x = width + b.r;
        // }
        // if (b.x > width + b.r){
        //     b.x = -b.r;
        // }
        // if (b.y < -b.r){
        //     b.y = height + b.r;
        // }
        // if (b.y > height + b.r){
        //     b.y = -b.r;
        // }
          b.life--;
          if (b.life < 0){
              bulletList.splice(i, 1);
          }
          // for (var n = 0; n < asteroids.length; n++){
          //     var a = asteroids[n];
          //     var ra = a.stage * 20;
          //     if (b.x > a.x-ra && b.x < a.x + ra && b.y > a.y - ra && b.y < a.y + ra){
          //         asteroids.push(new Asteroid(a.x, a.y, random(-5, 5), random(-5, 5), a.stage-1));
          //         a.vx = random(-5, 5);
          //         a.vy = random(-5, 5);
          //         a.stage--;
          //         bullets.splice(i, 1);
          //     }
          //
          // }
    }
  };

  function isHit(bulletList){
    for (var n = 0; n < bulletList.length; n++){
      var curB = bulletList[n];
      if (dist(p.loc.x, p.loc.y, curB.x, curB.y) < 25){
        socket.emit("bulletHit", curB);
        bulletList.splice(n, 1);
        p.bulletsTaken++;
      }
    }
  }

  var init = function(){
    asteroids = [];
    bullets = [];
      for (var i = 1; i <= 10; i++){
        var xpos = random();
        var cush = 250;
        xpos = xpos > 0.5? random(width/2+cush, width) : random(0, width/2-cush);
        asteroids.push(new Asteroid(xpos, random(height), random(-5, 5), random(-5, 5), round(random(1, 4))));
      }
      asteroids = [];
  };
  init();
  var mapXSize = 300;
  var mapYSize = 300;
  var xScale = (mapXSize / 2) / GAME_X;
  var yScale = (mapYSize / 2) / GAME_Y;
  function drawminiMap(){
    fill(255, 255, 255, 255);
    noStroke();
    rect(width - mapXSize, height - mapYSize, mapXSize, mapYSize);
    pushMatrix();
    translate(width - mapXSize/2, height - mapYSize/2);
    rectMode(RADIUS);
    for (let n = 0; n < remotePlayers.length; n++){
      var location = remotePlayers[n].player.loc;
      fill(255, 0, 0);
      rect(location.x * xScale, location.y * yScale, 1.5, 1.5);
      //rect(0, 0, 5, 5);
    }
    fill(0, 255, 0);
    rect(p.loc.x * xScale, p.loc.y * yScale, 1.5, 1.5);
    popMatrix();
    rectMode(CORNER);
  }

var xSize = width / 4;
var ySize = height / 4;
void draw () {
  frameCount++;
  frameRate(30);
  background(0);
  fill(0, 255, 0);
  /*DRAW BACKGROUND; BEGIN*/
  drawStars();
  /*DRAW BACKGROUND; END*/
  p.update();
  p.checkEdges();
  p.userInput();
  drawLocalBullets(bullets);
  handleCollisions(bullets);
  drawBullets(enemyBullets);
  handleCollisions(enemyBullets);
  for (let n = 0; n < remotePlayers.length; n++){
    drawPlayer(remotePlayers[n].player);
    fill(remotePlayers[n].player.fillColor);
    textAlign(LEFT, CENTER);
    text("Enemy score " + remotePlayers[n].player.gameScore + "; bullets taken: " + remotePlayers[n].player.bulletsTaken, 20, (n*30) + 40);
  }
  drawLocalPlayer(p);
  isHit(enemyBullets);
  textAlign(CENTER, CENTER);
  fill(255);
  text("Your score: " + p.gameScore, width/2, 50);
  text("Bullets taken: " + p.bulletsTaken, width/2,80);
  if (showMap){
    drawminiMap();
  }
};

function getRandomColor() {
    return color(getRandomInt(0, 255), getRandomInt(0, 255), getRandomInt(0, 255));
  }

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  socket.on("playerUpdate", function (msgObj) {
    for (let n = 0; n < remotePlayers.length; n++){

      if (msgObj.id === remotePlayers[n].id){
        remotePlayers[n] = msgObj;
        return;
      }
    }
    remotePlayers.push(msgObj);
  })

  socket.on("fireBullet", function (bulObj) {
    enemyBullets.push(bulObj);
  });

  socket.on("bulletSuccess", function (bulObj) {
    for (var n = 0; n < bullets.length; n++){
      if (bullets[n].bulletID === bulObj.bulletID){
        bullets.splice(n, 1);
        break;
      }
    }
    p.gameScore++;
    document.getElementById("displayScore").innerHTML = p.gameScore;
  });

  socket.on("playerLeft", function (playerID) {
    console.log("SEARCHING FOR PLAYER...");
    for (let n = 0; n < remotePlayers.length; n++){
      if (remotePlayers[n].id === playerID.id){
        console.log("REMOVING PLAYER...");
        remotePlayers.splice(n, 1);
      }
    }
  });

  function toRadians (angle) {
    return angle * (Math.PI / 180);
  }
