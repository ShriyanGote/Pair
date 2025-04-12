import pandas as pd
import numpy as np

# ---------------------------
# 1. Load the dataset and add a user_id
# ---------------------------
# The CSV is assumed to have columns:
# age, ethnicity, gender, location, personality, past_activities, occupation, social_media_use
df = pd.read_csv("Simulated_Profiles.csv")

# Add a unique user ID column; here we're using sequential numbers starting at 1.
df["user"] = range(1, len(df) + 1)
print("Columns after adding user_id:", df.columns.tolist())

# ---------------------------
# 2. Helper Functions
# ---------------------------

def jaccard_similarity(set1, set2):
    """Compute the Jaccard similarity between two sets."""
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return 0 if not union else len(intersection) / len(union)

def compute_similarity(row1, row2):
    """
    Computes a similarity score between two user profiles using:
      - Interests similarity from 'past_activities'
      - Gender similarity (1 if same, 0 otherwise)
      - Age similarity as 1 / (1 + |age difference|)
      - Personality similarity (computed via Jaccard similarity)
      - An optional ethnicity bonus (1 if same, 0 otherwise)
    
    Weights can be manually tweaked:
      - w_interests: weight for past_activities similarity
      - w_gender: weight for gender similarity
      - w_age: weight for age similarity
      - w_personality: weight for personality similarity
      - w_ethnicity: weight for ethnicity bonus (optional)
    """
    # Weights (adjust as desired)
    w_interests = 0.25
    w_gender = 0.2
    w_age = 0.35
    w_personality = 0.2
    w_ethnicity = 0.1  # optional bonus weight
    
    # Interests similarity (using past_activities, assumed comma-separated)
    activities1 = set(str(row1["past_activities"]).lower().replace(" ", "").split(','))
    activities2 = set(str(row2["past_activities"]).lower().replace(" ", "").split(','))
    interests_sim = jaccard_similarity(activities1, activities2)
    
    # Gender similarity: 1 if same, 0 otherwise.
    gender_sim = 1 if str(row1["gender"]).strip().lower() == str(row2["gender"]).strip().lower() else 0

    # Age similarity: using 1/(1 + age difference)
    age_diff = abs(row1["age"] - row2["age"])
    age_sim = 1 / (1 + age_diff)
    
    # Personality similarity (assumed comma-separated)
    personality1 = set(str(row1["personality"]).lower().replace(" ", "").split(','))
    personality2 = set(str(row2["personality"]).lower().replace(" ", "").split(','))
    personality_sim = jaccard_similarity(personality1, personality2)
    
    # Optional ethnicity bonus (not mandatory but a slight bonus if matching)
    ethnicity_bonus = 1 if row1["ethnicity"] == row2["ethnicity"] else 0

    score = (w_interests * interests_sim +
             w_gender * gender_sim +
             w_age * age_sim +
             w_personality * personality_sim +
             w_ethnicity * ethnicity_bonus)
    return score

# ---------------------------
# 3. Compute Matches for Each User
# ---------------------------
results = []

# Loop through each user profile in the DataFrame.
for idx, row in df.iterrows():
    user_id = row["user"]
    candidate_scores = []
    
    # Compare this user with every other user
    for jdx, candidate in df.iterrows():
        if idx == jdx:
            continue  # Skip self-comparison
            
        score = compute_similarity(row, candidate)
        candidate_scores.append((candidate["user"], score))
    
    if not candidate_scores:
        continue
    
    # Sort candidates by similarity score (highest first) and pick the top 15.
    candidate_scores.sort(key=lambda x: x[1], reverse=True)
    chosen_candidates = candidate_scores[:15]
    
    # Record each match (each pair is an instance of "user likes liked_user")
    for liked in chosen_candidates:
        results.append({"user": user_id, "liked_user": liked[0]})

# ---------------------------
# 4. Output the Results
# ---------------------------
df_results = pd.DataFrame(results)
df_results.to_csv("User_Likes.csv", index=False)
print("New CSV file 'User_Likes.csv' has been created with", len(df_results), "rows.")