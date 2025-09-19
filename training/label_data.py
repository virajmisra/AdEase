import pandas as pd

# Load your collected data
df = pd.read_csv("data/collected_features.csv")

# Create label column if it doesn't exist
if "label" not in df.columns:
    df["label"] = "program"  # default everything to program

# Define ad ranges (start_index, end_index)
ad_ranges = [
    (344,1103)
]

# Apply labels based on ranges
for start, end in ad_ranges:
    df.loc[(df["sampleIndex"] >= start) & (df["sampleIndex"] <= end), "label"] = "ad"

# Save the updated CSV
df.to_csv("data/labeled_features.csv", index=False)

print("✅ Done! Labeled CSV saved as labeled_features.csv")
print(df["label"].value_counts())
