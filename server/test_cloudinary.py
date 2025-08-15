#!/usr/bin/env python3
"""
Test script to verify Cloudinary integration
Run this script to test if Cloudinary is properly configured
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_cloudinary_config():
    """Test if Cloudinary configuration is properly set up"""
    print("Testing Cloudinary Configuration...")
    
    # Check if environment variables are set
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    print(f"Cloud Name: {'✓ Set' if cloud_name and cloud_name != 'your_cloud_name_here' else '✗ Not set or default'}")
    print(f"API Key: {'✓ Set' if api_key and api_key != 'your_api_key_here' else '✗ Not set or default'}")
    print(f"API Secret: {'✓ Set' if api_secret and api_secret != 'your_api_secret_here' else '✗ Not set or default'}")
    
    if not all([cloud_name, api_key, api_secret]) or any([
        cloud_name == 'your_cloud_name_here',
        api_key == 'your_api_key_here', 
        api_secret == 'your_api_secret_here'
    ]):
        print("\n❌ Cloudinary configuration is incomplete!")
        print("Please update your .env file with your actual Cloudinary credentials:")
        print("CLOUDINARY_CLOUD_NAME=your_actual_cloud_name")
        print("CLOUDINARY_API_KEY=your_actual_api_key")
        print("CLOUDINARY_API_SECRET=your_actual_api_secret")
        return False
    
    # Test Cloudinary import
    try:
        import cloudinary
        import cloudinary.uploader
        import cloudinary.api
        print("✓ Cloudinary Python SDK imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Cloudinary: {e}")
        print("Please install cloudinary: pip install cloudinary")
        return False
    
    # Test Cloudinary configuration
    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret
        )
        print("✓ Cloudinary configuration applied successfully")
    except Exception as e:
        print(f"✗ Failed to configure Cloudinary: {e}")
        return False
    
    print("\n✅ Cloudinary configuration test passed!")
    return True

if __name__ == "__main__":
    success = test_cloudinary_config()
    sys.exit(0 if success else 1) 