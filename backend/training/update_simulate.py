import pandas as pd
import random
import uuid
import hashlib

# Load your CSV
df = pd.read_csv("Simulated_Profiles.csv")

    
# Define new fields
def generate_name():
    first = random.choice(["Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Skylar", "Jamie", "Avery", "Reese", "Plower", "Aiden", "Matthew", "Lamelo", "Ball", "Lonzo", "Liangelo", "LeBron", "Stephen", "Curry", "Paul", "George"])
    last = random.choice(["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Gote", "Patel", "Kavuri", "Lota", "Temp"])
    return f"{first} {last}"

def generate_email(name):
    base = name.lower().replace(" ", ".")
    domain = random.choice(["gmail.com"])
    number = random.choice([i for i in range(50)])
    return f"{base}{number}@{domain}"

def hash_password():
    return hashlib.sha256(uuid.uuid4().hex.encode()).hexdigest()

def generate_height():
    return random.randint(150, 200)

interests_options = [
    "movies_tv", "gaming", "photography", "fashion", "writing", "nature", "animals", "volunteering",
    "history", "science", "cars_motorcycles", "podcasts", "crafts_diy", "spirituality", "board_games",
    "languages", "politics", "comedy", "entrepreneurship", "collecting"
]

personality_options = [
    "Curious", "Empathetic", "Adventurous", "Thoughtful", "Creative", "Analytical", "Spontaneous",
    "Organized", "Playful", "Calm", "Driven", "Loyal", "Independent", "Funny", "Romantic",
    "Open-Minded", "Optimistic", "Realistic", "Cautious", "Chill"
]

def generate_user_type():
    type = random.choice(["uno", "uno", "uno", "uno", "uno", "duo", "duo", "group", "group", "duo"])
    return f"{type}"
# Fill in new columns
df["id"] = [i for i in range(len(df))]
df["name"] = [generate_name() for _ in range(len(df))]
df['email'] = [f"user{i+1}@gmail.com" for i in range(len(df))]
df["hashed_password"] = None
df["interests"] = [random.sample(interests_options, k=random.randint(2, 5)) for _ in range(len(df))]
df["personality"] = [random.sample(personality_options, k=random.randint(1, 3)) for _ in range(len(df))]
df["profile_type"] = [generate_user_type() for _ in range(len(df))]
df["height"] = [generate_height() for _ in range(len(df))]
df["profile_photo"] = None
df["bio"] = None
df["is_verified"] = False
df["verification_code"] = None
df["looking_for"] = None

# Reorder columns to match DB schema
final_cols = [
    "id", "name", "email", "hashed_password", "bio", "interests", "gender", "location", "profile_type",
    "profile_photo", "is_verified", "verification_code", "looking_for",
    "ethnicity", "social_media_use", "past_activities", "personality", "occupation", "height"
]
df = df[final_cols]

# Save new CSV
df.to_csv("Updated_Simulated_Profiles.csv", index=False)
print("✅ CSV updated and saved as 'Updated_Simulated_Profiles.csv'")