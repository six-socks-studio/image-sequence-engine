import { ImageSequenceOptions, LoadingProgress } from "./types";

class ImageSequenceEngine {
  private options: Required<ImageSequenceOptions>;
  private totalFrames: number;
  private images: Map<string, HTMLImageElement>;
  private loadingPromises: Map<string, Promise<HTMLImageElement>>;
  private currentFrame: number;
  private isScrollLocked: boolean;
  private progress: number;
  private lenis: any | null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private readonly boundOnScroll: (e: Event) => void;
  private readonly boundRaf: (time: number) => void;

  constructor(options: Partial<ImageSequenceOptions> = {}) {
    this.options = {
      container: null,
      wrapper: null,
      imageUrls: [],
      lenis: null,
      LenisClass: null,
      createLenis: false,
      lenisOptions: {},
      ...options,
    } as Required<ImageSequenceOptions>;

    this.totalFrames = this.options.imageUrls.length;
    this.images = new Map();
    this.loadingPromises = new Map();
    this.currentFrame = 0;
    this.isScrollLocked = true;
    this.progress = 0;
    this.lenis = null;
    this.boundOnScroll = this.onScroll.bind(this);
    this.boundRaf = this.raf.bind(this);

    this.init();
  }

  private initLenis(): void {
    if (this.options.lenis) {
      this.lenis = this.options.lenis;
      this.lenis.on("scroll", this.boundOnScroll);
    } else if (this.options.createLenis && this.options.LenisClass) {
      try {
        this.lenis = new this.options.LenisClass({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          ...this.options.lenisOptions,
        });

        this.lenis.on("scroll", this.boundOnScroll);
        requestAnimationFrame(this.boundRaf);
      } catch (error) {
        console.warn("Failed to initialize Lenis:", error);
        window.addEventListener("scroll", this.boundOnScroll);
      }
    } else {
      window.addEventListener("scroll", this.boundOnScroll);
    }
  }

  private init(): void {
    if (!this.options.container || !this.options.imageUrls.length) {
      throw new Error("Container and imageUrls are required");
    }

    if (!(this.options.container instanceof HTMLElement)) {
      throw new Error("Container must be an instance of HTMLElement");
    }

    this.canvas = document.createElement("canvas");
    if (!(this.canvas instanceof HTMLCanvasElement)) {
      throw new Error("Failed to create HTMLCanvasElement");
    }

    this.ctx = this.canvas.getContext("2d")!;
    if (!this.ctx) {
      throw new Error("Failed to get 2D context");
    }

    this.options.container.appendChild(this.canvas);

    this.setupCanvas();

    try {
      this.initLenis();
    } catch (error) {
      console.warn("Failed to initialize Lenis:", error);
      window.addEventListener("scroll", this.boundOnScroll);
    }

    this.startInitialLoading();
  }

  private raf(time: number): void {
    if (this.lenis) {
      this.lenis.raf(time);
      requestAnimationFrame(this.boundRaf);
    }
  }

  private onScroll(e: Event): void {
    if (this.isScrollLocked) return;

    const wrapper = this.options.wrapper;
    const wrapperRect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const totalScrollDistance = wrapper.offsetHeight - viewportHeight;
    const scrolled = -wrapperRect.top;

    this.progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));
    this.render();
  }

  private unlockScroll(): void {
    this.isScrollLocked = false;
    this.emit("readyToScroll");
  }

  public destroy(): void {
    if (this.lenis && this.options.createLenis) {
      this.lenis.destroy();
      this.lenis = null;
    } else if (!this.lenis) {
      window.removeEventListener("scroll", this.boundOnScroll);
    } else {
      this.lenis.off("scroll", this.boundOnScroll);
    }

    this.canvas.remove();
    this.images.clear();
    this.loadingPromises.clear();
  }

  private setupCanvas(): void {
    const updateSize = () => {
      const rect = this.options.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;

      this.ctx.scale(dpr, dpr);
      this.render();
    };

    updateSize();
    window.addEventListener("resize", updateSize);
  }

  private calculateProgress(): void {
    const wrapper = this.options.wrapper;
    const wrapperRect = wrapper.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    const totalScrollDistance = wrapper.offsetHeight - viewportHeight;
    const scrolled = -wrapperRect.top;

    this.progress = Math.max(0, Math.min(1, scrolled / totalScrollDistance));

    this.render();
  }

  private async startInitialLoading(): Promise<void> {
    await this.loadImage(this.options.imageUrls[0]);
    this.render();

    const initialFrames = Array.from(
      { length: Math.floor(this.totalFrames / 8) },
      (_, i) => (i + 1) * 8
    );

    await this.loadFrames(initialFrames);

    this.unlockScroll();
    this.startSecondaryLoading();
  }

  private async startSecondaryLoading(): Promise<void> {
    const secondaryFrames = Array.from(
      { length: Math.floor(this.totalFrames / 4) },
      (_, i) => (i + 1) * 4
    ).filter((frame) => !this.images.has(this.options.imageUrls[frame]));

    await this.loadFrames(secondaryFrames);

    const remainingFrames = Array.from(
      { length: this.totalFrames },
      (_, i) => i
    ).filter((frame) => !this.images.has(this.options.imageUrls[frame]));

    await this.loadFrames(remainingFrames);

    this.emit("loadingComplete");
  }

  private async loadFrames(frameIndices: number[]): Promise<void> {
    const promises = frameIndices.map((index) => {
      const url = this.options.imageUrls[index];
      return url ? this.loadImage(url) : Promise.resolve(null);
    });

    await Promise.all(promises);
    this.emit("batchLoaded", {
      loaded: this.images.size,
      total: this.totalFrames,
    });
  }

  private loadImage(url: string): Promise<HTMLImageElement> {
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    if (this.images.has(url)) {
      return Promise.resolve(this.images.get(url)!);
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(url, img);
        this.loadingPromises.delete(url);
        this.emit("imageLoaded", {
          url,
          loaded: this.images.size,
          total: this.totalFrames,
        });
        resolve(img);
        this.render();
      };
      img.onerror = () => {
        this.loadingPromises.delete(url);
        reject(new Error(`Failed to load image: ${url}`));
      };
      img.src = url;
    });

    this.loadingPromises.set(url, promise);
    return promise;
  }

  private render(): void {
    if (this.isScrollLocked && this.currentFrame === 0) {
      const firstImage = this.images.get(this.options.imageUrls[0]);
      if (firstImage) {
        this.drawImage(firstImage);
      }
      return;
    }

    const frameIndex = Math.floor(this.progress * (this.totalFrames - 1));
    const imageUrl = this.options.imageUrls[frameIndex];

    // console.log(`
    //     Progress: ${this.progress.toFixed(3)}
    //     Requesting frame: ${frameIndex}
    //     URL: ${imageUrl}
    // `);

    const nearestImage = this.findNearestLoadedImage(frameIndex);

    if (nearestImage && frameIndex !== this.currentFrame) {
      this.currentFrame = frameIndex;

      const actualFrameIndex = this.options.imageUrls.indexOf(
        Array.from(this.images.entries()).find(
          ([_, img]) => img === nearestImage
        )![0]
      );

      // console.log(`
      //       Actually showing frame: ${actualFrameIndex}
      //       Frame difference: ${Math.abs(frameIndex - actualFrameIndex)}
      //       Total loaded frames: ${this.images.size}/${this.totalFrames}
      //   `);

      this.drawImage(nearestImage);
    }
  }

  private findNearestLoadedImage(targetIndex: number): HTMLImageElement | null {
    const exactUrl = this.options.imageUrls[targetIndex];
    if (this.images.has(exactUrl)) {
      return this.images.get(exactUrl)!;
    }

    let nearestDistance = Infinity;
    let nearestImage: HTMLImageElement | null = null;
    let nearestIndex: number | null = null;

    this.images.forEach((img, url) => {
      const index = this.options.imageUrls.indexOf(url);
      const distance = Math.abs(index - targetIndex);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestImage = img;
        nearestIndex = index;
      }
    });

    console.log(`
        Couldn't find exact frame ${targetIndex}
        Using nearest frame: ${nearestIndex}
        Distance: ${Math.abs(targetIndex - (nearestIndex ?? targetIndex))}
    `);

    return nearestImage;
  }

  private drawImage(image: HTMLImageElement): void {
    const canvas = this.canvas;
    const ctx = this.ctx;
    const containerRect = this.options.container.getBoundingClientRect();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const containerRatio = containerRect.width / containerRect.height;
    const imageRatio = image.width / image.height;

    let drawWidth = containerRect.width;
    let drawHeight = containerRect.height;

    if (containerRatio > imageRatio) {
      drawHeight = drawWidth / imageRatio;
    } else {
      drawWidth = drawHeight * imageRatio;
    }

    const x = (containerRect.width - drawWidth) / 2;
    const y = (containerRect.height - drawHeight) / 2;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }

  private emit(event: string, data?: unknown): void {
    const eventName = `imageSequence:${event}`;
    const customEvent = new CustomEvent(eventName, { detail: data });
    this.options.container.dispatchEvent(customEvent);
  }

  public getLoadingProgress(): LoadingProgress {
    return {
      loaded: this.images.size,
      total: this.totalFrames,
      percentage: (this.images.size / this.totalFrames) * 100,
    };
  }
}

export default ImageSequenceEngine;
export { ImageSequenceEngine, type ImageSequenceOptions, type LoadingProgress };
