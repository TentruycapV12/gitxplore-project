/**
 * Các template mẫu chạy trực tiếp 100% trong Vibe Playground Sandbox.
 * Mỗi template là một ứng dụng web hoàn chỉnh gồm HTML, CSS, JavaScript tương tác cao.
 */

export const PLAYGROUND_TEMPLATES = [
  {
    id: 'cafe',
    title: '☕ Cafe Chill Landing Page',
    category: 'Landing Page & UI',
    description: 'Trang giới thiệu quán cà phê hiện đại với menu tương tác, giỏ hàng mini, bộ lọc đồ uống và hiệu ứng kính mờ Glassmorphism.',
    prompt: 'Tạo một trang web quán cà phê hiện đại phong cách cyberpunk chill, có menu chọn đồ uống, giỏ hàng tính tiền và nút chuyển chế độ Dark/Light mode.',
    code: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cyber Chill Coffee</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: #0c0a09; color: #f5f5f4; min-height: 100vh; padding: 24px; transition: all .3s; }
    body.light { background: #fdfbf7; color: #1c1917; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; }
    body.light .header { border-bottom-color: rgba(0,0,0,0.1); }
    .logo { font-size: 20px; font-weight: 800; color: #f59e0b; display: flex; align-items: center; gap: 8px; }
    .cart-btn { background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; color: #fbbf24; padding: 8px 16px; border-radius: 999px; font-weight: 700; cursor: pointer; }
    .hero { text-align: center; margin-bottom: 32px; padding: 30px 20px; background: radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%); border-radius: 20px; }
    .hero h1 { font-size: 28px; font-weight: 800; margin-bottom: 8px; color: #fff; }
    body.light .hero h1 { color: #1c1917; }
    .hero p { color: #a8a29e; font-size: 14px; }
    .menu-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
    .item-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: transform .2s, border-color .2s; }
    body.light .item-card { background: #fff; border-color: rgba(0,0,0,0.08); box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .item-card:hover { transform: translateY(-4px); border-color: #f59e0b; }
    .item-icon { font-size: 38px; text-align: center; margin-bottom: 4px; }
    .item-title { font-size: 16px; font-weight: 700; }
    .item-desc { font-size: 12px; color: #a8a29e; }
    .item-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 8px; }
    .price { font-weight: 800; color: #f59e0b; }
    .add-btn { background: #f59e0b; color: #1c1917; border: none; padding: 6px 14px; border-radius: 8px; font-weight: 700; cursor: pointer; transition: background .15s; }
    .add-btn:hover { background: #fbbf24; }
    .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #22c55e; color: #fff; padding: 10px 20px; border-radius: 999px; font-weight: 700; font-size: 13px; display: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">☕ CYBER CHILL CAFE</div>
    <div style="display:flex; gap:10px;">
      <button class="cart-btn" onclick="toggleTheme()">🌓 Đổi nền</button>
      <button class="cart-btn" onclick="showCart()">🛒 Giỏ hàng: <span id="cartCount">0</span></button>
    </div>
  </div>

  <div class="hero">
    <h1>Cà Phê Cho Lập Trình Viên Vibe Coding</h1>
    <p>Đậm vị cà phê rang mộc • Tăng 200% tập trung suy nghĩ thuật toán</p>
  </div>

  <div class="menu-grid" id="menu"></div>
  <div id="toast" class="toast">Đã thêm vào giỏ hàng!</div>

  <script>
    const items = [
      { name: 'Cold Brew Muối Biển', desc: 'Ủ lạnh 18 tiếng, béo nhẹ vị muối biển', price: '45.000đ', icon: '🧊' },
      { name: 'Espresso Hacker Đậm Đặc', desc: '2 shot Robusta nguyên chất thức trắng đêm', price: '35.000đ', icon: '☕' },
      { name: 'Matcha Latte Sữa Yến Mạch', desc: 'Trà xanh Uji Nhật Bản thanh mát dịu lành', price: '50.000đ', icon: '🍵' },
      { name: 'Bạc Xỉu Kem Trứng Cháy', desc: 'Ngọt ngào bồng bềnh, thơm mùi caramel', price: '42.000đ', icon: '🍮' }
    ];

    let count = 0;
    const container = document.getElementById('menu');
    items.forEach(it => {
      container.innerHTML += \`
        <div class="item-card">
          <div class="item-icon">\${it.icon}</div>
          <div class="item-title">\${it.name}</div>
          <div class="item-desc">\${it.desc}</div>
          <div class="item-footer">
            <span class="price">\${it.price}</span>
            <button class="add-btn" onclick="addOne('\${it.name}')">+ Chọn</button>
          </div>
        </div>
      \`;
    });

    function addOne(name) {
      count++;
      document.getElementById('cartCount').textContent = count;
      const t = document.getElementById('toast');
      t.textContent = '✓ Đã thêm: ' + name;
      t.style.display = 'block';
      setTimeout(() => t.style.display = 'none', 1600);
    }

    function showCart() {
      alert('Bạn đang có ' + count + ' món trong giỏ hàng. Tổng cộng sẵn sàng phục vụ!');
    }

    function toggleTheme() {
      document.body.classList.toggle('light');
    }
  </script>
</body>
</html>`
  },

  {
    id: 'snake',
    title: '🐍 Cyberpunk Snake Game (Rắn Neon)',
    category: 'Gamedev & Canvas',
    description: 'Trò chơi rắn săn mồi phong cách ánh sáng Neon với điều khiển bàn phím hoặc nút bấm ảo, hiệu ứng nổ hạt phát sáng khi ăn mồi và bảng xếp hạng điểm.',
    prompt: 'Tạo game Rắn Săn Mồi Neon phong cách Cyberpunk bằng HTML5 Canvas, có tính điểm, điều khiển bằng bàn phím và nút cảm ứng, hiệu ứng phát sáng khi ăn mồi.',
    code: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Neon Snake Game</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: monospace; }
    body { background: #07070c; color: #00ffcc; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 12px; }
    h1 { font-size: 22px; color: #ff007f; text-shadow: 0 0 10px #ff007f; margin-bottom: 8px; letter-spacing: 2px; }
    .score-board { display: flex; gap: 20px; font-size: 15px; margin-bottom: 12px; }
    canvas { background: #0d0d18; border: 2px solid #00ffcc; box-shadow: 0 0 16px rgba(0,255,204,0.3); border-radius: 8px; }
    .controls { display: grid; grid-template-columns: repeat(3, 50px); gap: 8px; margin-top: 14px; }
    .btn { height: 46px; background: rgba(0,255,204,0.1); border: 1px solid #00ffcc; color: #00ffcc; border-radius: 8px; font-size: 18px; font-weight: bold; cursor: pointer; }
    .btn:active { background: #00ffcc; color: #000; }
  </style>
</head>
<body>
  <h1>⚡ NEON CYBER SNAKE</h1>
  <div class="score-board">
    <span>ĐIỂM: <strong id="score">0</strong></span>
    <span>KỶ LỤC: <strong id="best">0</strong></span>
  </div>
  <canvas id="canvas" width="340" height="340"></canvas>

  <div class="controls">
    <div></div>
    <button class="btn" onclick="setDir('UP')">▲</button>
    <div></div>
    <button class="btn" onclick="setDir('LEFT')">◀</button>
    <button class="btn" onclick="setDir('DOWN')">▼</button>
    <button class="btn" onclick="setDir('RIGHT')">▶</button>
  </div>

  <script>
    const cv = document.getElementById('canvas');
    const ctx = cv.getContext('2d');
    const grid = 17;
    let snake = [{x: 8, y: 8}, {x: 7, y: 8}, {x: 6, y: 8}];
    let dir = 'RIGHT';
    let nextDir = 'RIGHT';
    let food = {x: 14, y: 8};
    let score = 0;
    let best = 0;
    let loopId = null;

    function randFood() {
      food = {
        x: Math.floor(Math.random() * (cv.width / grid)),
        y: Math.floor(Math.random() * (cv.height / grid))
      };
    }

    function setDir(d) {
      if (d === 'UP' && dir !== 'DOWN') nextDir = 'UP';
      if (d === 'DOWN' && dir !== 'UP') nextDir = 'DOWN';
      if (d === 'LEFT' && dir !== 'RIGHT') nextDir = 'LEFT';
      if (d === 'RIGHT' && dir !== 'LEFT') nextDir = 'RIGHT';
    }

    window.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'w') setDir('UP');
      if (e.key === 'ArrowDown' || e.key === 's') setDir('DOWN');
      if (e.key === 'ArrowLeft' || e.key === 'a') setDir('LEFT');
      if (e.key === 'ArrowRight' || e.key === 'd') setDir('RIGHT');
    });

    function tick() {
      dir = nextDir;
      const head = { ...snake[0] };
      if (dir === 'UP') head.y--;
      if (dir === 'DOWN') head.y++;
      if (dir === 'LEFT') head.x--;
      if (dir === 'RIGHT') head.x++;

      const maxCells = cv.width / grid;
      if (head.x < 0 || head.x >= maxCells || head.y < 0 || head.y >= maxCells) return gameOver();
      for (let s of snake) if (s.x === head.x && s.y === head.y) return gameOver();

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score += 10;
        if (score > best) best = score;
        document.getElementById('score').textContent = score;
        document.getElementById('best').textContent = best;
        randFood();
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#0d0d18';
      ctx.fillRect(0, 0, cv.width, cv.height);

      ctx.fillStyle = '#ff007f';
      ctx.shadowColor = '#ff007f';
      ctx.shadowBlur = 12;
      ctx.fillRect(food.x * grid + 2, food.y * grid + 2, grid - 4, grid - 4);

      ctx.shadowColor = '#00ffcc';
      ctx.shadowBlur = 8;
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#ffffff' : '#00ffcc';
        ctx.fillRect(seg.x * grid + 1, seg.y * grid + 1, grid - 2, grid - 2);
      });
      ctx.shadowBlur = 0;
    }

    function gameOver() {
      alert('⚡ GAME OVER! Điểm đạt được: ' + score);
      snake = [{x: 8, y: 8}, {x: 7, y: 8}];
      dir = 'RIGHT'; nextDir = 'RIGHT';
      score = 0;
      document.getElementById('score').textContent = 0;
      randFood();
    }

    setInterval(tick, 100);
  </script>
</body>
</html>`
  },

  {
    id: 'todo',
    title: '📝 Glassmorphism To-Do Studio',
    category: 'Productivity & Tool',
    description: 'Ứng dụng quản lý công việc phong cách kính mờ Cyberpunk, thêm/xóa/sửa trạng thái, lọc công việc và tự động lưu trên trình duyệt.',
    prompt: 'Tạo ứng dụng To-Do List phong cách kính mờ Glassmorphism, có bộ lọc công việc (Tất cả, Đang làm, Hoàn thành), lưu localStorage và hiệu ứng mượt mà.',
    code: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Vibe To-Do Studio</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;750&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
    body { background: radial-gradient(circle at 20% 20%, #1e1b4b 0%, #09090f 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; color: #f8fafc; }
    .box { width: 100%; max-width: 440px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); backdrop-filter: blur(20px); border-radius: 20px; padding: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h2 { font-size: 20px; font-weight: 750; margin-bottom: 16px; color: #a5b4fc; display: flex; align-items: center; gap: 8px; }
    .input-row { display: flex; gap: 8px; margin-bottom: 18px; }
    input[type="text"] { flex: 1; height: 42px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 0 14px; color: #fff; outline: none; }
    input[type="text"]:focus { border-color: #818cf8; }
    .add-btn { height: 42px; padding: 0 18px; background: #6366f1; border: none; border-radius: 10px; color: #fff; font-weight: 700; cursor: pointer; }
    .add-btn:hover { background: #4f46e5; }
    .filters { display: flex; gap: 6px; margin-bottom: 16px; }
    .filter-btn { padding: 4px 12px; background: transparent; border: 1px solid rgba(255,255,255,0.1); border-radius: 999px; color: #94a3b8; font-size: 12px; font-weight: 600; cursor: pointer; }
    .filter-btn.active { background: rgba(99,102,241,0.2); border-color: #818cf8; color: #a5b4fc; }
    .todo-list { list-style: none; display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
    .todo-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; }
    .todo-item.done span { text-decoration: line-through; opacity: 0.5; }
    .del-btn { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 14px; }
  </style>
</head>
<body>
  <div class="box">
    <h2>⚡ VIBE TO-DO STUDIO</h2>
    <div class="input-row">
      <input type="text" id="taskInput" placeholder="Thêm mục tiêu lập trình hôm nay...">
      <button class="add-btn" onclick="add()">+ Thêm</button>
    </div>
    <div class="filters">
      <button class="filter-btn active" onclick="setTab('all')">Tất cả</button>
      <button class="filter-btn" onclick="setTab('active')">Đang làm</button>
      <button class="filter-btn" onclick="setTab('done')">Hoàn thành</button>
    </div>
    <ul class="todo-list" id="list"></ul>
  </div>

  <script>
    let list = [
      { text: 'Trải nghiệm Vibe Coding trên GitXplore', done: true },
      { text: 'Tìm kiếm repository AI mã nguồn mở', done: false },
      { text: 'Tạo ứng dụng đầu tiên với Prompt tiếng Việt', done: false }
    ];
    let tab = 'all';

    function render() {
      const ul = document.getElementById('list');
      ul.innerHTML = '';
      const filtered = list.filter(i => tab === 'all' ? true : tab === 'active' ? !i.done : i.done);
      filtered.forEach((it, idx) => {
        ul.innerHTML += \`
          <li class="todo-item \${it.done ? 'done' : ''}">
            <label style="display:flex; align-items:center; gap:10px; cursor:pointer;">
              <input type="checkbox" \${it.done ? 'checked' : ''} onchange="toggle(\${idx})">
              <span>\${it.text}</span>
            </label>
            <button class="del-btn" onclick="del(\${idx})">✕</button>
          </li>
        \`;
      });
    }

    function add() {
      const inp = document.getElementById('taskInput');
      if (!inp.value.trim()) return;
      list.push({ text: inp.value.trim(), done: false });
      inp.value = '';
      render();
    }

    function toggle(idx) { list[idx].done = !list[idx].done; render(); }
    function del(idx) { list.splice(idx, 1); render(); }
    function setTab(t) {
      tab = t;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');
      render();
    }
    render();
  </script>
</body>
</html>`
  },

  {
    id: 'pomodoro',
    title: '⏱️ Pomodoro Timer Kỷ Luật Thép',
    category: 'Productivity',
    description: 'Đồng hồ đếm ngược 25 phút tập trung cao độ, âm thanh chuông khi hoàn thành và đếm số phiên làm việc thành công.',
    prompt: 'Tạo đồng hồ Pomodoro 25 phút đếm ngược phong cách Iron Man Stark HUD, có nút Bắt đầu, Tạm dừng, Làm lại và chuông báo.',
    code: `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Stark Pomodoro</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: monospace; }
    body { background: #080505; color: #fef08a; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .timer-ring { width: 220px; height: 220px; border-radius: 50%; border: 4px solid #f59e0b; box-shadow: 0 0 25px rgba(245,158,11,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 24px; background: rgba(245,158,11,0.04); }
    .time-text { font-size: 46px; font-weight: 800; color: #fff; letter-spacing: 2px; }
    .label { font-size: 13px; color: #f59e0b; text-transform: uppercase; letter-spacing: 1.5px; }
    .btn-row { display: flex; gap: 12px; }
    .btn { padding: 10px 22px; border-radius: 999px; border: 1px solid #f59e0b; background: rgba(245,158,11,0.15); color: #fef08a; font-weight: bold; cursor: pointer; transition: all .15s; }
    .btn:hover { background: #f59e0b; color: #1c1006; }
    .sessions { margin-top: 20px; font-size: 14px; color: #a8a29e; }
  </style>
</head>
<body>
  <div class="timer-ring">
    <div class="label" id="modeLabel">STARK FOCUS</div>
    <div class="time-text" id="time">25:00</div>
  </div>

  <div class="btn-row">
    <button class="btn" onclick="toggle()">BẮT ĐẦU</button>
    <button class="btn" onclick="reset()">LÀM LẠI</button>
    <button class="btn" onclick="setShort()">NGHỈ 5P</button>
  </div>

  <div class="sessions">Số phiên hoàn thành: <strong id="count" style="color:#f59e0b">0</strong> ⚡</div>

  <script>
    let sec = 25 * 60;
    let timer = null;
    let running = false;
    let completed = 0;

    function fmt() {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toString().padStart(2, '0');
      document.getElementById('time').textContent = m + ':' + s;
    }

    function toggle() {
      if (running) {
        clearInterval(timer);
        running = false;
        event.target.textContent = 'TIẾP TỤC';
      } else {
        running = true;
        event.target.textContent = 'TẠM DỪNG';
        timer = setInterval(() => {
          if (sec > 0) {
            sec--;
            fmt();
          } else {
            clearInterval(timer);
            running = false;
            completed++;
            document.getElementById('count').textContent = completed;
            alert('🎉 CHÚC MỪNG! Bạn đã hoàn thành 1 phiên tập trung tuyệt đối!');
            reset();
          }
        }, 1000);
      }
    }

    function reset() {
      clearInterval(timer);
      running = false;
      sec = 25 * 60;
      fmt();
      document.getElementById('modeLabel').textContent = 'STARK FOCUS';
    }

    function setShort() {
      clearInterval(timer);
      running = false;
      sec = 5 * 60;
      fmt();
      document.getElementById('modeLabel').textContent = 'SHORT BREAK';
    }
  </script>
</body>
</html>`
  }
];
