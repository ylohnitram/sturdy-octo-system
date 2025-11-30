import React from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, onClose }) => {
    return (
        <div className="image-lightbox-overlay" onClick={onClose}>
            <button onClick={onClose} className="close-button" aria-label="Zavřít">
                <X size={32} />
            </button>

            <div className="image-wrapper" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Full size" />
            </div>

            <style>{`
                .image-lightbox-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.95);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    padding: 20px;
                    animation: fadeIn 0.2s ease-out;
                    cursor: zoom-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .close-button {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.5);
                    border: none;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                    z-index: 10002;
                }

                .close-button:hover {
                    background: rgba(0, 0, 0, 0.8);
                    transform: scale(1.1);
                }

                .image-wrapper {
                    max-width: 100%;
                    max-height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: default;
                }

                .image-wrapper img {
                    max-width: 100%;
                    max-height: 90vh;
                    object-fit: contain;
                    border-radius: 8px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: zoomIn 0.3s ease-out;
                }

                @keyframes zoomIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                @media (max-width: 640px) {
                    .close-button {
                        top: 10px;
                        right: 10px;
                        width: 40px;
                        height: 40px;
                    }

                    .image-wrapper img {
                        max-height: 85vh;
                    }
                }
            `}</style>
        </div>
    );
};
