/**
 * Maximum image size for upload (1MB)
 */
export const MAX_IMAGE_SIZE = 1024 * 1024;

/**
 * Quality setting for image compression (0-1)
 */
export const COMPRESSION_QUALITY = 0.8;

/**
 * Compress an image file to reduce size while maintaining quality
 * @param file The file to compress
 * @returns Promise resolving to a compressed file or the original if compression fails
 */
export const compressImage = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    // If file is already small enough, skip compression
    if (file.size <= MAX_IMAGE_SIZE) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height && width > 1024) {
          height = Math.round((height * 1024) / width);
          width = 1024;
        } else if (height > 1024) {
          width = Math.round((width * 1024) / height);
          height = 1024;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");

        if (!ctx) {
          resolve(file); // Fall back to original if canvas context fails
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

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

            resolve(newFile);
          },
          "image/jpeg",
          COMPRESSION_QUALITY
        );
      };
      img.onerror = () => resolve(file); // Fall back to original on error
    };
    reader.onerror = () => resolve(file); // Fall back to original on error
  });
};

/**
 * Convert a base64 string to a File object
 * @param base64 The base64 string
 * @param filename The desired filename
 * @returns File object created from the base64 string
 */
export const base64ToFile = async (
  base64: string,
  filename: string
): Promise<File> => {
  const response = await fetch(base64);
  const blob = await response.blob();
  return new File([blob], filename, {
    type: "image/jpeg",
  });
};

/**
 * Convert a File to a base64 string
 * @param file The file to convert
 * @returns Promise resolving to the base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
