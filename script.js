    window.requestAnimationFrame =
        window.__requestAnimationFrame ||
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            (function () {
                return function (callback, element) {
                    var lastTime = element.__lastTime;
                    if (lastTime === undefined) {
                        lastTime = 0;
                    }
                    var currTime = Date.now();
                    var timeToCall = Math.max(1, 33 - (currTime - lastTime));
                    window.setTimeout(callback, timeToCall);
                    element.__lastTime = currTime + timeToCall;
                };
            })();
    window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));
    var loaded = false;
    var audioElement;
    var init = function () {
      if (loaded) return;
      loaded = true;
      var audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      var analyser = audioContext.createAnalyser();
      var source = audioContext.createMediaElementSource(audioElement);

      // Kết nối thẻ audio với analyser và đầu ra
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      var dataArray = new Uint8Array(analyser.frequencyBinCount);

      function getAverageFrequency() {
            analyser.getByteFrequencyData(dataArray);

            // Dải bass: khoảng từ 20 Hz đến 250 Hz (giả sử phân tích trong 512 bins)
            var bassSum = 0;
            var bassCount = 0;
            var start = Math.floor(
              20 / (audioContext.sampleRate / analyser.frequencyBinCount)
            ); // Tính toán chỉ số bin cho 20 Hz
            var end = Math.floor(
              250 / (audioContext.sampleRate / analyser.frequencyBinCount)
            ); // Tính toán chỉ số bin cho 250 Hz

            for (var i = start; i <= end; i++) {
              bassSum += dataArray[i];
              bassCount++;
            }

            var averageBass = bassSum / bassCount;
            return averageBass;
      }

      var mobile = window.isDevice;
      var koef = mobile ? 0.5 : 1;
      var canvas = document.getElementById("heart");
      var ctx = canvas.getContext("2d");
      var width = (canvas.width = koef * innerWidth);
      var height = (canvas.height = koef * innerHeight);
      var rand = Math.random;
      var heartCenterX = width / 2; // Lưu trữ trung tâm của trái tim
      var heartCenterY = height / 2; // Lưu trữ trung tâm của trái tim
      var heartOffsetX = 0; // Biến để điều chỉnh độ dịch chuyển của trái tim theo chiều ngang
      var heartOffsetDirection = 1; // Hướng dịch chuyển của trái tim
      ctx.fillStyle = "rgba(0,0,0,1)";
      ctx.fillRect(0, 0, width, height);

      var heartPosition = function (rad) {
        return [
          Math.pow(Math.sin(rad), 3),
          -(
            15 * Math.cos(rad) -
            5 * Math.cos(2 * rad) -
            2 * Math.cos(3 * rad) -
            Math.cos(4 * rad)
          ),
        ];
      };
      var scaleAndTranslate = function (pos, sx, sy, dx, dy) {
        return [dx + pos[0] * sx, dy + pos[1] * sy];
      };

      window.addEventListener("resize", function () {
        width = canvas.width = koef * innerWidth;
        height = canvas.height = koef * innerHeight;
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fillRect(0, 0, width, height);
      });

      var traceCount = mobile ? 20 : 50;
      var pointsOrigin = [];
      var i;
      var dr = mobile ? 0.3 : 0.1;
      for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
      for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
      for (i = 0; i < Math.PI * 2; i += dr)
        pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));
      var heartPointsCount = pointsOrigin.length;

      var targetPoints = [];
      var pulse = function (kx, ky) {
        for (i = 0; i < pointsOrigin.length; i++) {
            targetPoints[i] = [];
            targetPoints[i][0] = kx * pointsOrigin[i][0] + width / 2; // Cộng heartOffsetX để di chuyển trái tim qua lại
            targetPoints[i][1] = ky * pointsOrigin[i][1] + height / 2;
        }
      };

      var e = [];
      for (i = 0; i < heartPointsCount; i++) {
        var x = rand() * width;
        var y = rand() * height;
        e[i] = {
          vx: 0,
          vy: 0,
          R: 2,
          speed: rand() + 5,
          q: ~~(rand() * heartPointsCount),
          D: 2 * (i % 2) - 1,
          force: 0.2 * rand() + 0.7,
          f:
            "hsla(0," +
            ~~(40 * rand() + 60) +
            "%," +
            ~~(60 * rand() + 20) +
            "%,.3)",
          trace: [],
        };
        for (var k = 0; k < traceCount; k++) e[i].trace[k] = { x: x, y: y };
      }

      var config = {
        traceK: 0.4,
        timeDelta: 0.01, // Thay đổi tốc độ hiệu ứng ở đây
        scaleSpeed: 0.1, // Thay đổi tốc độ phóng to thu nhỏ
      };

      var colorArray = [
        "rgba(255, 0, 0, 0.8)",   // Đỏ
        "rgba(255, 182, 193, 0.8)", // Hồng nhạt
        "rgba(0, 139, 139, 0.8)", // Xanh dương đậm
        "rgba(0, 0, 255, 0.8)",   // Xanh dương
        "rgba(255, 102, 102, 0.8)", // Đỏ nhạt
        "rgba(255, 20, 147, 0.8)", // Hồng
        "rgba(173, 216, 230, 0.8)", // Xanh dương nhạt
        "rgba(255, 105, 180, 0.8)" // Hồng đậm
    ];

      var time = 1;
      var scale = 3; // Biến để kiểm soát tỷ lệ
      var scalingUp = true; // Biến để kiểm soát hướng phóng to/thu nhỏ
      var blinkInterval = 1000; // Thay đổi mỗi giây
      var blinkTime = 0; // Thời gian nháy hiện tại
      var colorIndex = 0; // Chỉ số màu hiện tại
      var maxColorIndex = colorArray.length - 1;


      var loop = function () {
        var averageFrequency = getAverageFrequency();

        // Điều chỉnh các thông số dựa trên tần số âm thanh
        config.timeDelta = 0.1 + (averageFrequency / 256) * 0.1;
        config.scaleSpeed = 0.1 + (averageFrequency / 256) * 0.01;
        config.traceK = 0.6 + (averageFrequency / 256) * 0.2;

        var newColorIndex = Math.floor((averageFrequency / 256) * colorArray.length);
    if (newColorIndex !== colorIndex) {
        colorIndex = newColorIndex;
        if (colorIndex > maxColorIndex) {
            colorIndex = maxColorIndex;
        }
    }

    var pointColor = colorArray[colorIndex];

        var currentTime = Date.now();
        var backgroundColor;
        if ((currentTime - blinkTime) % blinkInterval < blinkInterval / 2) {
          backgroundColor = "rgba(0,0,0,1)"; // Màu đen
        } else {
          backgroundColor = "rgba(256, 182, 195, 0.01)"; // Màu sáng hơn đen
        }

        var n = -Math.cos(time);
        pulse((1 + n) * 0.5, (1 + n) * 0.5);
        time += (Math.sin(time) < 0 ? 9 : n > 0.8 ? 0.2 : 1) * config.timeDelta;

        // Cập nhật tỷ lệ
        if (scalingUp) {
          scale += config.scaleSpeed;
          if (scale > 2) scalingUp = false; // Đạt đến kích thước tối đa
        } else {
          scale -= config.scaleSpeed;
          if (scale < 1) scalingUp = true; // Đạt đến kích thước tối thiểu
        }

        ctx.fillStyle = backgroundColor; // Cập nhật màu nền
        ctx.fillRect(0, 0, width, height);

        var heartOffsetY = 0; // Biến để điều chỉnh độ dịch chuyển của trái tim theo chiều dọc
        var heartVerticalLimit = height / 4; 

        function getRandomOffset(averageFrequency) {
            // Thay đổi các giá trị này để điều chỉnh độ mạnh và tốc độ của sự di chuyển
            const maxOffset = (averageFrequency / 256) * 100; // Biên độ tối đa
            const maxSpeed = (averageFrequency / 256) * 100000*60;   // Tốc độ tối đa
            return {
                offset: Math.sin(Date.now() * maxSpeed) * maxOffset,
                direction: Math.random() > 0.5 ? 1 : -1 // Ngẫu nhiên chọn hướng
            };
        }

        // Di chuyển trái tim qua lại
        var offsetData = getRandomOffset(averageFrequency);
        heartOffsetX += offsetData.offset * offsetData.direction; // Điều chỉnh trái tim di chuyển theo âm thanh

        // Cập nhật vị trí mục tiêu của trái tim
        pulse((1 + n) * .5, (1 + n) * .5);


        for (i = e.length; i--; ) {
          var u = e[i];
          var q = targetPoints[u.q];
          var dx = u.trace[0].x - q[0];
          var dy = u.trace[0].y - q[1];
          var length = Math.sqrt(dx * dx + dy * dy);
          if (10 > length) {
            if (0.95 < rand()) {
              u.q = ~~(rand() * heartPointsCount);
            } else {
              if (0.99 < rand()) {
                u.D *= -1;
              }
              u.q += u.D;
              u.q %= heartPointsCount;
              if (0 > u.q) {
                u.q += heartPointsCount;
              }
            }
          }
          u.vx += (-dx / length) * u.speed;
          u.vy += (-dy / length) * u.speed;
          u.trace[0].x += u.vx;
          u.trace[0].y += u.vy;
          u.vx *= u.force;
          u.vy *= u.force;
          for (k = 0; k < u.trace.length - 1; ) {
            var T = u.trace[k];
            var N = u.trace[++k];
            N.x -= config.traceK * (N.x - T.x);
            N.y -= config.traceK * (N.y - T.y);
          }
          ctx.fillStyle = pointColor;
          for (k = 0; k < u.trace.length; k++) {
            ctx.fillRect(u.trace[k].x, u.trace[k].y, scale, scale); // Sử dụng biến tỷ lệ
          }
        }

        window.requestAnimationFrame(loop, canvas);
      };
      loop();
    };

    window.onload = function() {
        audioElement = document.getElementById("audio");
        let btnPlay = document.querySelector("#play");
        btnPlay.onclick = () => {
            document.querySelector(".layer").style.display = "none";
            audioElement.play();
            init();
        };
    };


    // var s = document.readyState;
    // if (s === 'complete' || s === 'loaded' || s === 'interactive') init();
    // else document.addEventListener('DOMContentLoaded', init, false);