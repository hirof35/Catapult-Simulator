// simulator.tsからクラスを読み込む（NodeNext形式のため拡張子.jsを指定）
import { CatapultSimulator } from './Simulator.js';

const simulator = new CatapultSimulator(
  22000,   // 重量 22,000 kg
  650000,  // 出力 650,000 N
  35       // 向かい風 35 km/h
);

console.log("🚀 カタパルト射出開始！");
simulator.startLaunch();

// 1秒間に60回（60fps）のペースでシミュレーションを進めるタイマー
const fps = 60;
const deltaTime = 1 / fps;

const interval = setInterval(() => {
  const state = simulator.update(deltaTime);

  // 途中のステータスをコンソールに表示
  console.log(
    `距離: ${state.distance.toFixed(1)}m | ` +
    `対地速度: ${state.groundSpeed.toFixed(0)}km/h | ` +
    `対気速度: ${state.airSpeed.toFixed(0)}km/h`
  );

  // デッキの端に達したらタイマーを止めて結果を表示
  if (state.isFinished) {
    clearInterval(interval);
    console.log("\n---------------------------------");
    if (state.isSuccess) {
      console.log("✈️ 発艦成功！ 安全に大空へ舞い上がりました。");
    } else {
      console.log("💥 発艦失敗！ 速度が足りず海へ落下しました。");
    }
    console.log("---------------------------------");
  }
}, 1000 / fps);