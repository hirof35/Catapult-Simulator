import { CatapultSimulator } from './Simulator.js';

// 1. インスタンス生成
const simulator = new CatapultSimulator();

// 2. HTML要素の取得
const canvas = document.getElementById('simCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const launchBtn = document.getElementById('launchBtn') as HTMLButtonElement;
const resultDiv = document.getElementById('result') as HTMLDivElement;

const inputs = {
  mass: document.getElementById('mass') as HTMLInputElement,
  force: document.getElementById('force') as HTMLInputElement,
  headwind: document.getElementById('headwind') as HTMLInputElement,
};
const views = {
  mass: document.getElementById('massVal') as HTMLSpanElement,
  force: document.getElementById('forceVal') as HTMLSpanElement,
  headwind: document.getElementById('headwindVal') as HTMLSpanElement,
};

// 3. スライダーの値をシミュレーターに同期させる処理
function updateParams() {
  simulator.mass = parseFloat(inputs.mass.value);
  simulator.force = parseFloat(inputs.force.value);
  simulator.headwind = parseFloat(inputs.headwind.value);

  views.mass.innerText = inputs.mass.value;
  views.force.innerText = inputs.force.value;
  views.headwind.innerText = inputs.headwind.value;
}

// スライダー変更時にリアルタイムで数値を更新
Object.values(inputs).forEach(input => input.addEventListener('input', updateParams));
updateParams();

// 4. 描画ロジック (Canvas)
function draw(state = simulator.getCurrentState()) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 空と海の背景
  ctx.fillStyle = '#112'; // 夜空っぽく
  ctx.fillRect(0, 0, canvas.width, 180);
  ctx.fillStyle = '#1d3557'; // 海面
  ctx.fillRect(0, 180, canvas.width, 120);

  // 甲板（デッキ）の描画
  // シミュレーター上の90mを、画面上の600ピクセル(px)にマッピングします（1m = 6.66px）
  const startX = 50; 
  const meterToPx = 600 / 90; 
  const deckY = 180;

  ctx.fillStyle = '#4a4e69'; // 甲板の色
  ctx.fillRect(startX, deckY, 600, 15);
  
  // カタパルトのレール線
  ctx.strokeStyle = '#f2e9e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(startX, deckY);
  ctx.lineTo(startX + 600, deckY);
  ctx.stroke();

  // 戦闘機の位置計算
  let jetX = startX + state.distance * meterToPx;
  let jetY = deckY - 15; // 甲板の少し上

  // 発艦完了後のアニメーション（成功なら上昇、失敗なら落下）
  if (state.isFinished) {
    // 終了後の時間経過を擬似的に表現
    const overflow = state.distance === 90 ? 0 : 1; 
    if (state.isSuccess) {
      jetX += 50; // 前進
      jetY -= 40; // 上昇
    } else {
      jetX += 30; // 惰性で前進
      jetY += 50; // 海へドボン
    }
  }

  // 戦藤機をシンプルな三角形で描画
  ctx.fillStyle = state.isFinished && !state.isSuccess ? '#e63946' : '#a8dadc';
  ctx.beginPath();
  ctx.moveTo(jetX, jetY);          // 機首
  ctx.lineTo(jetX - 25, jetY - 10); // 尾翼上部
  ctx.lineTo(jetX - 20, jetY + 5);  // 機体下部
  ctx.closePath();
  ctx.fill();

  // メーター・情報のテキスト表示
  ctx.fillStyle = '#fff';
  ctx.font = '16px monospace';
  ctx.fillText(`進捗距離: ${state.distance.toFixed(1)} m / 90 m`, 20, 30);
  ctx.fillText(`対地速度: ${state.groundSpeed.toFixed(0)} km/h`, 20, 55);
  ctx.fillText(`対気速度: ${state.airSpeed.toFixed(0)} km/h (目標: 260)`, 20, 80);
}

// 5. アニメーションループの制御
let lastTime = 0;
function loop(timestamp: number) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000; // ミリ秒から秒に変換
  lastTime = timestamp;

  // 物理状態を1ステップ進める
  // 意図しない大きなガタツキを防ぐため、dtの上限を0.1秒に制限
  const state = simulator.update(Math.min(dt, 0.1));
  
  // 画面を描画
  draw(state);

  if (!state.isFinished && state.isLaunching) {
    requestAnimationFrame(loop);
  } else if (state.isFinished) {
    // 結果のテキスト表示
    if (state.isSuccess) {
      resultDiv.innerHTML = '<span style="color: #4cd137;">✈️ LAUNCH SUCCESS (発艦成功)</span>';
    } else {
      resultDiv.innerHTML = '<span style="color: #e84118;">💥 CRASH (速度不足・海面落下)</span>';
    }
    launchBtn.disabled = false;
  }
}

// 6. ローンチボタンのクリックイベント
launchBtn.addEventListener('click', () => {
  launchBtn.disabled = true;
  resultDiv.innerText = '';
  lastTime = 0;
  
  updateParams(); // 最新のスライダー値をセット
  simulator.startLaunch();
  
  requestAnimationFrame(loop);
});

// 初回起動時の初期描画
draw();