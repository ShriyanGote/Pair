# from openai import OpenAI
# import os


# client = OpenAI(api_key=OPENAI_API_KEY)

# instructions = input('Enter some instructions: ')
# prompt = input("Enter a prompt: ")

# response = client.chat.completions.create(
#     model="gpt-4",
#     messages=[
#         {"role": "system", "content": instructions},
#         {"role": "user", "content": prompt}
#     ]
# )

# print(response.choices[0].message.content)


import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables from .env file
load_dotenv()
# Configure Gemini
genai.configure(api_key=os.environ["GOOGLE_GEN_AI_API_KEY"])
# Use the model
model = genai.GenerativeModel(model_name="gemini-1.5-flash")
response = model.generate_content("Give only the output in comma seperated list. From the bio given and the list of activities list all activities correlated with the bio. bio: i am interested in outdoor activities antime. activities: Basketball, Soccer, Cooking, Running, Spikeball, Table Tennis, Sleeping, Coding, Boxing, Swimming, Gymnastics, Field Hockey, Rugby")
print(response.text)