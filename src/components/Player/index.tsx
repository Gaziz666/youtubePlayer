import { useRef, useState, useEffect, useCallback } from "react";
import ReactPlayer from "react-player/youtube";
import { OnProgressProps } from "react-player/base";

interface PlayerProps {
    youtubeUrl: string;
    audioUrl: string;
    skipRanges?: [[number, number]] | [];
}

export const Player = ({
    youtubeUrl,
    audioUrl,
    skipRanges = [],
}: PlayerProps) => {
    const videoRef = useRef<ReactPlayer>(null);
    const audioRef = useRef<HTMLVideoElement>(null);

    const [videoVolume, setVideoVolume] = useState(0.8);
    const [audioVolume, setAudioVolume] = useState(0.8);

    // These track when the user wants to play (isPlaying) and when media are loaded
    const [isPlaying, setIsPlaying] = useState(false);
    const [isVideoBuffered, setIsVideoBuffered] = useState(false);
    const [isAudioBuffered, setIsAudioBuffered] = useState(false);

    const [loading, setLoading] = useState(true);

    // Called when YouTube video is ready
    const handleVideoReady = useCallback(() => {
        setIsVideoBuffered(true);
    }, []);

    // Called when the audio is ready to play
    const handleAudioLoaded = () => {
        setIsAudioBuffered(true);
    };

    useEffect(() => {
        if (isVideoBuffered && isAudioBuffered) {
            setLoading(false);
        }
    }, [isVideoBuffered, isAudioBuffered]);

    // User toggles the play/pause button
    const handlePlayPause = () => {
        // Only allow play if both are buffered
        if (!loading) {
            setIsPlaying((prev) => !prev);
        }
    };

    // Keep audio in sync with the video if isPlaying changes
    useEffect(() => {
        if (videoRef.current && audioRef.current) {
            if (isPlaying) {
                // Sync audio to video’s current time, then play
                audioRef.current.currentTime =
                    videoRef.current.getCurrentTime();
                audioRef.current.play();
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = audioVolume;
        }
    }, [audioVolume]);

    // Utility function: if the current time is in a skip range, return the skip-to time
    const maybeSkip = useCallback(
        (currentTime: number) => {
            const skipRange = skipRanges.find(
                ([start, end]) => currentTime >= start && currentTime < end,
            );
            return skipRange?.[1];
        },
        [skipRanges],
    );

    // Called continuously while video is playing
    const handleVideoProgress = useCallback(
        (progressState: OnProgressProps) => {
            if (audioRef.current && isPlaying) {
                const skipTo = maybeSkip(progressState.playedSeconds);
                if (skipTo) {
                    // Jump both video and audio out of the skip range
                    videoRef.current?.seekTo(skipTo, "seconds");
                    audioRef.current.currentTime = skipTo;
                } else {
                    // Normal case: keep audio in sync with video’s time
                    audioRef.current.currentTime = progressState.playedSeconds;
                }
            }
        },
        [isPlaying, maybeSkip],
    );

    // Called if user scrubs manually in the video
    const handleVideoSeek = useCallback(
        (seekSeconds: number) => {
            const skipTo = maybeSkip(seekSeconds);
            const targetTime = skipTo ? skipTo : seekSeconds;
            videoRef.current?.seekTo(targetTime, "seconds");
            if (audioRef.current) {
                audioRef.current.currentTime = targetTime;
            }
        },
        [maybeSkip],
    );

    const handleVideoPlayPause = (status: boolean) => () => {
        setIsPlaying(status);
    };

    const onChangeVideoVolume = (e: React.ChangeEvent<HTMLInputElement>) =>
        setVideoVolume(parseFloat(e.target.value));
    const onChangeAudioVolume = (e: React.ChangeEvent<HTMLInputElement>) =>
        setAudioVolume(parseFloat(e.target.value));

    return (
        <div>
            {loading && <p>Loading video and audio...</p>}

            <ReactPlayer
                ref={videoRef}
                url={youtubeUrl}
                volume={videoVolume}
                playing={isPlaying}
                onReady={handleVideoReady}
                onProgress={handleVideoProgress}
                onSeek={handleVideoSeek}
                onPlay={handleVideoPlayPause(true)}
                onPause={handleVideoPlayPause(false)}
                controls
            />
            <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedData={handleAudioLoaded}
            />

            <div style={{ marginTop: "10px" }}>
                <button onClick={handlePlayPause}>
                    {isPlaying ? "Pause" : "Play"}
                </button>

                <div>
                    <label>Video Volume</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={videoVolume}
                        onChange={onChangeVideoVolume}
                    />
                </div>

                <div>
                    <label>Audio Volume</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={audioVolume}
                        onChange={onChangeAudioVolume}
                    />
                </div>
            </div>
        </div>
    );
};
