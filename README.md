# Image Sequence Scroll

![Six Socks Studio](https://sixsocks.studio/assets/logo.svg)

A high-performance scroll-based image sequence animation engine with progressive loading capabilities. Perfect for creating smooth scroll-driven animations and video-like experiences on the web.

## Features

- 🎯 Progressive image loading strategy
- 🔄 Smart frame interpolation
- 📱 Responsive canvas sizing
- 🎨 Maintains aspect ratio
- 🔌 Optional [Lenis](https://github.com/studio-freight/lenis) smooth scroll integration
- 📊 Loading progress tracking
- 🎮 Event system for animation control

## Installation

```bash
npm install @six-socks-studio/image-sequence-scroll
```

## Basic Usage

```javascript
import { ImageSequenceEngine } from "@six-socks-studio/image-sequence-scroll";

// Create your sequence of image URLs
const imageUrls = Array.from(
  { length: 60 },
  (_, i) => `https://your-domain.com/sequence/frame-${i}.jpg`
);

// Initialize the engine
const sequence = new ImageSequenceEngine({
  container: document.querySelector(".sequence-container"),
  wrapper: document.querySelector(".sequence-wrapper"),
  imageUrls: imageUrls,
});

// Listen to events
sequence.options.container.addEventListener(
  "imageSequence:loadingComplete",
  () => {
    console.log("All images loaded!");
  }
);

sequence.options.container.addEventListener(
  "imageSequence:imageLoaded",
  (e) => {
    console.log(`Loading progress: ${e.detail.loaded}/${e.detail.total}`);
  }
);
```

## HTML Structure

```html
<div class="sequence-wrapper">
  <div class="sequence-container"></div>
</div>

<style>
  .sequence-wrapper {
    height: 300vh; /* Adjust based on your needs */
    position: relative;
  }

  .sequence-container {
    position: sticky;
    top: 0;
    width: 100vw;
    height: 100vh;
  }
</style>
```

## Options

```javascript
{
  container: HTMLElement,    // Required: Container element for the canvas
  wrapper: HTMLElement,      // Required: Wrapper element for scroll tracking
  imageUrls: string[],      // Required: Array of image URLs
  lenis: Lenis,            // Optional: Existing Lenis instance
  LenisClass: Class,       // Optional: Lenis class for new instance
  createLenis: boolean,    // Optional: Create new Lenis instance
  lenisOptions: Object     // Optional: Options for new Lenis instance
}
```

## Events

- `imageSequence:imageLoaded`: Fired when an image is loaded
- `imageSequence:batchLoaded`: Fired when a batch of images is loaded
- `imageSequence:loadingComplete`: Fired when all images are loaded
- `imageSequence:readyToScroll`: Fired when initial loading is complete and scrolling is unlocked

## Advanced Usage with Lenis

```javascript
import { ImageSequenceEngine } from "@six-socks-studio/image-sequence-scroll";
import Lenis from "@studio-freight/lenis";

const sequence = new ImageSequenceEngine({
  container: document.querySelector(".sequence-container"),
  wrapper: document.querySelector(".sequence-wrapper"),
  imageUrls: imageUrls,
  LenisClass: Lenis,
  createLenis: true,
  lenisOptions: {
    duration: 1.2,
    smoothWheel: true,
  },
});
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Build: `npm run build`

## About

Created and maintained by [Six Socks Studio](https://sixsocks.studio).

## License

MIT License - see LICENSE file for details
