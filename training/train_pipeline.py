"""
Complete training pipeline for Ad Volume Reducer
"""

import click
import json
from pathlib import Path
from video_processor import VideoProcessor
from model_trainer import AdDetectorTrainer


@click.group()
def cli():
    """Ad Volume Reducer Training Pipeline"""
    pass


@cli.command()
@click.argument('video_path', type=click.Path(exists=True))
@click.argument('timestamps_path', type=click.Path(exists=True))
@click.option('--output-dir', default='processed_data', help='Output directory for processed clips')
@click.option('--clip-duration', default=10, help='Duration of each clip in seconds')
def process_video(video_path, timestamps_path, output_dir, clip_duration):
    """Process video file and extract labeled clips"""
    processor = VideoProcessor(output_dir)
    
    # Process video
    clips = processor.process_video_with_timestamps(
        video_path, timestamps_path, clip_duration
    )
    
    print(f"Generated {len(clips['ads'])} ad clips and {len(clips['program'])} program clips")
    
    # Extract features
    print("Extracting features from ad clips...")
    ad_features = processor.extract_audio_features(clips['ads'], 'ad')
    
    print("Extracting features from program clips...")
    program_features = processor.extract_audio_features(clips['program'], 'program')
    
    # Combine and save features
    if not ad_features.empty and not program_features.empty:
        combined_features = pd.concat([ad_features, program_features], ignore_index=True)
        processor.save_features(combined_features, 'combined_features')
        print(f"Saved {len(combined_features)} feature vectors")
    else:
        print("Warning: No features extracted!")


@cli.command()
@click.option('--features-path', default='processed_data/features/combined_features.csv')
@click.option('--output-dir', default='models')
def train_models(features_path, output_dir):
    """Train ad detection models"""
    trainer = AdDetectorTrainer(output_dir)
    
    # Load features
    df = trainer.load_features(features_path)
    
    # Prepare data
    X_train, X_test, y_train, y_test = trainer.prepare_data(df)
    
    # Train models
    print("Training models...")
    trainer.train_random_forest(X_train, y_train)
    trainer.train_logistic_regression(X_train, y_train)
    trainer.train_neural_network(X_train, y_train, X_test, y_test)
    
    # Evaluate models
    results = trainer.evaluate_models(X_test, y_test)
    
    # Save everything
    trainer.save_models()
    trainer.create_simple_js_model('random_forest')
    trainer.create_simple_js_model('logistic_regression')
    
    # Save results
    with open(Path(output_dir) / 'evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print("Training complete!")


@cli.command()
@click.argument('video_path', type=click.Path(exists=True))
@click.option('--model-path', default='models/random_forest_js.json')
def test_model(video_path, model_path):
    """Test trained model on a video file"""
    import librosa
    import numpy as np
    
    # Load model
    with open(model_path, 'r') as f:
        model = json.load(f)
    
    # Extract features from video
    print(f"Analyzing video: {video_path}")
    y, sr = librosa.load(video_path, sr=22050, duration=30)  # First 30 seconds
    
    # Extract basic features (simplified for demo)
    mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    
    # Create feature vector (simplified)
    features = []
    for i in range(mfccs.shape[0]):
        features.extend([np.mean(mfccs[i]), np.std(mfccs[i])])
    features.extend([np.mean(spectral_centroid), np.std(spectral_centroid)])
    
    # Normalize features (simplified)
    if len(features) >= len(model['scaler_mean']):
        normalized_features = [
            (features[i] - model['scaler_mean'][i]) / model['scaler_scale'][i] 
            for i in range(len(model['scaler_mean']))
        ]
        
        # Simple prediction based on feature importance
        if model['type'] == 'simple_rules':
            weighted_sum = sum(
                normalized_features[i] * model['feature_importances'][i] 
                for i in range(len(normalized_features))
            )
            prediction = "AD" if weighted_sum > model['threshold'] else "PROGRAM"
        
        elif model['type'] == 'logistic_regression':
            # Logistic regression prediction
            linear_combination = model['intercept'] + sum(
                normalized_features[i] * model['coefficients'][i] 
                for i in range(len(normalized_features))
            )
            probability = 1 / (1 + np.exp(-linear_combination))
            prediction = "AD" if probability > 0.5 else "PROGRAM"
        
        print(f"Prediction: {prediction}")
        if model['type'] == 'logistic_regression':
            print(f"Confidence: {probability:.2f}")
    
    else:
        print("Error: Feature dimension mismatch")


@cli.command()
def create_sample_data():
    """Create sample timestamp data for testing"""
    from video_processor import create_sample_timestamps
    
    sample_data = create_sample_timestamps()
    
    with open('sample_timestamps.json', 'w') as f:
        json.dump(sample_data, f, indent=2)
    
    print("Created sample_timestamps.json")
    print("This file shows the expected format for timestamp annotations")


if __name__ == '__main__':
    cli()