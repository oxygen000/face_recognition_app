/**
 * Utility functions for image processing in the face recognition application
 */

// Image compression settings
export const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
export const COMPRESSION_QUALITY = 0.85; // Slightly higher quality
export const MAX_DIMENSION = 1280; // Maximum dimension for resized images

/**
 * Try to use WebGL for faster image processing when available
 * @param canvas - The canvas element to get WebGL context from
 * @returns WebGL rendering context or null if not available
 */
export const tryGetWebGLContext = (
  canvas: HTMLCanvasElement
): WebGLRenderingContext | null => {
  try {
    // Try to get WebGL context first for better performance
    const glContext = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (glContext) {
      console.log("Using WebGL for image processing (faster)");
      return glContext;
    }
  } catch {
    console.log("WebGL not available, falling back to Canvas 2D");
  }
  return null;
};

/**
 * Compress an image to optimize size and dimensions
 * @param file - The image file to compress
 * @returns Promise that resolves to the compressed file
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // Skip compression for small images to improve performance
    if (file.size <= MAX_IMAGE_SIZE / 2) {
      console.log("Image already optimized, skipping compression");
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      // Create image loading indicator for large files
      if (file.size > MAX_IMAGE_SIZE) {
        console.log(
          `Processing large image (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
        );
      }

      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width);
          width = MAX_DIMENSION;
        } else if (height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height);
          height = MAX_DIMENSION;
        }

        canvas.width = width;
        canvas.height = height;

        // Try to use WebGL for better performance
        const ctx =
          tryGetWebGLContext(canvas) ||
          canvas.getContext("2d", { alpha: false });

        if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
          console.log("Using standard 2D context for image processing");
          const ctx2d = canvas.getContext("2d", { alpha: false });
          if (!ctx2d) {
            resolve(file); // Fall back to original if context fails
            return;
          }

          // Fill with white background to prevent transparency issues
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.fillRect(0, 0, width, height);

          // Use better image rendering for facial recognition
          ctx2d.imageSmoothingQuality = "high";
          ctx2d.drawImage(img, 0, 0, width, height);
        } else {
          // Using 2D context (when WebGL not available or when the cast worked)
          // Fill with white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);

          // Use better image rendering
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);
        }

        // Determine quality based on file size
        let quality = COMPRESSION_QUALITY;
        if (file.size > MAX_IMAGE_SIZE * 1.5) {
          quality = 0.7; // Use lower quality for very large files
        }

        // Get compressed image as blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fall back to original if blob creation fails
              return;
            }

            // Create new file from blob
            const newFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });

            console.log(
              `Compressed image: ${(file.size / 1024).toFixed(2)}KB → ${(
                newFile.size / 1024
              ).toFixed(2)}KB`
            );
            resolve(newFile);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file); // Fall back to original on error
    };
    reader.onerror = () => resolve(file); // Fall back to original on error
  });
};

/**
 * Process large images progressively to avoid UI blocking
 * @param file - The image file to process
 * @returns Promise that resolves to the processed file
 */
export const processLargeImage = async (file: File): Promise<File> => {
  if (file.size <= MAX_IMAGE_SIZE) {
    return compressImage(file);
  }

  // For large images, process in the next frame to allow UI updates
  console.log(
    `Processing very large image (${(file.size / (1024 * 1024)).toFixed(2)}MB)`
  );

  return new Promise((resolve) => {
    window.requestAnimationFrame(async () => {
      const result = await compressImage(file);
      resolve(result);
    });
  });
};

/**
 * Convert a data URL to a File object
 * @param dataUrl - The data URL to convert
 * @param filename - The filename to use for the created file
 * @returns Promise that resolves to the created File
 */
export const dataUrlToFile = async (
  dataUrl: string,
  filename: string
): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
};
