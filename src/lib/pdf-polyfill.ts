// Polyfill browser-only globals for pdfjs-dist / pdf-parse in Node environments
if (typeof global.DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    a: number = 1; b: number = 0; c: number = 0; d: number = 1; e: number = 0; f: number = 0;
    constructor() {}
  };
}

if (typeof (global as any).Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {
    constructor() {}
  };
}

if (typeof (global as any).ImageData === 'undefined') {
  (global as any).ImageData = class ImageData {
    constructor() {}
  };
}

// Export something to make it a module
export {};
