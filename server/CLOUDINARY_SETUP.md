# Cloudinary Integration Setup Guide

This guide will help you set up Cloudinary for KYC document storage in your Flask application.

## Prerequisites

- Python 3.7+
- Flask application running
- Ubuntu WSL terminal

## Step 1: Install Cloudinary Python SDK

Run this command in your Ubuntu WSL terminal:

```bash
cd /c/Users/SiphoM/Documents/Mastar/server
pip install cloudinary
```

## Step 2: Create Cloudinary Account

1. Go to [cloudinary.com](https://cloudinary.com)
2. Click "Sign Up" and create a free account
3. After signing up, go to your Dashboard
4. Note down your credentials:
   - **Cloud Name** (found in the dashboard)
   - **API Key** (found in the dashboard)
   - **API Secret** (found in the dashboard)

## Step 3: Configure Environment Variables

Create a `.env` file in your server directory:

```bash
cd /c/Users/SiphoM/Documents/Mastar/server
nano .env
```

Add the following content (replace with your actual credentials):

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret

# Other existing environment variables can be added here
```

Save the file (Ctrl+X, then Y, then Enter).

## Step 4: Test Configuration

Run the test script to verify your setup:

```bash
python test_cloudinary.py
```

You should see:
```
Testing Cloudinary Configuration...
Cloud Name: ✓ Set
API Key: ✓ Set
API Secret: ✓ Set
✓ Cloudinary Python SDK imported successfully
✓ Cloudinary configuration applied successfully

✅ Cloudinary configuration test passed!
```

## Step 5: Start Your Flask Application

```bash
python app.py
```

## What's Changed

### Database Changes
- KYC document paths now store Cloudinary URLs instead of local file paths
- All new uploads will be stored in Cloudinary under the `kyc_docs` folder
- Existing local files will continue to work (backward compatibility)

### API Changes
- `/api/kyc/update` - Now uploads files to Cloudinary
- `/api/kyc/submit` - Now uploads files to Cloudinary
- `/api/kyc/document/<filename>` - Now returns Cloudinary URLs
- `/uploads/kyc_docs/<filename>` - Now handles Cloudinary URLs

### File Structure in Cloudinary
Files will be organized as:
```
kyc_docs/
├── user_id_1/
│   ├── documents.idDocument_20241201_143022.pdf
│   ├── documents.proofOfAddress_20241201_143023.jpg
│   ├── documents.proofOfIncome_20241201_143024.pdf
│   └── documents.bankStatement_20241201_143025.pdf
└── user_id_2/
    └── ...
```

## Testing the Integration

1. Start your Flask application
2. Go to your KYC page in the frontend
3. Upload a document
4. Check the console logs - you should see:
   ```
   Uploaded to Cloudinary: https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/kyc_docs/user_id/documents.idDocument_20241201_143022.pdf
   ```
5. Check your Cloudinary dashboard to see the uploaded files

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure you installed cloudinary with `pip install cloudinary`

2. **Configuration Error**: Verify your `.env` file has the correct credentials

3. **Upload Failed**: Check your Cloudinary account limits (free tier has limits)

4. **File Not Found**: The system maintains backward compatibility with local files

### Debug Commands

```bash
# Test Cloudinary configuration
python test_cloudinary.py

# Check if .env file exists
ls -la .env

# View .env file content (be careful with sensitive data)
cat .env

# Check Python packages
pip list | grep cloudinary
```

## Security Notes

- Never commit your `.env` file to version control
- Keep your API secret secure
- Consider using environment variables in production
- Cloudinary URLs are secure and can be made private if needed

## Production Considerations

1. **Environment Variables**: Use proper environment variables in production
2. **Error Handling**: Add more robust error handling for upload failures
3. **File Cleanup**: Consider implementing cleanup for old local files
4. **Monitoring**: Monitor Cloudinary usage and costs
5. **Backup**: Consider implementing backup strategies for critical documents

## Support

If you encounter issues:
1. Check the Cloudinary documentation: https://cloudinary.com/documentation
2. Verify your credentials in the Cloudinary dashboard
3. Check the Flask application logs for error messages
4. Test with the provided test script 