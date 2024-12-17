class ImageSequenceEngine {
  constructor(options = {}) {
    this.options = {
      container: null,
      imageUrls: [],
      initialLoadComplete: false,
      onError: error => console.error(error),
      ...options
    };
    if (!this.options.container) {
      throw new Error('Container element is required');
    }
    if (!Array.isArray(this.options.imageUrls) || this.options.imageUrls.length === 0) {
      throw new Error('Image URLs array is required and must not be empty');
    }
    this.totalFrames = this.options.imageUrls.length;
    this.images = new Map();
    this.loadingPromises = new Map();
    this.currentFrame = 0;
    this.isScrollLocked = true;
    this.progress = 0;
    this.init();
  }
  init() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.options.container.appendChild(this.canvas);
    this.setupCanvas();
    this.startInitialLoading();
  }
  setupCanvas() {
    const updateSize = () => {
      const rect = this.options.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
  }
  async startInitialLoading() {
    try {
      // Carica sempre il primo frame
      await this.loadImage(this.options.imageUrls[0]);

      // Carica 1 frame ogni 8 (8, 16, 24, ...)
      const initialFrames = [0].concat(Array.from({
        length: Math.floor(this.totalFrames / 8)
      }, (_, i) => (i + 1) * 8));
      await this.loadFrames(initialFrames);
      this.unlockScroll();
      this.startSecondaryLoading();
    } catch (error) {
      this.options.onError(error);
    }
  }
  loadImage(url) {
    if (!url) {
      return Promise.reject(new Error('Invalid image URL'));
    }
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }
    if (this.images.has(url)) {
      return Promise.resolve(this.images.get(url));
    }
    const promise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images.set(url, img);
        this.loadingPromises.delete(url);
        this.emit('imageLoaded', {
          url,
          loaded: this.images.size,
          total: this.totalFrames
        });
        resolve(img);
      };
      img.onerror = () => {
        this.loadingPromises.delete(url);
        const error = new Error(`Failed to load image: ${url}`);
        this.options.onError(error);
        reject(error);
      };
      img.src = url;
    });
    this.loadingPromises.set(url, promise);
    return promise;
  }
  setupCanvas() {
    const updateSize = () => {
      const rect = this.options.container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.canvas.style.width = `${rect.width}px`;
      this.canvas.style.height = `${rect.height}px`;
      this.ctx.scale(dpr, dpr);
    };
    updateSize();
    window.addEventListener('resize', updateSize);
  }
  async startSecondaryLoading() {
    // Carica i frame intermedi (4, 12, 20, ...)
    const secondaryFrames = Array.from({
      length: Math.floor(this.totalFrames / 4)
    }, (_, i) => (i + 1) * 4).filter(frame => !this.images.has(this.options.imageUrls[frame]));

    // Avvia il caricamento dei frame secondari
    this.loadFrames(secondaryFrames).then(() => {
      // Dopo i frame secondari, carica tutti i rimanenti in sequenza
      const remainingFrames = Array.from({
        length: this.totalFrames
      }, (_, i) => i).filter(frame => !this.images.has(this.options.imageUrls[frame]));
      this.loadFrames(remainingFrames);
    });
  }
  unlockScroll() {
    this.isScrollLocked = false;
    this.setupScrollListener();
    this.emit('readyToScroll');
  }
  setupScrollListener() {
    const calculateProgress = () => {
      const rect = this.options.container.getBoundingClientRect();
      const scrollHeight = this.options.container.scrollHeight - window.innerHeight;
      const scrollDistance = window.scrollY - rect.top;
      this.progress = Math.max(0, Math.min(1, scrollDistance / scrollHeight));
      this.render();
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          window.addEventListener('scroll', calculateProgress);
        } else {
          window.removeEventListener('scroll', calculateProgress);
        }
      });
    });
    observer.observe(this.options.container);
  }
  async loadFrames(frameIndices) {
    const promises = frameIndices.map(index => {
      const url = this.options.imageUrls[index];
      return this.loadImage(url);
    });
    await Promise.all(promises);
    this.emit('batchLoaded', {
      loaded: this.images.size,
      total: this.totalFrames
    });
  }
  render() {
    if (this.isScrollLocked) return;
    const frameIndex = Math.floor(this.progress * (this.totalFrames - 1));
    const imageUrl = this.options.imageUrls[frameIndex];
    const image = this.images.get(imageUrl);
    if (image && frameIndex !== this.currentFrame) {
      this.currentFrame = frameIndex;
      this.drawImage(image);
    }
  }
  drawImage(image) {
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
  emit(event, data) {
    const eventName = `imageSequence:${event}`;
    const customEvent = new CustomEvent(eventName, {
      detail: data
    });
    this.options.container.dispatchEvent(customEvent);
  }
  getLoadingProgress() {
    return {
      loaded: this.images.size,
      total: this.totalFrames,
      percentage: this.images.size / this.totalFrames * 100
    };
  }
  destroy() {
    this.canvas.remove();
    this.images.clear();
    this.loadingPromises.clear();
  }
}

export { ImageSequenceEngine };
//# sourceMappingURL=image-sequence-engine.esm.js.map
