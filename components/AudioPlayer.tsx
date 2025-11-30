import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface AudioPlayerProps {
    audioUrl: string;
    duration?: number;
    isOwnMessage?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, duration, isOwnMessage = false }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [audioDuration, setAudioDuration] = useState(duration || 0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setAudioDuration(audio.duration);
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const progressBar = e.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * audioDuration;

        audio.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;

    return (
        <div className={`audio-player ${isOwnMessage ? 'own-message' : ''}`}>
            <audio ref={audioRef} src={audioUrl} preload="metadata" />

            <button onClick={togglePlay} className="play-button" aria-label={isPlaying ? 'Pozastavit' : 'Přehrát'}>
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>

            <div className="audio-info">
                <div className="progress-bar" onClick={handleSeek}>
                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                </div>
                <div className="time-display">
                    <span className="current-time">{formatTime(currentTime)}</span>
                    <span className="separator">/</span>
                    <span className="total-time">{formatTime(audioDuration)}</span>
                </div>
            </div>

            <style>{`
                .audio-player {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 16px;
                    min-width: 250px;
                    max-width: 350px;
                }

                .audio-player.own-message {
                    background: rgba(255, 71, 87, 0.15);
                }

                .play-button {
                    background: linear-gradient(135deg, #ff4757, #ff6b81);
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    cursor: pointer;
                    flex-shrink: 0;
                    transition: all 0.2s;
                }

                .play-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 4px 12px rgba(255, 71, 87, 0.4);
                }

                .play-button:active {
                    transform: scale(0.95);
                }

                .audio-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .progress-bar {
                    height: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 2px;
                    cursor: pointer;
                    position: relative;
                    overflow: hidden;
                }

                .progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #ff4757, #ff6b81);
                    border-radius: 2px;
                    transition: width 0.1s linear;
                }

                .time-display {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                    font-variant-numeric: tabular-nums;
                }

                .separator {
                    color: rgba(255, 255, 255, 0.4);
                }
            `}</style>
        </div>
    );
};
