/**
 * Compress an image file to reduce size before upload
 * @param file - The original image file
 * @param maxWidth - Maximum width in pixels (default: 1920)
 * @param quality - JPEG quality 0-1 (default: 0.8)
 * @returns Compressed image as Blob
 */
export const compressImage = async (
    file: File,
    maxWidth: number = 1920,
    quality: number = 0.8
): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Draw image on canvas
                ctx.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to compress image'));
                        }
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = e.target?.result as string;
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsDataURL(file);
    });
};

/**
 * Convert audio blob to File with proper extension
 * @param blob - Audio blob from MediaRecorder
 * @param filename - Desired filename
 * @returns File object
 */
export const blobToFile = (blob: Blob, filename: string): File => {
    return new File([blob], filename, { type: blob.type });
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Validate image file
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes (default: 10MB)
 * @returns Validation result
 */
export const validateImageFile = (
    file: File,
    maxSize: number = 10 * 1024 * 1024
): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Neplatný formát obrázku. Podporované formáty: JPEG, PNG, WebP, GIF'
        };
    }

    // Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Obrázek je příliš velký. Maximální velikost: ${formatFileSize(maxSize)}`
        };
    }

    return { valid: true };
};

/**
 * Validate audio file
 * @param file - File to validate
 * @param maxSize - Maximum file size in bytes (default: 5MB)
 * @returns Validation result
 */
export const validateAudioFile = (
    file: File,
    maxSize: number = 5 * 1024 * 1024
): { valid: boolean; error?: string } => {
    // Check file type
    const validTypes = ['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/ogg'];
    if (!validTypes.includes(file.type)) {
        return {
            valid: false,
            error: 'Neplatný formát audia. Podporované formáty: WebM, MP4, MP3, OGG'
        };
    }

    // Check file size
    if (file.size > maxSize) {
        return {
            valid: false,
            error: `Audio je příliš velké. Maximální velikost: ${formatFileSize(maxSize)}`
        };
    }

    return { valid: true };
};
