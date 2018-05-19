SinuousWorld = new function() {
  var from = "n1Q8PYm1A3n4ejR1HXejeLFJakKTjb3Sutz";
  var dappAddress = "n1mX83PghG5DE1KaE73YDGdEXJLp5naT61y";
  var NebPay = require("nebpay");
  var nebPay = new NebPay();
  var date = 0;
  var start = false;

  var isMobile =
    navigator.userAgent.toLowerCase().indexOf("android") != -1 ||
    navigator.userAgent.toLowerCase().indexOf("iphone") != -1;

  var SCREEN_WIDTH = window.innerWidth;
  var SCREEN_HEIGHT = window.innerHeight;

  var canvas;
  var context;

  var status;
  var message;
  var title;
  var startButton;

  var enemies = [];
  var boosts = [];
  var particles = [];
  var player;

  var mouseX = window.innerWidth - SCREEN_WIDTH;
  var mouseY = window.innerHeight - SCREEN_HEIGHT;
  var mouseIsDown = false;

  var playing = false;
  var score = 0;
  var time = 0;

  var velocity = { x: -1.3, y: 1 };
  var difficulty = 1;

  this.init = function() {
    var nebulas = require("nebulas"),
      neb = new nebulas.Neb();
    neb.setRequest(new nebulas.HttpRequest("https://mainnet.nebulas.io"));
    var value = "0";
    var nonce = "0";
    var gas_price = "1000000";
    var gas_limit = "2000000";
    var value = "0";
    var callFunction = "getBestScore";
    var callArgs = [];
    var contract = {
      function: callFunction,
      args: JSON.stringify(callArgs)
    };
    var shaowBestScore = function(resp) {
      var result = JSON.parse(resp.result);
      var theBestScore = result.theBestScore;
      var theBestPlayer = result.theBestPlayer;
      $("#historyMax").html(theBestScore);
      $("#bestPlayer").html(theBestPlayer);
    };
    neb.api
      .call(from, dappAddress, value, nonce, gas_price, gas_limit, contract)
      .then(function(resp) {
        console.log(resp);
        shaowBestScore(resp);
      })
      .catch(function(err) {
        //cbSearch(err)
        console.log("error:" + err.message);
      });
    if (typeof webExtensionWallet === "undefined") {
      $("#noExtension").attr("style", "display:block;");
    }
    canvas = document.getElementById("world");
    status = document.getElementById("status");
    message = document.getElementById("message");
    title = document.getElementById("title");
    startButton = document.getElementById("startButton");

    if (canvas && canvas.getContext) {
      context = canvas.getContext("2d");

      // Register event listeners
      document.addEventListener("mousemove", documentMouseMoveHandler, false);
      document.addEventListener("mousedown", documentMouseDownHandler, false);
      document.addEventListener("mouseup", documentMouseUpHandler, false);
      canvas.addEventListener("touchstart", documentTouchStartHandler, false);
      document.addEventListener("touchmove", documentTouchMoveHandler, false);
      document.addEventListener("touchend", documentTouchEndHandler, false);
      window.addEventListener("resize", windowResizeHandler, false);
      startButton.addEventListener("click", startButtonClickHandler, false);

      player = new Player();

      windowResizeHandler();

      setInterval(loop, 3000 / 100);
    }
  };

  function startButtonClickHandler(event) {
    if (start == true) {
      if (playing == false) {
        playing = true;

        enemies = [];
        boosts = [];
        score = 0;
        difficulty = 1;

        player.trail = [];
        player.position.x = mouseX;
        player.position.y = mouseY;
        player.boost = 0;

        message.style.display = "none";
        status.style.display = "block";

        time = new Date().getTime();
      }
    } else {
      event.preventDefault();
      var value = "0";
      var callFunction = "applyToPlay";
      var callArgs = [];
      date = new Date().getTime();
      console.log(date + "");
      callArgs.push(date + "");
      nebPay.call(dappAddress, value, callFunction, JSON.stringify(callArgs), {
        //使用nebpay的call接口去调用合约,
        listener: function(resp) {
          var result = JSON.stringify(resp);
          if (result.indexOf("txhash") > -1) {
            start = true;
          } else if (result.indexOf("Error") > -1) {
            console.log("listener:" + resp);
            start = false;
          }
        }
      });
    }
  }

  var toast = function(msg, duration) {
    duration = isNaN(duration) ? 3000 : duration;
    var m = document.createElement("div");
    m.innerHTML = msg;
    m.style.cssText =
      "width:300px; text-align:center; padding:0 10px; height:52px; color:white; line-height:52px; border-radius:5px; position:fixed; top:0; left:0; right:0; bottom:0; margin:auto; z-index:998; background:rgba(0, 0, 0, 0.7); font-size:16px;";
    document.body.appendChild(m);
    setTimeout(function() {
      var d = 0.5;
      m.style.webkitTransition =
        "-webkit-transform " + d + "s ease-in, opacity " + d + "s ease-in";
      m.style.opacity = "0";
      setTimeout(function() {
        document.body.removeChild(m);
      }, d * 1000);
    }, duration);
  };

  function gameOver() {
    start = false;
    playing = false;
    var allTime = Math.round((new Date().getTime() - time) / 1000 * 100) / 100;
    message.style.display = "block";

    title.innerHTML =
      "最终得分：" + Math.round(score) + " 分      所用时间：" + allTime + "s";

    status.style.display = "none";
    var comeup =
      "<h3>雪花躲避游戏</h3><p>最终得分：" +
      Math.round(score) +
      " 分      所用时间：" +
      allTime +
      "s</p><br/><p>是否将当前游戏记录保存到星云链中?</p><br/>";
    alertify.confirm(comeup, function(e) {
      if (e) {
        var value = "0";
        var callFunction = "saveRecord";
        var callArgs = [];
        callArgs.push(date + "");
        callArgs.push(allTime + "");
        callArgs.push(Math.round(score) + "");
        nebPay.call(
          dappAddress,
          value,
          callFunction,
          JSON.stringify(callArgs),
          {
            //使用nebpay的call接口去调用合约,
            listener: function(resp) {
              console.log(resp);
            }
          }
        );
      } else {
        toast("请继续挑战哦！加油");
      }
    });
  }

  function documentMouseMoveHandler(event) {
    mouseX = event.clientX - (window.innerWidth - SCREEN_WIDTH) * 0.5 - 10;
    mouseY = event.clientY - (window.innerHeight - SCREEN_HEIGHT) * 0.5 - 10;
  }

  function documentMouseDownHandler(event) {
    mouseIsDown = true;
  }

  function documentMouseUpHandler(event) {
    mouseIsDown = false;
  }

  function documentTouchStartHandler(event) {
    if (event.touches.length == 1) {
      event.preventDefault();

      mouseX =
        event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * 0.5;
      mouseY =
        event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * 0.5;

      mouseIsDown = true;
    }
  }

  function documentTouchMoveHandler(event) {
    if (event.touches.length == 1) {
      event.preventDefault();

      mouseX =
        event.touches[0].pageX - (window.innerWidth - SCREEN_WIDTH) * 0.5;
      mouseY =
        event.touches[0].pageY - (window.innerHeight - SCREEN_HEIGHT) * 0.5;
    }
  }

  function documentTouchEndHandler(event) {
    mouseIsDown = false;
  }

  function windowResizeHandler() {
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;

    var cvx = (window.innerWidth - SCREEN_WIDTH) * 0.5;
    var cvy = (window.innerHeight - SCREEN_HEIGHT) * 0.5;

    canvas.style.position = "absolute";
    canvas.style.left = cvx + "px";
    canvas.style.top = cvy + "px";

    message.style.left = cvx + "px";
    message.style.top = cvy + 200 + "px";
  }

  function createParticles(position, spread, color) {
    var q = 10 + Math.random() * 15;

    while (--q >= 0) {
      var p = new Particle();
      p.position.x = position.x + Math.sin(q) * spread;
      p.position.y = position.y + Math.cos(q) * spread;
      p.velocity = { x: -4 + Math.random() * 8, y: -4 + Math.random() * 8 };
      p.alpha = 1;

      particles.push(p);
    }
  }

  function loop() {
    context.clearRect(0, 0, canvas.width, canvas.height);

    var svelocity = { x: velocity.x * difficulty, y: velocity.y * difficulty };

    var i, j, ilen, jlen;

    if (playing) {
      difficulty += 0.0008;

      pp = player.clonePosition();

      player.position.x += (mouseX - player.position.x) * 0.13;
      player.position.y += (mouseY - player.position.y) * 0.13;

      score += 0.4 * difficulty;
      score += player.distanceTo(pp) * 0.1;

      player.boost = Math.max(player.boost - 1, 0);

      if (player.boost > 0 && (player.boost > 100 || player.boost % 2 != 0)) {
        context.beginPath();
        context.fillStyle = "#fa3380";
        context.strokeStyle = "rgba(2,179,228,0.8)";
        context.arc(
          player.position.x,
          player.position.y,
          player.size * 2,
          0,
          Math.PI * 2,
          true
        );
        context.fill();
        context.stroke();
      }

      player.trail.push(new Point(player.position.x, player.position.y));

      context.beginPath();
      context.strokeStyle = "#fa3380";
      context.lineWidth = 3;

      for (i = 0, ilen = player.trail.length; i < ilen; i++) {
        p = player.trail[i];

        context.lineTo(p.position.x, p.position.y);

        p.position.x += svelocity.x;
        p.position.y += svelocity.y;
      }

      context.stroke();
      context.closePath();

      if (player.trail.length > 40) {
        player.trail.shift();
      }

      context.beginPath();
      context.fillStyle = "deepskyblue";
      context.arc(
        player.position.x,
        player.position.y,
        player.size / 2,
        0,
        Math.PI * 2,
        true
      );
      context.fill();
    }

    if (
      playing &&
      (player.position.x < 0 ||
        player.position.x > SCREEN_WIDTH ||
        player.position.y < 0 ||
        player.position.y > SCREEN_HEIGHT)
    ) {
      gameOver();
    }

    for (i = 0; i < enemies.length; i++) {
      p = enemies[i];

      if (playing) {
        if (
          player.boost > 0 &&
          p.distanceTo(player.position) < (player.size * 4 + p.size) * 0.5
        ) {
          createParticles(p.position, 10);
          enemies.splice(i, 1);
          i--;
          score += 10;
          continue;
        } else if (
          p.distanceTo(player.position) <
          (player.size + p.size) * 0.5
        ) {
          createParticles(player.position, 10);
          gameOver();
        }
      }

      context.beginPath();
      context.fillStyle = "white";
      context.arc(p.position.x, p.position.y, p.size / 1, 0, Math.PI * 2, true);
      context.fill();

      p.position.x += svelocity.x * p.force;
      p.position.y += svelocity.y * p.force;

      if (p.position.x < 0 || p.position.y > SCREEN_HEIGHT) {
        enemies.splice(i, 1);
        i--;
      }
    }

    for (i = 0; i < boosts.length; i++) {
      p = boosts[i];

      if (
        p.distanceTo(player.position) < (player.size + p.size) * 0.5 &&
        playing
      ) {
        player.boost = 2000;

        for (j = 0; j < enemies.length; j++) {
          e = enemies[j];

          if (e.distanceTo(p.position) < 100) {
            createParticles(e.position, 10);
            enemies.splice(j, 1);
            j--;
            score += 10;
          }
        }
      }

      context.beginPath();
      context.fillStyle = "lightgreen";
      context.arc(p.position.x, p.position.y, p.size / 1, 0, Math.PI * 2, true);
      context.fill();

      p.position.x += svelocity.x * p.force;
      p.position.y += svelocity.y * p.force;

      if (
        p.position.x < 0 ||
        p.position.y > SCREEN_HEIGHT ||
        player.boost != 0
      ) {
        boosts.splice(i, 9);
        i--;
      }
    }

    if (enemies.length < 25 * difficulty) {
      enemies.push(positionNewOrganism(new Enemy()));
    }

    if (boosts.length < 1 && Math.random() > 0.997 && player.boost == 0) {
      boosts.push(positionNewOrganism(new Boost()));
    }

    for (i = 0; i < particles.length; i++) {
      p = particles[i];

      p.velocity.x += (svelocity.x - p.velocity.x) * 0.04;
      p.velocity.y += (svelocity.y - p.velocity.y) * 0.04;

      p.position.x += p.velocity.x;
      p.position.y += p.velocity.y;

      p.alpha -= 0.02;

      context.fillStyle = "rgba(2,179,228,0.8)" + Math.max(p.alpha, 0) + ")";
      context.fillRect(p.position.x, p.position.y, 1, 1);

      if (p.alpha <= 0) {
        particles.splice(i, 1);
      }
    }

    if (playing) {
      scoreText = "得分: <span>" + Math.round(score) + "</span>";
      scoreText +=
        " 用时: <span>" +
        Math.round((new Date().getTime() - time) / 1000 * 100) / 100 +
        "s</span>";
      status.innerHTML = scoreText;
    }
  }

  function positionNewOrganism(p) {
    if (Math.random() > 0.5) {
      p.position.x = Math.random() * SCREEN_WIDTH;
      p.position.y = -20;
    } else {
      p.position.x = SCREEN_WIDTH + 20;
      p.position.y = -SCREEN_HEIGHT * 0.2 + Math.random() * SCREEN_HEIGHT * 1.2;
    }

    return p;
  }
}();

/**
 *
 */
function Point(x, y) {
  this.position = { x: x, y: y };
}
Point.prototype.distanceTo = function(p) {
  var dx = p.x - this.position.x;
  var dy = p.y - this.position.y;
  return Math.sqrt(dx * dx + dy * dy);
};
Point.prototype.clonePosition = function() {
  return { x: this.position.x, y: this.position.y };
};

/**
 *
 */
function Player() {
  this.position = { x: 0, y: 0 };
  this.trail = [];
  this.size = 8;
  this.boost = 0;
}
Player.prototype = new Point();

/**
 *
 */
function Enemy() {
  this.position = { x: 0, y: 0 };
  this.size = 6 + Math.random() * 4;
  this.force = 1 + Math.random() * 0.4;
}
Enemy.prototype = new Point();

/**
 *
 */
function Boost() {
  this.position = { x: 0, y: 0 };
  this.size = 10 + Math.random() * 8;
  this.force = 1 + Math.random() * 0.4;
}
Boost.prototype = new Point();

/**
 *
 */
function Particle() {
  this.position = { x: 0, y: 0 };
  this.force = 1 + Math.random() * 0.4;
  this.color = "#fa3380";
}
Particle.prototype = new Point();

SinuousWorld.init();
