import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';

interface ImagePreviewModalProps {
    imageFile: File;
    imageUrl: string;
    onSend: (caption: string) => void;
    onCancel: () => void;
    isSending?: boolean;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    imageFile,
    imageUrl,
    onSend,
    onCancel,
    isSending = false
}) => {
    const [caption, setCaption] = useState('');

    const handleSend = () => {
        onSend(caption);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="image-preview-modal-overlay" onClick={onCancel}>
            <div className="image-preview-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>Odeslat fotku</h3>
                    <button onClick={onCancel} className="close-button" aria-label="Zavřít">
                        <X size={24} />
                    </button>
                </div>

                <div className="image-container">
                    <img src={imageUrl} alt="Preview" />
                </div>

                <div className="modal-footer">
                    <input
                        type="text"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Přidat popisek (volitelné)..."
                        className="caption-input"
                        disabled={isSending}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        className="send-button"
                        disabled={isSending}
                        aria-label="Odeslat"
                    >
                        {isSending ? <Loader2 size={20} className="spinner" /> : <Send size={20} />}
                    </button>
                </div>
            </div>

            <style>{`
                .image-preview-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 20px;
                    animation: fadeIn 0.2s ease-out;
                }

                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .image-preview-modal {
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 20px;
                    max-width: 600px;
                    width: 100%;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .modal-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .modal-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                }

                .close-button {
                    background: transparent;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .close-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .image-container {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow: hidden;
                }

                .image-container img {
                    max-width: 100%;
                    max-height: 100%;
                    object-fit: contain;
                    border-radius: 12px;
                }

                .modal-footer {
                    display: flex;
                    gap: 12px;
                    padding: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                }

                .caption-input {
                    flex: 1;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 12px 16px;
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: all 0.2s;
                }

                .caption-input:focus {
                    background: rgba(255, 255, 255, 0.08);
                    border-color: rgba(255, 71, 87, 0.5);
                }

                .caption-input::placeholder {
                    color: rgba(255, 255, 255, 0.4);
                }

                .caption-input:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .send-button {
                    background: linear-gradient(135deg, #ff4757, #ff6b81);
                    border: none;
                    border-radius: 12px;
                    padding: 12px 20px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    min-width: 60px;
                }

                .send-button:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(255, 71, 87, 0.4);
                }

                .send-button:active:not(:disabled) {
                    transform: translateY(0);
                }

                .send-button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .spinner {
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                @media (max-width: 640px) {
                    .image-preview-modal {
                        max-height: 95vh;
                        border-radius: 20px 20px 0 0;
                        margin-top: auto;
                    }
                }
            `}</style>
        </div>
    );
};
