"""
Video processing module for Ad Volume Reducer
Handles video file processing, audio extraction, and clip generation
"""

import os
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import ffmpeg
import librosa
import numpy as np
import pandas as pd
from tqdm import tqdm


class VideoProcessor:
    """Processes video files and extracts audio features for training"""
    
    def __init__(self, output_dir: str = "processed_data"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Create subdirectories
        (self.output_dir / "ads").mkdir(exist_ok=True)
        (self.output_dir / "program").mkdir(exist_ok=True)
        (self.output_dir / "features").mkdir(exist_ok=True)
        
    def process_video_with_timestamps(
        self, 
        video_path: str, 
        timestamps_path: str,
        clip_duration: int = 10
    ) -> Dict[str, List[str]]:
        """
        Process a video file using timestamp annotations
        
        Args:
            video_path: Path to the video file
            timestamps_path: Path to JSON file with timestamps
            clip_duration: Duration of each clip in seconds
            
        Returns:
            Dictionary with lists of generated clip paths
        """
        video_path = Path(video_path)
        
        # Load timestamp annotations
        with open(timestamps_path, 'r') as f:
            timestamps = json.load(f)
            
        print(f"Processing video: {video_path.name}")
        print(f"Found {len(timestamps.get('ads', []))} ad segments and {len(timestamps.get('program', []))} program segments")
        
        generated_clips = {"ads": [], "program": []}
        
        # Process ad segments
        for i, segment in enumerate(tqdm(timestamps.get('ads', []), desc="Processing ads")):
            clips = self._extract_clips(
                video_path, 
                segment['start'], 
                segment['end'], 
                f"ad_{video_path.stem}_{i}", 
                "ads",
                clip_duration
            )
            generated_clips["ads"].extend(clips)
            
        # Process program segments  
        for i, segment in enumerate(tqdm(timestamps.get('program', []), desc="Processing program")):
            clips = self._extract_clips(
                video_path, 
                segment['start'], 
                segment['end'], 
                f"program_{video_path.stem}_{i}", 
                "program",
                clip_duration
            )
            generated_clips["program"].extend(clips)
            
        return generated_clips
    
    def _extract_clips(
        self,
        video_path: Path,
        start_time: float,
        end_time: float,
        base_name: str,
        category: str,
        clip_duration: int
    ) -> List[str]:
        """Extract clips from a video segment"""
        clips = []
        current_time = start_time
        clip_index = 0
        
        while current_time < end_time:
            clip_end = min(current_time + clip_duration, end_time)
            
            # Skip clips that are too short
            if clip_end - current_time < 3:
                break
                
            output_path = self.output_dir / category / f"{base_name}_{clip_index:03d}.mp4"
            
            try:
                # Use ffmpeg to extract clip
                (
                    ffmpeg
                    .input(str(video_path), ss=current_time, t=clip_end - current_time)
                    .output(
                        str(output_path),
                        acodec='aac',
                        vcodec='libx264',
                        audio_bitrate='128k'
                    )
                    .overwrite_output()
                    .run(quiet=True)
                )
                
                clips.append(str(output_path))
                clip_index += 1
                
            except ffmpeg.Error as e:
                print(f"Error extracting clip: {e}")
                
            current_time += clip_duration
            
        return clips
    
    def extract_audio_features(self, clip_paths: List[str], label: str) -> pd.DataFrame:
        """
        Extract audio features from video clips
        
        Args:
            clip_paths: List of paths to video clips
            label: Label for the clips ('ad' or 'program')
            
        Returns:
            DataFrame with extracted features
        """
        features_list = []
        
        for clip_path in tqdm(clip_paths, desc=f"Extracting features for {label}"):
            try:
                features = self._extract_single_clip_features(clip_path)
                if features is not None:
                    features['label'] = label
                    features['clip_path'] = clip_path
                    features_list.append(features)
            except Exception as e:
                print(f"Error processing {clip_path}: {e}")
                
        if not features_list:
            return pd.DataFrame()
            
        return pd.DataFrame(features_list)
    
    def _extract_single_clip_features(self, clip_path: str) -> Optional[Dict]:
        """Extract audio features from a single clip"""
        try:
            # Load audio using librosa
            y, sr = librosa.load(clip_path, sr=22050, duration=10)
            
            if len(y) == 0:
                return None
                
            # Extract MFCCs
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
            mfcc_features = {
                f'mfcc_{i}_mean': np.mean(mfccs[i]) 
                for i in range(mfccs.shape[0])
            }
            mfcc_std_features = {
                f'mfcc_{i}_std': np.std(mfccs[i]) 
                for i in range(mfccs.shape[0])
            }
            
            # Extract spectral features
            spectral_centroids = librosa.feature.spectral_centroid(y=y, sr=sr)
            spectral_rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
            spectral_bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
            zero_crossing_rate = librosa.feature.zero_crossing_rate(y)
            
            # Extract tempo and rhythm features
            tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
            
            # Combine all features
            features = {
                **mfcc_features,
                **mfcc_std_features,
                'spectral_centroid_mean': np.mean(spectral_centroids),
                'spectral_centroid_std': np.std(spectral_centroids),
                'spectral_rolloff_mean': np.mean(spectral_rolloff),
                'spectral_rolloff_std': np.std(spectral_rolloff),
                'spectral_bandwidth_mean': np.mean(spectral_bandwidth),
                'spectral_bandwidth_std': np.std(spectral_bandwidth),
                'zero_crossing_rate_mean': np.mean(zero_crossing_rate),
                'zero_crossing_rate_std': np.std(zero_crossing_rate),
                'tempo': tempo,
                'audio_length': len(y) / sr,
                'audio_rms': np.sqrt(np.mean(y**2)),
            }
            
            return features
            
        except Exception as e:
            print(f"Feature extraction error for {clip_path}: {e}")
            return None
    
    def save_features(self, features_df: pd.DataFrame, filename: str):
        """Save extracted features to CSV file"""
        output_path = self.output_dir / "features" / f"{filename}.csv"
        features_df.to_csv(output_path, index=False)
        print(f"Features saved to: {output_path}")
        return output_path


def create_sample_timestamps(video_duration: float = 3600) -> Dict:
    """
    Create sample timestamp annotations for testing
    
    Args:
        video_duration: Duration of video in seconds
        
    Returns:
        Dictionary with sample timestamps
    """
    # Simulate typical TV show with ads
    timestamps = {
        "ads": [
            {"start": 300, "end": 480},    # 5-8 min: first ad break
            {"start": 900, "end": 1080},   # 15-18 min: second ad break  
            {"start": 1500, "end": 1680},  # 25-28 min: third ad break
            {"start": 2100, "end": 2280},  # 35-38 min: fourth ad break
            {"start": 2700, "end": 2880},  # 45-48 min: fifth ad break
        ],
        "program": [
            {"start": 0, "end": 300},      # 0-5 min: show content
            {"start": 480, "end": 900},    # 8-15 min: show content
            {"start": 1080, "end": 1500},  # 18-25 min: show content
            {"start": 1680, "end": 2100},  # 28-35 min: show content
            {"start": 2280, "end": 2700},  # 38-45 min: show content
            {"start": 2880, "end": 3600},  # 48-60 min: show content
        ]
    }
    
    return timestamps


if __name__ == "__main__":
    # Example usage
    processor = VideoProcessor()
    
    # Create sample timestamp file for testing
    sample_timestamps = create_sample_timestamps()
    with open("sample_timestamps.json", "w") as f:
        json.dump(sample_timestamps, f, indent=2)
        
    print("Video processor ready!")
    print("To use:")
    print("1. Place your video files in the current directory")
    print("2. Create timestamp JSON files with ad/program segments")
    print("3. Run: python video_processor.py")
    print("\nExample timestamp format saved to sample_timestamps.json")