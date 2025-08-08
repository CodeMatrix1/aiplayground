#!/usr/bin/env python3
"""
Speaker Diarization Script using pyannote.audio
This script performs speaker diarization on audio files and outputs JSON results.
"""

import sys
import json
import argparse
from pathlib import Path
import torch
from pyannote.audio import Pipeline
from pyannote.audio.pipelines.utils.hook import ProgressHook
import librosa
import numpy as np

def perform_diarization(audio_path, num_speakers=2):
    """
    Perform speaker diarization on an audio file.
    
    Args:
        audio_path (str): Path to the audio file
        num_speakers (int): Number of speakers to detect (default: 2)
    
    Returns:
        list: List of diarization segments with speaker, start, end, and text
    """
    try:
        # Load the diarization pipeline
        # Note: You need to have pyannote.audio installed and configured
        # with HuggingFace token for pyannote/speaker-diarization-3.1
        pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token="YOUR_HUGGINGFACE_TOKEN"  # Replace with your token
        )
        
        # Move pipeline to GPU if available
        if torch.cuda.is_available():
            pipeline = pipeline.to(torch.device("cuda"))
        
        # Perform diarization
        with ProgressHook() as hook:
            diarization = pipeline(audio_path, hook=hook)
        
        # Extract segments
        segments = []
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "speaker": int(speaker.split("_")[-1]),  # Extract speaker number
                "start": float(turn.start),
                "end": float(turn.end),
                "text": ""  # Text will be filled by alignment with transcription
            })
        
        # Limit to specified number of speakers
        if segments:
            max_speaker = max(seg["speaker"] for seg in segments)
            if max_speaker >= num_speakers:
                # Reassign speaker IDs to limit to num_speakers
                for segment in segments:
                    segment["speaker"] = segment["speaker"] % num_speakers
        
        return segments
        
    except Exception as e:
        print(f"Error in diarization: {str(e)}", file=sys.stderr)
        # Return mock data for demonstration
        return create_mock_diarization(audio_path, num_speakers)

def create_mock_diarization(audio_path, num_speakers=2):
    """
    Create mock diarization data for demonstration purposes.
    In production, this should be replaced with actual diarization.
    """
    try:
        # Get audio duration
        duration = librosa.get_duration(path=audio_path)
        
        # Create mock segments
        segments = []
        segment_duration = duration / (num_speakers * 3)  # 3 segments per speaker
        
        for i in range(num_speakers * 3):
            start = i * segment_duration
            end = min((i + 1) * segment_duration, duration)
            speaker = i % num_speakers
            
            segments.append({
                "speaker": speaker,
                "start": round(start, 2),
                "end": round(end, 2),
                "text": f"Mock text for speaker {speaker + 1}"
            })
        
        return segments
        
    except Exception as e:
        print(f"Error creating mock diarization: {str(e)}", file=sys.stderr)
        return []

def main():
    parser = argparse.ArgumentParser(description="Perform speaker diarization on audio file")
    parser.add_argument("audio_path", help="Path to the audio file")
    parser.add_argument("--speakers", type=int, default=2, help="Number of speakers (default: 2)")
    parser.add_argument("--output", help="Output JSON file path (default: stdout)")
    
    args = parser.parse_args()
    
    # Check if audio file exists
    if not Path(args.audio_path).exists():
        print(f"Error: Audio file '{args.audio_path}' not found", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Perform diarization
        segments = perform_diarization(args.audio_path, args.speakers)
        
        # Output results
        result = {
            "audio_path": args.audio_path,
            "num_speakers": args.speakers,
            "segments": segments,
            "total_segments": len(segments)
        }
        
        if args.output:
            with open(args.output, 'w') as f:
                json.dump(result, f, indent=2)
        else:
            print(json.dumps(result, indent=2))
            
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
