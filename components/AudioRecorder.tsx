import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Send, Loader2 } from 'lucide-react';

interface AudioRecorderProps {
    onRecordComplete: (audioBlob: Blob, duration: number) => void;
    onCancel: () => void;
    autoStart?: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordComplete, onCancel, autoStart = true }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Auto-start recording on mount if autoStart is true
    useEffect(() => {
        if (autoStart) {
            startRecording();
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Nepodařilo se získat přístup k mikrofonu. Zkontrolujte oprávnění.');
            onCancel(); // Close recorder on error
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const handleSend = () => {
        if (audioBlob) {
            onRecordComplete(audioBlob, duration);
        }
    };

    const handleCancel = () => {
        if (isRecording) {
            stopRecording();
        }
        setAudioBlob(null);
        setDuration(0);
        onCancel();
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="audio-recorder">
            {isRecording && (
                <div className="recording-controls">
                    <div className="recording-indicator">
                        <div className="pulse-dot"></div>
                        <span className="duration">{formatDuration(duration)}</span>
                    </div>
                    <div className="recording-actions">
                        <button onClick={handleCancel} className="cancel-button" aria-label="Zrušit">
                            <X size={20} />
                        </button>
                        <button onClick={stopRecording} className="stop-button" aria-label="Zastavit">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}

            {!isRecording && audioBlob && (
                <div className="recording-preview">
                    <div className="preview-info">
                        <Mic size={16} />
                        <span>{formatDuration(duration)}</span>
                    </div>
                    <div className="preview-actions">
                        <button onClick={handleCancel} className="cancel-button" aria-label="Zrušit">
                            <X size={20} />
                        </button>
                        <button onClick={handleSend} className="send-button" aria-label="Odeslat">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .audio-recorder {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .recording-controls,
                .recording-preview {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 20px;
                    flex: 1;
                }

                .recording-indicator {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                }

                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #ff4757;
                    border-radius: 50%;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                    50% {
                        opacity: 0.5;
                        transform: scale(1.2);
                    }
                }

                .duration {
                    font-size: 14px;
                    color: #fff;
                    font-variant-numeric: tabular-nums;
                }

                .recording-actions,
                .preview-actions {
                    display: flex;
                    gap: 8px;
                }

                .preview-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex: 1;
                    color: #fff;
                    font-size: 14px;
                }

                .cancel-button,
                .stop-button,
                .send-button {
                    background: transparent;
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                }

                .cancel-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .stop-button:hover,
                .send-button:hover {
                    background: rgba(255, 71, 87, 0.2);
                }
            `}</style>
        </div>
    );
};
