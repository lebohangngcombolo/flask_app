import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    # Cloudinary Configuration
    CLOUDINARY_CLOUD_NAME = os.getenv('CLOUDINARY_CLOUD_NAME', 'your_cloud_name_here')
    CLOUDINARY_API_KEY = os.getenv('CLOUDINARY_API_KEY', 'your_api_key_here')
    CLOUDINARY_API_SECRET = os.getenv('CLOUDINARY_API_SECRET', 'your_api_secret_here')
    
    # Other Flask configurations
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False 