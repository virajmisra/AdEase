"""
Model training module for Ad Volume Reducer
Trains ML models to distinguish between ads and program content
"""

import os
import pickle
import json
from pathlib import Path
from typing import Tuple, Dict, Any, Optional
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
import tensorflowjs as tfjs
import matplotlib.pyplot as plt
import seaborn as sns


class AdDetectorTrainer:
    """Trains and evaluates ad detection models"""
    
    def __init__(self, output_dir: str = "models"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        self.scaler = StandardScaler()
        self.models = {}
        self.feature_names = []
        
    def load_features(self, features_path: str) -> pd.DataFrame:
        """Load extracted features from CSV file"""
        df = pd.read_csv(features_path)
        print(f"Loaded {len(df)} samples with {len(df.columns)-2} features")
        print(f"Class distribution: {df['label'].value_counts().to_dict()}")
        return df
    
    def prepare_data(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
        """Prepare data for training"""
        # Separate features and labels
        X = df.drop(['label', 'clip_path'], axis=1)
        y = df['label']
        
        # Store feature names
        self.feature_names = list(X.columns)
        
        # Convert labels to binary (0: program, 1: ad)
        y_binary = (y == 'ad').astype(int)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_binary, test_size=0.2, random_state=42, stratify=y_binary
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        print(f"Training set: {X_train_scaled.shape[0]} samples")
        print(f"Test set: {X_test_scaled.shape[0]} samples")
        
        return X_train_scaled, X_test_scaled, y_train, y_test
    
    def train_random_forest(self, X_train: np.ndarray, y_train: np.ndarray) -> RandomForestClassifier:
        """Train Random Forest model with hyperparameter tuning"""
        print("Training Random Forest model...")
        
        # Hyperparameter grid
        param_grid = {
            'n_estimators': [100, 200, 300],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        rf = RandomForestClassifier(random_state=42)
        
        # Grid search with cross-validation
        grid_search = GridSearchCV(
            rf, param_grid, cv=5, scoring='roc_auc', n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        best_rf = grid_search.best_estimator_
        print(f"Best RF parameters: {grid_search.best_params_}")
        print(f"Best cross-validation AUC: {grid_search.best_score_:.3f}")
        
        # Cross-validation score
        cv_scores = cross_val_score(best_rf, X_train, y_train, cv=5, scoring='roc_auc')
        print(f"RF Cross-validation AUC: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        self.models['random_forest'] = best_rf
        return best_rf
    
    def train_logistic_regression(self, X_train: np.ndarray, y_train: np.ndarray) -> LogisticRegression:
        """Train Logistic Regression model with hyperparameter tuning"""
        print("Training Logistic Regression model...")
        
        # Hyperparameter grid
        param_grid = {
            'C': [0.01, 0.1, 1, 10, 100],
            'penalty': ['l1', 'l2'],
            'solver': ['liblinear']
        }
        
        lr = LogisticRegression(random_state=42, max_iter=1000)
        
        # Grid search with cross-validation
        grid_search = GridSearchCV(
            lr, param_grid, cv=5, scoring='roc_auc', n_jobs=-1, verbose=1
        )
        
        grid_search.fit(X_train, y_train)
        
        best_lr = grid_search.best_estimator_
        print(f"Best LR parameters: {grid_search.best_params_}")
        print(f"Best cross-validation AUC: {grid_search.best_score_:.3f}")
        
        # Cross-validation score
        cv_scores = cross_val_score(best_lr, X_train, y_train, cv=5, scoring='roc_auc')
        print(f"LR Cross-validation AUC: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        self.models['logistic_regression'] = best_lr
        return best_lr
    
    def train_neural_network(self, X_train: np.ndarray, y_train: np.ndarray, 
                           X_test: np.ndarray, y_test: np.ndarray) -> tf.keras.Model:
        """Train a simple neural network model"""
        print("Training Neural Network model...")
        
        # Build model
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu', input_shape=(X_train.shape[1],)),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        model.compile(
            optimizer='adam',
            loss='binary_crossentropy',
            metrics=['accuracy', 'AUC']
        )
        
        # Training callbacks
        early_stopping = tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=10, restore_best_weights=True
        )
        
        reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.2, patience=5, min_lr=0.001
        )
        
        # Train model
        history = model.fit(
            X_train, y_train,
            validation_data=(X_test, y_test),
            epochs=100,
            batch_size=32,
            callbacks=[early_stopping, reduce_lr],
            verbose=1
        )
        
        self.models['neural_network'] = model
        return model
    
    def evaluate_models(self, X_test: np.ndarray, y_test: np.ndarray) -> Dict[str, Dict]:
        """Evaluate all trained models"""
        results = {}
        
        for model_name, model in self.models.items():
            print(f"\nEvaluating {model_name}...")
            
            if model_name == 'neural_network':
                # Neural network predictions
                y_pred_proba = model.predict(X_test).flatten()
                y_pred = (y_pred_proba > 0.5).astype(int)
            else:
                # Scikit-learn models
                y_pred = model.predict(X_test)
                y_pred_proba = model.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            # Classification report
            report = classification_report(y_test, y_pred, output_dict=True)
            
            results[model_name] = {
                'auc_score': auc_score,
                'accuracy': report['accuracy'],
                'precision': report['1']['precision'],
                'recall': report['1']['recall'],
                'f1_score': report['1']['f1-score'],
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist()
            }
            
            print(f"AUC Score: {auc_score:.3f}")
            print(f"Accuracy: {report['accuracy']:.3f}")
            print(f"Precision: {report['1']['precision']:.3f}")
            print(f"Recall: {report['1']['recall']:.3f}")
            print(f"F1 Score: {report['1']['f1-score']:.3f}")
            
        return results
    
    def plot_feature_importance(self, model_name: str = 'random_forest'):
        """Plot feature importance for Random Forest model"""
        if model_name not in self.models:
            print(f"Model {model_name} not found")
            return
            
        model = self.models[model_name]
        
        if hasattr(model, 'feature_importances_'):
            # Create feature importance dataframe
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': model.feature_importances_
            }).sort_values('importance', ascending=False)
            
            # Plot top 20 features
            plt.figure(figsize=(10, 8))
            sns.barplot(data=importance_df.head(20), y='feature', x='importance')
            plt.title(f'Top 20 Feature Importances - {model_name.title()}')
            plt.tight_layout()
            plt.savefig(self.output_dir / f'{model_name}_feature_importance.png', dpi=300)
            plt.show()
    
    def save_models(self):
        """Save all trained models"""
        # Save scaler
        with open(self.output_dir / 'scaler.pkl', 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save feature names
        with open(self.output_dir / 'feature_names.json', 'w') as f:
            json.dump(self.feature_names, f)
        
        # Save scikit-learn models
        for model_name, model in self.models.items():
            if model_name != 'neural_network':
                with open(self.output_dir / f'{model_name}.pkl', 'wb') as f:
                    pickle.dump(model, f)
                print(f"Saved {model_name} model")
        
        # Save neural network model for TensorFlow.js
        if 'neural_network' in self.models:
            nn_model = self.models['neural_network']
            
            # Save in TensorFlow format first
            tf_model_path = self.output_dir / 'neural_network_tf'
            nn_model.save(tf_model_path)
            
            # Convert to TensorFlow.js format
            tfjs_model_path = self.output_dir / 'neural_network_tfjs'
            tfjs.converters.save_keras_model(nn_model, str(tfjs_model_path))
            print(f"Saved neural network model for TensorFlow.js: {tfjs_model_path}")
    
    def create_simple_js_model(self, model_name: str = 'random_forest') -> Dict:
        """Create a simplified JavaScript-compatible model"""
        if model_name not in self.models:
            print(f"Model {model_name} not found")
            return {}
        
        model = self.models[model_name]
        
        if model_name == 'random_forest':
            # Extract simple decision rules from Random Forest
            # This is a simplified approach - in practice you'd want more sophisticated conversion
            feature_importances = model.feature_importances_.tolist()
            
            js_model = {
                'type': 'simple_rules',
                'feature_names': self.feature_names,
                'feature_importances': feature_importances,
                'scaler_mean': self.scaler.mean_.tolist(),
                'scaler_scale': self.scaler.scale_.tolist(),
                'threshold': 0.5  # Decision threshold
            }
            
        elif model_name == 'logistic_regression':
            # Extract coefficients for logistic regression
            js_model = {
                'type': 'logistic_regression',
                'feature_names': self.feature_names,
                'coefficients': model.coef_[0].tolist(),
                'intercept': model.intercept_[0],
                'scaler_mean': self.scaler.mean_.tolist(),
                'scaler_scale': self.scaler.scale_.tolist()
            }
        
        # Save JavaScript model
        with open(self.output_dir / f'{model_name}_js.json', 'w') as f:
            json.dump(js_model, f, indent=2)
        
        print(f"Created JavaScript-compatible model: {model_name}_js.json")
        return js_model


def main():
    """Main training pipeline"""
    trainer = AdDetectorTrainer()
    
    # Check if features file exists
    features_path = "processed_data/features/combined_features.csv"
    if not os.path.exists(features_path):
        print(f"Features file not found: {features_path}")
        print("Please run video_processor.py first to extract features")
        return
    
    # Load features
    df = trainer.load_features(features_path)
    
    # Prepare data
    X_train, X_test, y_train, y_test = trainer.prepare_data(df)
    
    # Train models
    trainer.train_random_forest(X_train, y_train)
    trainer.train_logistic_regression(X_train, y_train)
    trainer.train_neural_network(X_train, y_train, X_test, y_test)
    
    # Evaluate models
    results = trainer.evaluate_models(X_test, y_test)
    
    # Save results
    with open(trainer.output_dir / 'evaluation_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    # Plot feature importance
    trainer.plot_feature_importance('random_forest')
    
    # Save models
    trainer.save_models()
    
    # Create JavaScript models
    trainer.create_simple_js_model('random_forest')
    trainer.create_simple_js_model('logistic_regression')
    
    print("\nTraining complete! Best model recommendations:")
    for model_name, metrics in results.items():
        print(f"{model_name}: AUC = {metrics['auc_score']:.3f}, F1 = {metrics['f1_score']:.3f}")


if __name__ == "__main__":
    main()