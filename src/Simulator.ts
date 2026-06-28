// 1. シミュレーターの状態を表す型定義
export interface SimulatorState {
    isLaunching: boolean;  // 射出中かどうか
    distance: number;       // 進んだ距離 (m)
    groundSpeed: number;    // 対地速度 (km/h)
    airSpeed: number;       // 対気速度 (km/h) = 対地速度 + 向かい風
    isFinished: boolean;    // デッキの端に達したか
    isSuccess: boolean;     // 発艦成功したか
  }
  
  // 2. カタパルトシミュレーターのメインクラス
  export class CatapultSimulator {
    // 定数
    private readonly DECK_LENGTH = 90;       // カタパルトの長さ (m)
    private readonly REQUIRED_SPEED = 260;   // 必要な離陸対気速度 (km/h)
  
    // 入力パラメーター（外部から設定可能）
    public mass: number;          // 機体重量 (kg)
    public force: number;         // カタパルトの牽引力 (N)
    public headwind: number;      // 向かい風 (km/h)
  
    // 内部の物理状態（単位はすべてMKS単位系：m, kg, s, m/s）
    private positionX = 0;        // 現在位置 (m)
    private velocityX = 0;        // 現在の速度 (m/s)
    private isLaunching = false;
    private isFinished = false;
    private isSuccess = false;
  
    constructor(mass = 20000, force = 600000, headwind = 40) {
      this.mass = mass;
      this.force = force;
      this.headwind = headwind;
    }
  
    /**
     * シミュレーションの初期化（リセット）
     */
    public reset(): void {
      this.positionX = 0;
      this.velocityX = 0;
      this.isLaunching = false;
      this.isFinished = false;
      this.isSuccess = false;
    }
  
    /**
     * カタパルト射出を開始する
     */
    public startLaunch(): void {
      this.reset();
      this.isLaunching = true;
    }
  
    /**
     * 1フレームごとに物理状態を更新する (メインロジック)
     * @param deltaTime 前回からの経過時間 (秒) 例: 60fpsなら 1/60
     */
    public update(deltaTime: number): SimulatorState {
      if (!this.isLaunching || this.isFinished) {
        return this.getCurrentState();
      }
  
      // 1. 加速度の計算: a = F / m (m/s^2)
      const acceleration = this.force / this.mass;
  
      // 2. 速度の更新: v = v + a * dt (m/s)
      this.velocityX += acceleration * deltaTime;
  
      // 3. 位置の更新: x = x + v * dt (m)
      this.positionX += this.velocityX * deltaTime;
  
      // 4. カタパルトの終端（デッキの端）に達したかの判定
      if (this.positionX >= this.DECK_LENGTH) {
        this.positionX = this.DECK_LENGTH; // 位置を固定
        this.isFinished = true;
        this.isLaunching = false;
  
        // 最終的な対気速度（離陸判定）をチェック
        const finalAirSpeed = this.getAirSpeedKmH();
        this.isSuccess = finalAirSpeed >= this.REQUIRED_SPEED;
      }
  
      return this.getCurrentState();
    }
  
    /**
     * 現在のシミュレーターのステータスを取得（UI描画用）
     */
    public getCurrentState(): SimulatorState {
      return {
        isLaunching: this.isLaunching,
        distance: this.positionX,
        groundSpeed: this.toKmH(this.velocityX),
        airSpeed: this.getAirSpeedKmH(),
        isFinished: this.isFinished,
        isSuccess: this.isSuccess,
      };
    }
  
    // --- ヘルパーメソッド ---
  
    // m/s から km/h への変換
    private toKmH(mps: number): number {
      return mps * 3.6;
    }
  
    // 現在の対気速度(km/h)を計算する
    private getAirSpeedKmH(): number {
      const groundSpeedKmH = this.toKmH(this.velocityX);
      return groundSpeedKmH + this.headwind;
    }
  }
 