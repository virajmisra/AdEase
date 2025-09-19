import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
df = pd.read_csv("data/combined_features.csv")

print("Dataset shape:", df.shape)
print("Class balance:\n", df['label'].value_counts())

# Select numeric features only
numeric_features = df.select_dtypes(include=['float64', 'int64']).columns

# Plot feature distributions for ads vs program
for feature in numeric_features:
    plt.figure(figsize=(8, 4))
    sns.kdeplot(data=df, x=feature, hue="label", common_norm=False, fill=True)
    plt.title(f"Distribution of {feature} by Label")
    plt.tight_layout()
    plt.show()

# Optional: correlation heatmap
plt.figure(figsize=(10, 8))
corr = df[numeric_features].corr()
sns.heatmap(corr, annot=False, cmap="coolwarm", center=0)
plt.title("Feature Correlation Heatmap")
plt.tight_layout()
plt.show()
