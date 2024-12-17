export interface ImageSequenceOptions {
  container: HTMLElement;
  wrapper: HTMLElement;
  imageUrls: string[];
  lenis?: any; // Instance of Lenis
  LenisClass?: any; // Lenis class for creating new instance
  createLenis?: boolean; // If true and LenisClass is provided, creates new instance
  lenisOptions?: Record<string, unknown>; // Options for Lenis if created
}

export interface LoadingProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface BatchLoadedEvent {
  loaded: number;
  total: number;
}

export interface ImageLoadedEvent extends BatchLoadedEvent {
  url: string;
}
