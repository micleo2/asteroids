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
var localBulletID = 0;

socket.emit("test", "Hello there");

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
  translate(plyr.loc.x, plyr.loc.y);
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
        if (l.x < -this.r){
            l.x = width + this.r;
        }else if (l.x > width + this.r){
            l.x = -this.r;
        }
        if (l.y < -this.r){
            l.y = height + this.r;
        }
        if (l.y > height + this.r){
            l.y = -this.r;
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
    }
};
var drawAsteroids = function(){
  for (var i = 0; i < asteroids.length; i++){
    var cur = asteroids[i];
    cur.draw();
    fill(0);
  }
};
  var updateAsteroids = function(){
      for (var i = 0; i < asteroids.length; i++){
    var cur = asteroids[i];
    cur.x += cur.vx;
    cur.y += cur.vy;
    var ra = cur.stage * 20;
    // if (cur.x < -ra){
    //   cur.x = width + ra;
    // }
    // if (cur.x > width + ra){
    //   cur.x = -ra;
    // }
    // if (cur.y < -ra){
    //   cur.y = height + ra;
    // }
    // if (cur.y > height + ra){
    //   cur.y = -ra;
    // }
  }
};
  var drawBullets = function(bulletList){
      for (var i = 0; i < bulletList.length; i++){
        noStroke();
        var b = bulletList[i];
        fill(b.fillColor);
        stroke(0, 0, 0);
        ellipse(bulletList[i].x, bulletList[i].y, b.r*2, b.r*2);
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

void draw () {
  frameRate(30);
  background(255);
  p.update();
  drawPlayer(p);
  p.checkEdges();
  p.userInput();
  drawAsteroids();
  updateAsteroids();
  drawBullets(bullets);
  handleCollisions(bullets);
  drawBullets(enemyBullets);
  handleCollisions(enemyBullets);
  for (let n = 0; n < remotePlayers.length; n++){
    drawPlayer(remotePlayers[n].player);
    fill(remotePlayers[n].player.fillColor);
    textAlign(LEFT, CENTER);
    text("Enemy score " + remotePlayers[n].player.gameScore + "; bullets taken: " + remotePlayers[n].player.bulletsTaken, 20, (n*30) + 40);
  }
  isHit(enemyBullets);
  textAlign(CENTER, CENTER);
  fill(0);
  text("Your score: " + p.gameScore, width/2, 50);
  text("Bullets taken: " + p.bulletsTaken, width/2, 80);
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
