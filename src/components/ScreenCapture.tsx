import React, { useRef, useState, useEffect, useCallback } from "react";
import { Camera } from "lucide-react";


interface Selection {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ScreenCaptureProps {
    setSelectedImages: React.Dispatch<React.SetStateAction<File[]>>;
    setImagePreviews: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function ScreenCapture({ setSelectedImages, setImagePreviews }: ScreenCaptureProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [image, setImage] = useState<string | null>(null);

    // Region selection state
    const [isSelecting, setIsSelecting] = useState(false);
    const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
    const [endPos, setEndPos] = useState<{ x: number; y: number } | null>(null);
    const [aspectRatio, setAspectRatio] = useState(16 / 9); // default, will update


    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleLoadedMetadata = () => {
            if (video.videoWidth && video.videoHeight) {
                setAspectRatio(video.videoWidth / video.videoHeight);
            }
        };

        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => {
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };
    }, []);

    // Start screen capture
    const startCapture = async () => {
        try {
            const s = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "motion" },
                audio: false,
            });
            setStream(s);
            if (videoRef.current) {
                videoRef.current.srcObject = s;
                setIsCapturing(true)
                await videoRef.current.play();
            }
            // Clear previous selection and image
            setStartPos(null);
            setEndPos(null);
            setImage(null);
        } catch (err) {
            console.error("Error starting capture:", err);
        }
    };

    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    }

    const takeScreenshot = async () => {
        if (!videoRef.current || !canvasRef.current || !startPos || !endPos) {
            alert("Please select a region first!");
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Calculate scale ratios between video element size and actual video resolution
        const scaleX = video.videoWidth / video.clientWidth;
        const scaleY = video.videoHeight / video.clientHeight;

        // Calculate selection rectangle in video coordinate space and normalize
        const x = Math.min(startPos.x, endPos.x) * scaleX;
        const y = Math.min(startPos.y, endPos.y) * scaleY;
        const width = Math.abs(endPos.x - startPos.x) * scaleX;
        const height = Math.abs(endPos.y - startPos.y) * scaleY;

        if (width === 0 || height === 0) {
            alert("Selection area is zero!");
            return;
        }

        // IMPORTANT: Set canvas size to match selection size in video pixels
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw the selected region of the video onto the canvas at 0,0 with full size
        ctx.drawImage(video, x, y, width, height, 0, 0, width, height);

        // Convert canvas to image data URL
        const img = canvas.toDataURL("image/png");
        setImage(img);

        if (isSelecting) {
            return
        }
        // ---- Add this part ----
        const file = dataURLtoFile(img, `screenshot_${Date.now()}.png`);
        console.log("This is captured image file", file)
        setSelectedImages(prev => [...prev, file]);
        // // Optional: trigger download automatically
        // const a = document.createElement("a");
        // a.href = img;
        // a.download = `screenshot_${Date.now()}.png`;
        // a.click();
    };


    // Style for selection rectangle
    const selectionStyle =
        startPos && endPos
            ? {
                position: "absolute" as const,
                border: "2px dashed red",
                backgroundColor: "rgba(255, 0, 0, 0.2)",
                left: Math.min(startPos.x, endPos.x),
                top: Math.min(startPos.y, endPos.y),
                width: Math.abs(endPos.x - startPos.x),
                height: Math.abs(endPos.y - startPos.y),
                pointerEvents: "none" as const,
                zIndex: 2,
            }
            : {};

    const [isCapturing, setIsCapturing] = useState(false);
    const [selection, setSelection] = useState<Selection>({ x: 0, y: 0, width: 0, height: 0 });


    // const handleMouseDown = (e: React.MouseEvent) => {
    //     if (!isCapturing) return;
    //     console.log("capturing is on!")
    //     setIsSelecting(true);
    //     const video = videoRef.current;
    //     const canvas = canvasRef.current;

    //     // Calculate scale ratios between video element size and actual video resolution
    //     const scaleX = video.videoWidth / video.clientWidth;
    //     const scaleY = video.videoHeight / video.clientHeight;
    //     const rect = videoRef.current.getBoundingClientRect();
    //     setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    //     setSelection({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 });
    // };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isSelecting) {
            const width = 0;
            const height = 0;
            setSelection(prev => ({
                ...prev,
                width,
                height
            }));
            return;
        }
        const video = videoRef.current;
        const canvas = canvasRef.current;

        const rect = videoRef.current.getBoundingClientRect();
        const width = (e.clientX - rect.left - startPos.x);
        const height = (e.clientY - rect.top - startPos.y);
        setSelection(prev => ({
            ...prev,
            width,
            height
        }));

    };

    const handleMouseUp = async (e: React.MouseEvent) => {
        if (!isSelecting) return;
        const rect = videoRef.current.getBoundingClientRect();
        setEndPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setIsSelecting(false);
        // if (selection.width !== 0 && selection.height !== 0) {
        //     await takeScreenshot();
        // }
    };

    useEffect(() => {
        if (
            startPos &&
            endPos &&
            !isSelecting &&
            (selection.width !== 0 && selection.height !== 0)
        ) {
            takeScreenshot();
        }
        // eslint-disable-next-line
    }, [endPos, startPos, isSelecting]);

    // Inside your component:
    const handleGlobalMouseMove = useCallback((e) => {
        if (!isSelecting) return;
        const video = videoRef.current;
        if (!video || !startPos) return;
        const rect = video.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setSelection(prev => ({
            ...prev,
            width: x - startPos.x,
            height: y - startPos.y
        }));
    }, [isSelecting, startPos]);

    const handleGlobalMouseUp = useCallback((e) => {
        if (!isSelecting) return;
        const video = videoRef.current;
        if (!video || !startPos) return;
        const rect = video.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setEndPos({ x, y });
        setIsSelecting(false);
        if (selection.width !== 0 && selection.height !== 0) {
            takeScreenshot();
        }
        // Remove global listeners
        window.removeEventListener("mousemove", handleGlobalMouseMove);
        window.removeEventListener("mouseup", handleGlobalMouseUp);
    }, [isSelecting, startPos, selection, takeScreenshot]);

    const handleMouseDown = (e) => {
        if (!isCapturing) return;
        setIsSelecting(true);
        const video = videoRef.current;
        if (!video) return;
        const rect = video.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setStartPos({ x, y });
        setSelection({ x, y, width: 0, height: 0 });

        // Add global listeners
        window.addEventListener("mousemove", handleGlobalMouseMove);
        window.addEventListener("mouseup", handleGlobalMouseUp);
    };

    return (
        <div style={{ fontFamily: "Arial, sans-serif", maxWidth: 600, margin: "auto" }}>
            <button onClick={startCapture} style={{ marginBottom: 10 }}>
                <Camera size={24} color="red" />
            </button>

            <div
                style={{
                    position: "relative",
                    width: 600,
                    aspectRatio: aspectRatio,
                    border: "1px solid #ccc",
                    userSelect: "none",
                    overflow: "hidden"
                }}
            >
                <video
                    ref={videoRef}
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "fill", // or "cover" for cropping
                        backgroundColor: "#000"
                    }}
                    autoPlay
                    muted
                    playsInline
                />
                {/* Transparent overlay for mouse events */}
                <div
                    style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, cursor: "crosshair" }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
                {/* Selection rectangle */}
                {(isSelecting && startPos) || (startPos && endPos) ? (
                    <div
                        style={{
                            position: "absolute",
                            border: "2px dashed red",
                            backgroundColor: "rgba(255, 0, 0, 0.2)",
                            left: Math.min(startPos.x, isSelecting ? startPos.x + selection.width : endPos.x),
                            top: Math.min(startPos.y, isSelecting ? startPos.y + selection.height : endPos.y),
                            width: Math.abs(isSelecting ? selection.width : endPos.x - startPos.x),
                            height: Math.abs(isSelecting ? selection.height : endPos.y - startPos.y),
                            pointerEvents: "none",
                            zIndex: 2,
                        }}
                    />
                ) : null}
            </div>

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {image && false && (
                <div style={{ marginTop: 20 }}>
                    <h3>Captured Image Preview:</h3>
                    <img src={image} alt="Captured region" style={{ maxWidth: "100%" }} />
                </div>
            )}
        </div>
    );
}
