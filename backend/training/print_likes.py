import pandas as pd

# -------------------------------
# 1. Load the simulated profiles CSV
# -------------------------------
# The CSV is assumed to have the columns:
# age, ethnicity, gender, location, personality, past_activities, occupation, social_media_use

profiles = pd.read_csv("Simulated_Profiles.csv")

# Check if a "user" column exists; if not, add one with sequential IDs.
if "user" not in profiles.columns:
    profiles["user"] = range(1, len(profiles) + 1)

# -------------------------------
# 2. Load the generated user-likes CSV
# -------------------------------
likes = pd.read_csv("User_Likes.csv")

# -------------------------------
# 3. Select the first 20 unique users from the likes file
# -------------------------------
unique_users = sorted(likes["user"].unique())
first_20_users = unique_users[:20]

# -------------------------------
# 4. For each user, print out the user's full profile and the first 5 liked profiles.
# -------------------------------
for user_id in first_20_users:
    # Get the profile for this user from the profiles DataFrame
    user_profile = profiles[profiles["user"] == user_id]
    print(f"\n{'='*60}\nProfile for User {user_id}:\n{'='*60}")
    print(user_profile.to_string(index=False))
    
    # Get the first 5 liked user IDs for this user
    user_likes = likes[likes["user"] == user_id].head(5)
    
    # For each liked user, print their profile details.
    for i, liked in user_likes.iterrows():
        liked_id = liked["liked_user"]
        liked_profile = profiles[profiles["user"] == liked_id]
        print(f"\n--- Liked Profile (User {liked_id}) ---")
        print(liked_profile.to_string(index=False))