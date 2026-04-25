import {useEffect, useRef, useState, type ChangeEvent, type DragEvent} from 'react'
import {useOutletContext} from "react-router";
import {CheckCircle2, ImageIcon, UploadIcon} from "lucide-react";
import {
    PROGRESS_INCREMENT,
    PROGRESS_INTERVAL_MS,
    REDIRECT_DELAY_MS,
} from "../lib/constants";

type UploadProps = {
    onComplete?: (base64Data: string) => void;
};

const Upload =({onComplete}: UploadProps)=> {
    const[file, setFile] = useState<File | null>(null);
    const[isDragging, setIsDragging] = useState(false);
    const[progress, setProgress] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const{isSignedIn}= useOutletContext<AuthContext>();

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }

            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);

    const resetUploadTimers = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        if (redirectTimeoutRef.current) {
            clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = null;
        }
    };

    const processFile = (selectedFile: File) => {
        if (!isSignedIn) return;

        resetUploadTimers();
        setFile(selectedFile);
        setProgress(0);

        const reader = new FileReader();

        reader.onload = () => {
            const base64Data = typeof reader.result === "string" ? reader.result : "";

            intervalRef.current = setInterval(() => {
                setProgress((currentProgress) => {
                    const nextProgress = Math.min(currentProgress + PROGRESS_INCREMENT, 100);

                    if (nextProgress === 100) {
                        if (intervalRef.current) {
                            clearInterval(intervalRef.current);
                            intervalRef.current = null;
                        }

                        redirectTimeoutRef.current = setTimeout(() => {
                            onComplete?.(base64Data);
                        }, REDIRECT_DELAY_MS);
                    }

                    return nextProgress;
                });
            }, PROGRESS_INTERVAL_MS);
        };

        reader.readAsDataURL(selectedFile);
    };

    const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (!isSignedIn) return;
        setIsDragging(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (!isSignedIn) return;
        setIsDragging(false);
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();

        if (!isSignedIn) return;

        setIsDragging(false);

        const droppedFile = event.dataTransfer.files?.[0];

        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (!isSignedIn) return;

        const selectedFile = event.target.files?.[0];

        if (selectedFile) {
            processFile(selectedFile);
        }

        event.target.value = "";
    };

    return (
        <div className={"upload"}>
            {!file ? (
                <div
                    className={`dropzone ${isDragging ? 'is-dragging' : ''} ${!isSignedIn ? 'is-disabled' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        onChange={handleChange}
                    />
                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? ("Click to upload or just drag and drop"):("Sign in or sign up with puter to upload")}

                        </p>
                        <p className="help"> Maximum file size 50 MB.</p>
                    </div>
                </div>
            ) : (
                <div className="upload-status">
                    <div className="status-content">
                        <div className="status-icon">
                            {progress == 100 ?(
                                <CheckCircle2 className="check"/>
                            ):(
                                <ImageIcon className="image"/>
                            )}
                        </div>

                        <h3>{file.name}</h3>

                        <div className='progress'>
                            <div className="bar" style={{width: `${progress}%`}} />

                            <p className="status-text">
                                {progress <100 ? 'Analyzing Floor plan ...' : 'Redirecting...'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
export default Upload;


/*
<div className={"upload"}>
            {!file ? (
                <div className={`dropzone ${isDragging ? 'is-dragging' : ''}`}>
                    <input
                        type="file"
                        className="drop-input"
                        accept=".jpg,.jpeg,.png"
                        disabled={!isSignedIn}
                        />
                    <div className="drop-content">
                        <div className="drop-icon">
                            <UploadIcon size={20} />
                        </div>
                        <p>
                            {isSignedIn ? ("Click to upload or just drag and drop"):("Sign in or sign up with puter to upload")}

                        </p>
                    </div>
                    </div>
            ) : (
                <div>File</div>
            )}
        </div>
 */
