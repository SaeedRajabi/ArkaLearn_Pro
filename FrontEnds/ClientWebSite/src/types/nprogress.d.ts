declare module 'nprogress' {
  interface NProgressOptions {
    minimum?: number;
    easing?: string;
    speed?: number;
    trickle?: boolean;
    trickleSpeed?: number;
  }

  interface NProgress {
    configure(options: NProgressOptions): void;
    start(): void;
    done(force?: boolean): void;
    set(n: number): void;
    isStarted(): boolean;
  }

  const nprogress: NProgress;
  export default nprogress;
}
