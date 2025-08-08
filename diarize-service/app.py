from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from sklearn.cluster import KMeans
import numpy as np
import tempfile
import os
import soundfile as sf
import librosa
import uvicorn
from typing import List, Dict

app = FastAPI()

def extract_mfcc_features(audio_path: str, n_mfcc: int = 13) -> np.ndarray:
    """Extract MFCC features from audio file"""
    try:
        # Load audio file
        y, sr = librosa.load(audio_path, sr=None)
        
        # Extract MFCC features
        mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=n_mfcc)
        
        # Transpose to get features per frame
        mfcc = mfcc.T
        
        return mfcc
    except Exception as e:
        print(f"Error extracting MFCC: {e}")
        return np.array([])

def simple_diarization(audio_path: str, num_speakers: int = 2) -> List[Dict]:
    """Simple speaker diarization using MFCC features and clustering"""
    try:
        # Extract MFCC features
        mfcc_features = extract_mfcc_features(audio_path)
        
        if len(mfcc_features) == 0:
            return []
        
        # Use K-means clustering to separate speakers
        kmeans = KMeans(n_clusters=num_speakers, random_state=42, n_init=10)
        labels = kmeans.fit_predict(mfcc_features)
        
        # Get audio duration
        y, sr = librosa.load(audio_path, sr=None)
        duration = len(y) / sr
        
        # Create segments based on clustering
        frame_duration = duration / len(labels)
        segments = []
        
        current_speaker = labels[0]
        start_time = 0
        
        for i, label in enumerate(labels):
            if label != current_speaker:
                # End current segment
                end_time = i * frame_duration
                segments.append({
                    "speaker": int(current_speaker),
                    "start": round(start_time, 2),
                    "end": round(end_time, 2)
                })
                
                # Start new segment
                current_speaker = label
                start_time = end_time
        
        # Add final segment
        segments.append({
            "speaker": int(current_speaker),
            "start": round(start_time, 2),
            "end": round(duration, 2)
        })
        
        return segments
        
    except Exception as e:
        print(f"Error in diarization: {e}")
        return []

@app.post("/diarize")
async def diarize(audio: UploadFile = File(...)):
    try:
        # Save temp file
        tmp_path = os.path.join(tempfile.gettempdir(), audio.filename)
        with open(tmp_path, "wb") as buffer:
            buffer.write(await audio.read())

        # Perform diarization
        segments = simple_diarization(tmp_path, num_speakers=2)
        
        # Clean up temp file
        os.remove(tmp_path)
        
        return JSONResponse(content={"segments": segments})

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=9002, reload=True)
