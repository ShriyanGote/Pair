import pandas as pd
import numpy as np
from collections import Counter

# Weight constants for feature engineering
AGE_WEIGHT = 4           # Increase weight for age difference
LOCATION_WEIGHT = 1
PAST_ACTIVITIES_WEIGHT = 2
PERSONALITY_WEIGHT = 2
OCCUPATION_WEIGHT = 1
GENDER_WEIGHT = 0.5

def jaccard_similarity(set1, set2):
    intersection = set1.intersection(set2)
    union = set1.union(set2)
    return 0 if not union else len(intersection) / len(union)

def process_text(s):
    """
    same type string
    """
    return set(str(s).lower().replace(" ", "").split(','))

def extract_features(user_profile, candidate_profile):
    """
    Compute weighted features for a pair of profiles:
      - age_diff: weighted absolute difference in ages.
      - location_match: weighted flag if locations match exactly.
      - past_activities_sim: weighted Jaccard similarity on past_activities.
      - personality_sim: weighted Jaccard similarity on personality.
      - occupation_match: weighted flag if the occupation strings match (ignoring case).
      - gender_match: weighted flag if genders match (ignoring case).
    """
    # Age difference
    age_diff = AGE_WEIGHT * abs(user_profile["age"] - candidate_profile["age"])
    
    # Location match flag
    location_match = LOCATION_WEIGHT * (1 if user_profile["location"] == candidate_profile["location"] else 0)

    # Past activities similarity (used as a proxy for interests)
    activities1 = process_text(user_profile["past_activities"])
    activities2 = process_text(candidate_profile["past_activities"])
    past_activities_sim = PAST_ACTIVITIES_WEIGHT * jaccard_similarity(activities1, activities2)
    
    # Personality similarity
    personality1 = process_text(user_profile["personality"])
    personality2 = process_text(candidate_profile["personality"])
    personality_sim = PERSONALITY_WEIGHT * jaccard_similarity(personality1, personality2)
    
    # Occupation match flag (ignoring case and extra spaces)
    occ1 = str(user_profile["occupation"]).strip().lower()
    occ2 = str(candidate_profile["occupation"]).strip().lower()
    occupation_match = OCCUPATION_WEIGHT * (1 if (occ1 and occ2 and occ1 == occ2) else 0)
    
    # Gender match flag (ignoring case and extra spaces)
    g1 = str(user_profile["gender"]).strip().lower()
    g2 = str(candidate_profile["gender"]).strip().lower()
    gender_match = GENDER_WEIGHT * (1 if g1 == g2 else 0)

    return {
        "age_diff": age_diff,
        "location_match": location_match,
        "past_activities_sim": past_activities_sim,
        "personality_sim": personality_sim,
        "occupation_match": occupation_match,
        "gender_match": gender_match
    }

def aggregate_group_profiles(profiles_list):
    """
    compute group and duo profiles
    """
    group_profile = {}
    # For numeric attributes, use average.
    group_profile['age'] = sum(p['age'] for p in profiles_list) / len(profiles_list)
    group_profile['social_media_use'] = sum(p['social_media_use'] for p in profiles_list) / len(profiles_list)

    # For categorical attributes, take the mode.
    for attr in ['personality', 'ethnicity', 'gender', 'occupation']:
        values = [p[attr] for p in profiles_list]
        count = Counter(values)
        mode_val, _ = count.most_common(1)[0]
        group_profile[attr] = mode_val
    
    # For shared attributes, assume they're common and take from the first member.
    group_profile['past_activities'] = profiles_list[0]['past_activities']
    group_profile['location'] = profiles_list[0]['location']
    
    return group_profile

def get_group_profile(profiles_df, user_ids):
    """
    given user ids, return group profile
    """
    profiles_list = [profiles_df.loc[profiles_df["user"] == uid].iloc[0].to_dict() for uid in user_ids]
    return aggregate_group_profiles(profiles_list)