import { ImageSequenceEngine } from "../src/ImageSequenceEngine";
import Lenis from "lenis";

const baseUrl = "/sequence/";
const imageUrls = Array.from(
  { length: 650 },
  (_, i) => `${baseUrl}frame_${String(i + 1).padStart(4, "0")}.jpg`
);

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container") as HTMLElement;
  const wrapper = document.querySelector(".wrapper") as HTMLElement;

  if (!container || !wrapper) {
    console.error("Container or wrapper not found");
    return;
  }

  const engine = new ImageSequenceEngine({
    container,
    wrapper,
    imageUrls,
    LenisClass: Lenis,
    createLenis: true,
  });
});
