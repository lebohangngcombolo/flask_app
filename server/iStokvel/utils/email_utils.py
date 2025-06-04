from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
import random
import string
from flask import current_app

def generate_verification_code():
    """Generate a 6-digit verification code"""
    return ''.join(random.choices(string.digits, k=6))

def send_verification_email(to_email, verification_code):
    """Send verification email using SendGrid"""
    try:
        # Debug prints
        print("\n=== SendGrid Debug Start ===")
        print(f"1. Input parameters:")
        print(f"   - to_email: {to_email}")
        print(f"   - verification_code: {verification_code}")
        
        # Validate email format
        if not to_email or '@' not in to_email:
            print("ERROR: Invalid recipient email format")
            return False, "Invalid email format"
            
        # Check configuration
        print("\n2. Configuration check:")
        api_key = current_app.config.get('SENDGRID_API_KEY')
        from_email = current_app.config.get('SENDGRID_FROM_EMAIL')
        
        print(f"   - API Key present: {'Yes' if api_key else 'No'}")
        print(f"   - API Key length: {len(api_key) if api_key else 0}")
        print(f"   - From Email present: {'Yes' if from_email else 'No'}")
        print(f"   - From Email value: {from_email}")
        
        if not api_key:
            print("ERROR: SENDGRID_API_KEY is not configured")
            return False, "SendGrid API key is not configured"
            
        if not from_email:
            print("ERROR: SENDGRID_FROM_EMAIL is not configured")
            return False, "Sender email is not configured"
            
        if '@' not in from_email:
            print("ERROR: Invalid sender email format")
            return False, "Invalid sender email format"
            
        # Initialize SendGrid
        print("\n3. Initializing SendGrid:")
        try:
            sg = SendGridAPIClient(api_key)
            print("   - SendGrid client initialized successfully")
        except Exception as e:
            print(f"   - Error initializing SendGrid: {str(e)}")
            return False, f"SendGrid initialization failed: {str(e)}"
            
        # Create email
        print("\n4. Creating email:")
        try:
            from_email_obj = Email(from_email)
            subject = "Verify your iStokvel account"
            content = Content("text/plain", f"Your verification code is: {verification_code}")
            mail = Mail(from_email_obj, subject, [To(to_email)], content)
            print("   - Email object created successfully")
        except Exception as e:
            print(f"   - Error creating email object: {str(e)}")
            return False, f"Failed to create email: {str(e)}"
            
        # Send email
        print("\n5. Sending email:")
        try:
            response = sg.send(mail)
            print(f"   - SendGrid response status code: {response.status_code}")
            print(f"   - SendGrid response headers: {response.headers}")
            print(f"   - SendGrid response body: {response.body}")
            return True, "Email sent successfully"
        except Exception as e:
            print(f"   - Error sending email: {str(e)}")
            import traceback
            traceback.print_exc()
            return False, f"Failed to send email: {str(e)}"
            
    except Exception as e:
        print("\n=== Unexpected Error ===")
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False, str(e)
    finally:
        print("=== SendGrid Debug End ===\n")
