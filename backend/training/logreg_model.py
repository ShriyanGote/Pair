import pandas as pd
import numpy as np
import random
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score, accuracy_score

from help_functions import extract_features, jaccard_similarity, process_text, aggregate_group_profiles, get_group_profile

# ---------------------------
# 1. Load Data and Create User IDs
# ---------------------------
# Load profiles and add a user id if it doesn't exist.
profiles = pd.read_csv("Simulated_Profiles.csv")
if "user" not in profiles.columns:
    profiles["user"] = range(1, len(profiles) + 1)

# Load the user-likes data generated earlier.
likes = pd.read_csv("User_Likes.csv")

# ---------------------------
# 2. Build the Labeled Training Dataset
# ---------------------------
data_rows = []

# --- Positive Examples ---
# For every liked pair from "likes", compute features and assign label 1.
for _, row in likes.iterrows():
    user_id = row["user"]
    liked_user_id = row["liked_user"]
    user_profile = profiles.loc[profiles["user"] == user_id].iloc[0]
    candidate_profile = profiles.loc[profiles["user"] == liked_user_id].iloc[0]
    
    feats = extract_features(user_profile, candidate_profile)
    feats["label"] = 1
    feats["user"] = user_id
    feats["candidate"] = liked_user_id
    data_rows.append(feats)

# --- Negative Examples ---
# For each user in the likes file, sample one candidate (from same location and age criteria)
# that is not in the liked list.
users = likes["user"].unique()
for user_id in users:
    user_profile = profiles.loc[profiles["user"] == user_id].iloc[0]
    
    # Determine all possible candidates (excluding self)
    possible_candidates = profiles[profiles["user"] != user_id]
    # Filter candidates by matching location and age within ±5
    possible_candidates = possible_candidates[
        (possible_candidates["location"] == user_profile["location"]) & 
        (abs(possible_candidates["age"] - user_profile["age"]) <= 5)
    ]
    
    # Get already liked candidate IDs for this user.
    liked_ids = set(likes.loc[likes["user"] == user_id, "liked_user"])
    # Exclude already liked candidates.
    possible_candidates = possible_candidates[~possible_candidates["user"].isin(liked_ids)]
    
    if len(possible_candidates) == 0:
        continue  # Skip if no candidate available.
    
    # Randomly select one negative candidate.
    candidate_profile = possible_candidates.sample(1).iloc[0]
    feats = extract_features(user_profile, candidate_profile)
    feats["label"] = 0
    feats["user"] = user_id
    feats["candidate"] = candidate_profile["user"]
    data_rows.append(feats)

df_features = pd.DataFrame(data_rows)
print("Sample features:")
print(df_features.head())

# ---------------------------
# 3. Train/Test Split and Model Training
# ---------------------------
features = ["age_diff", "location_match", "past_activities_sim", "personality_sim", "occupation_match", "gender_match"]
X = df_features[features]
y = df_features["label"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Example model: Logistic Regression.
model = LogisticRegression(solver="liblinear")
# Alternatively, you can use:
# from sklearn.ensemble import RandomForestClassifier
# model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)
y_pred_prob = model.predict_proba(X_test)[:,1]
y_pred = model.predict(X_test)

auc = roc_auc_score(y_test, y_pred_prob)
acc = accuracy_score(y_test, y_pred)
print(f"\nLogistic Regression Model: Accuracy = {acc:.3f}, AUC = {auc:.3f}")

# ---------------------------
# 4. Predicting Best Matches for a Given Profile
# ---------------------------
def predict_matches_for_user(target_user_id, top_n=5):
    user_profile = profiles.loc[profiles["user"] == target_user_id].iloc[0]
    print("Target user profile:", user_profile.to_dict())
    
    # Choose candidates from the same location (assumed to be filtered already by the app)
    candidates = profiles[(profiles["user"] != target_user_id) & (profiles["location"] == user_profile["location"])]
    
    candidate_list = []
    for _, cand in candidates.iterrows():
        feat_dict = extract_features(user_profile, cand)
        feat_vector = np.array([
            feat_dict["age_diff"],
            feat_dict["location_match"],
            feat_dict["past_activities_sim"],
            feat_dict["personality_sim"],
            feat_dict["occupation_match"],
            feat_dict["gender_match"]
        ]).reshape(1, -1)
        prob = model.predict_proba(feat_vector)[0,1]
        candidate_list.append((cand["user"], prob))
    
    # Sort candidates by predicted probability in descending order.
    candidate_list.sort(key=lambda x: x[1], reverse=True)
    return candidate_list[:top_n]

# Example usage: predict top 100 matches for a given user (e.g., user with id 893).
top_matches = predict_matches_for_user(target_user_id=100, top_n=100)
print("\nTop 100 predicted matches for user 893:")
for cand, score in top_matches:
    profile_cand = profiles.loc[profiles["user"] == cand].iloc[0]
    print(f"User {cand} (Score: {score:.3f}) - Profile: {profile_cand.to_dict()}")