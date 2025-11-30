import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string;
    images?: string[];
    currentIndex?: number;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    imageUrl,
    images = [],
    currentIndex = 0,
    onClose,
    onNext,
    onPrev
}) => {
    const hasMultiple = images.length > 1;
    const showNav = hasMultiple && onNext && onPrev;

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight' && onNext) onNext();
            if (e.key === 'ArrowLeft' && onPrev) onPrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onNext, onPrev]);

    return (
        <div className="image-lightbox-overlay" onClick={onClose}>
            <button onClick={onClose} className="close-button" aria-label="Zavřít">
                <X size={32} />
            </button>

            {showNav && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="nav-button nav-button-left"
                        aria-label="Předchozí"
                    >
                        <ChevronLeft size={32} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="nav-button nav-button-right"
                        aria-label="Další"
                    >
                        <ChevronRight size={32} />
                    </button>
                </>
            )}

            <div className="image-wrapper" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt="Full size" onError={(e) => {
                    console.error('Image load error:', imageUrl);
                    e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23333" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EChyba načítání%3C/text%3E%3C/svg%3E';
                }} />
            </div>

            {hasMultiple && (
                <div className="image-counter">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

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

                .nav-button {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
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

                .nav-button:hover {
                    background: rgba(0, 0, 0, 0.8);
                    transform: translateY(-50%) scale(1.1);
                }

                .nav-button-left {
                    left: 20px;
                }

                .nav-button-right {
                    right: 20px;
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

                .image-counter {
                    position: absolute;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: rgba(0, 0, 0, 0.7);
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 10002;
                }

                @media (max-width: 640px) {
                    .close-button {
                        top: 10px;
                        right: 10px;
                        width: 40px;
                        height: 40px;
                    }

                    .nav-button {
                        width: 40px;
                        height: 40px;
                    }

                    .nav-button-left {
                        left: 10px;
                    }

                    .nav-button-right {
                        right: 10px;
                    }

                    .image-wrapper img {
                        max-height: 85vh;
                    }

                    .image-counter {
                        bottom: 20px;
                        font-size: 12px;
                        padding: 6px 12px;
                    }
                }
            `}</style>
        </div>
    );
};
