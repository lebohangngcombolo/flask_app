from flask import Flask, request, jsonify, Response, make_response, send_file, Blueprint, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from functools import wraps
import click
from flask.cli import with_appcontext
from datetime import datetime, timedelta
from sqlalchemy import func
from dotenv import load_dotenv
import os
from flask_jwt_extended import (
    JWTManager, 
    jwt_required, 
    create_access_token, 
    get_jwt_identity,
)
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Mail, Message
import random
import requests
import logging
import string
import time
from iStokvel.utils.email_utils import send_verification_email
from flask_migrate import Migrate
from twilio.rest import Client
import phonenumbers
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import event
from sqlalchemy.engine import Engine
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from openai import OpenAI
import uuid
import openai

# Load environment variables from .env file
load_dotenv()

# Config
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:Ayanda%4023@172.20.64.1:5432/stokvel_db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT')) if os.getenv('MAIL_PORT') else None
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['SENDGRID_API_KEY'] = os.getenv('SENDGRID_API_KEY')
app.config['SENDGRID_FROM_EMAIL'] = os.getenv('SENDGRID_FROM_EMAIL')

# Add JWT configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-jwt-secret-key')  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token expires in 1 hour
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# -------------------- INITIALIZE EXTENSIONS --------------------
db = SQLAlchemy(app)
mail = Mail(app)
migrate = Migrate(app, db)
jwt = JWTManager(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------- CORS SETUP --------------------
CORS(app, origins="http://localhost:5173", supports_credentials=True)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
CORS(app, resources={r"/admin/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)

# -------------------- UTILITY FUNCTIONS --------------------
def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

def send_verification_sms(phone_number, otp_code):
    """Send verification SMS with OTP"""
    account_sid = os.getenv('TWILIO_ACCOUNT_SID')
    auth_token = os.getenv('TWILIO_AUTH_TOKEN')
    from_number = os.getenv('TWILIO_PHONE_NUMBER')
    if not all([account_sid, auth_token, from_number]):
        print("Twilio credentials are not set in environment variables.")
        return False, "Twilio credentials missing"
    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=f"Your iStokvel verification code is: {otp_code}",
            from_=from_number,
            to=phone_number
        )
        print(f"Sent SMS to {phone_number}: {message.sid}")
        return True, "SMS sent"
    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False, str(e)

def generate_group_code(length=6):
    """Generate a random alphanumeric group code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def normalize_phone(phone):
    # Remove spaces, dashes, etc.
    phone = phone.replace(' ', '').replace('-', '')
    # Convert +27... to 0... for lookup if your DB uses 0...
    if phone.startswith('+27'):
        phone = '0' + phone[3:]
    return phone

# -------------------- MODELS --------------------
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='member')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    profile_picture = db.Column(db.String(200))
    gender = db.Column(db.String(10))
    employment_status = db.Column(db.String(100))
    is_verified = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    two_factor_method = db.Column(db.String(10), default='email')  # 'email' or 'sms'
    otps = db.relationship('OTP', backref='user', lazy=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verification_code = db.Column(db.String(6), nullable=True)
    verification_code_expiry = db.Column(db.DateTime, nullable=True)
    date_of_birth = db.Column(db.Date, nullable=True)
    sessions = db.relationship('UserSession', backref='user', lazy=True, cascade="all, delete-orphan")
    _table_args_ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def generate_verification(self):
        """Generate and save new verification code"""
        from iStokvel.utils.email_utils import generate_verification_code
        self.verification_code = generate_verification_code()
        self.verification_code_expiry = datetime.utcnow() + timedelta(minutes=10)
        db.session.commit()
        return self.verification_code

class StokvelGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    tier = db.Column(db.String(20), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    contribution_amount = db.Column(db.Float, nullable=False)  # <-- ADD THIS LINE
    rules = db.Column(db.String(255))
    benefits = db.Column(db.ARRAY(db.String))
    description = db.Column(db.Text)
    frequency = db.Column(db.String(50), nullable=False)
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    group_code = db.Column(db.String(10), unique=True)
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    members = db.relationship('StokvelMember', backref='group', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contribution_amount': float(self.amount),
            'frequency': self.frequency,
            'max_members': self.max_members,
            'member_count': len(self.members),
            'group_code': self.group_code,
            'admin_id': self.admin_id,
            'created_at': self.created_at.isoformat()
        }

class StokvelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
    role = db.Column(db.String(20), default='member')  # member, admin
    user = db.relationship('User', backref='memberships')

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, rejected
    member = db.relationship('StokvelMember', backref='contributions')

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='active')  # active, closed
    group = db.relationship('StokvelGroup', backref='polls')

class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    votes = db.Column(db.Integer, default=0)
    poll = db.relationship('Poll', backref='options')

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='scheduled')  # scheduled, completed, cancelled
    group = db.relationship('StokvelGroup', backref='meetings')

class WithdrawalRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, approved, rejected
    approvals_needed = db.Column(db.Integer, default=2)
    approvals_received = db.Column(db.Integer, default=0)
    member = db.relationship('StokvelMember', backref='withdrawal_requests')

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='wallet')

class NotificationSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    email_announcements = db.Column(db.Boolean, default=True)
    email_stokvel_updates = db.Column(db.Boolean, default=True)
    email_marketplace_offers = db.Column(db.Boolean, default=False)
    push_announcements = db.Column(db.Boolean, default=True)
    push_stokvel_updates = db.Column(db.Boolean, default=True)
    push_marketplace_offers = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='notification_settings')

class UserPreferences(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    language = db.Column(db.String(10), default='en')
    currency = db.Column(db.String(3), default='ZAR')
    theme = db.Column(db.String(10), default='light')
    data_for_personalization = db.Column(db.Boolean, default=True)
    data_for_analytics = db.Column(db.Boolean, default=True)
    data_for_third_parties = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='preferences')

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(50), default='general')  # kyc_required, approved, rejected, etc.
    data = db.Column(db.JSON)  # Additional data like group_id, join_request_id
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime)
    is_used = db.Column(db.Boolean, default=False)

    def is_valid(self):
        return datetime.utcnow() < self.expires_at and not self.is_used

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)


#---------------------------------------------------------------------------new models-----------------------------------

class Conversation(db.Model):
    __tablename__ = 'conversations'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    title = db.Column(db.String(200))
    is_stokvel_related = db.Column(db.Boolean, default=False)
    stokvel_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship('Message', backref='conversation', lazy=True, cascade='all, delete-orphan')


class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = db.Column(db.String(36), db.ForeignKey('conversations.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user', 'assistant'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)

#------------------------------------------------------------------------------------------

class KYCVerification(db.Model):
    __tablename__ = 'kyc_verification'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    full_name = db.Column(db.String(100))
    date_of_birth = db.Column(db.Date)
    id_number = db.Column(db.String(20))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    employment_status = db.Column(db.String(50))
    employer_name = db.Column(db.String(100))
    street_address = db.Column(db.String(200))
    city = db.Column(db.String(100))
    province = db.Column(db.String(100))
    postal_code = db.Column(db.String(10))
    country = db.Column(db.String(100))
    monthly_income = db.Column(db.Float)
    income_source = db.Column(db.String(50))
    employment_type = db.Column(db.String(50))
    bank_name = db.Column(db.String(100))
    account_number = db.Column(db.String(20))
    account_type = db.Column(db.String(20))
    branch_code = db.Column(db.String(10))
    id_document_path = db.Column(db.String(200))
    proof_of_address_path = db.Column(db.String(200))
    proof_of_income_path = db.Column(db.String(200))
    bank_statement_path = db.Column(db.String(200))
    verification_date = db.Column(db.DateTime)
    rejection_reason = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# -------------------- DECORATORS --------------------
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = User.query.get(current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
        
        # SECURITY FIX: Check if user is verified
        if not current_user.is_verified:
            return jsonify({'error': 'Please verify your email address to access this feature'}), 403
            
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        try:
            token = token.split(' ')[1]  # Remove 'Bearer ' prefix
            payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user = User.query.get(payload['user_id'])
            
            if not user:
                return jsonify({'error': 'User not found'}), 401
            
            # SECURITY FIX: Check if user is verified
            if not user.is_verified:
                return jsonify({'error': 'Please verify your email address to access this feature'}), 403
            
            if user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
            
    return decorated_function

def role_required(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            if not token:
                return jsonify({'error': 'No token provided'}), 401
            
            try:
                token = token.split(' ')[1]  # Remove 'Bearer ' prefix
                payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user = User.query.get(payload['user_id'])
                
                if not user:
                    return jsonify({'error': 'User not found'}), 401
                
                # SECURITY FIX: Check if user is verified
                if not user.is_verified:
                    return jsonify({'error': 'Please verify your email address to access this feature'}), 403
                
                if user.role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                    
                return f(*args, **kwargs)
            except jwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired'}), 401
            except jwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
                
        return decorated_function
    return decorator

# -------------------- ROUTES --------------------


@app.route('/api/test', methods=['GET'])
def test():
    logger.debug('Test route accessed')
    return jsonify({"message": "Server is working!"}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name')
        phone = data.get('phone')

        # Check if user already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400

        # Create new user
        user = User(
            email=email,
            full_name=full_name,
            phone=phone,
            role='member'
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        # Generate and send verification code with better error handling
        try:
            verification_code = user.generate_verification()
            print(f"Generated verification code: {verification_code} for user: {email}")
            
            success, message = send_verification_email(user.email, verification_code)
            print(f"Email sending result - Success: {success}, Message: {message}")
            
            if not success:
                print(f"Warning: Failed to send verification email: {message}")
                # Still return success but with a warning
                return jsonify({
                    'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                    'email': user.email,
                    'user_id': user.id,
                    'email_sent': False
                }), 201
            else:
                return jsonify({
                    'message': 'Registration successful. Please check your email for verification code.',
                    'email': user.email,
                    'user_id': user.id,
                    'email_sent': True
                }), 201
                
        except Exception as email_e:
            print(f"Warning: Exception during verification email sending: {str(email_e)}")
            import traceback
            traceback.print_exc()
            # Still return success but with a warning
            return jsonify({
                'message': 'Account created successfully, but verification email failed to send. Please try resending.',
                'email': user.email,
                'user_id': user.id,
                'email_sent': False
            }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error during registration: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'An unexpected error occurred during registration'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    # SECURITY FIX: Check if user is verified before allowing login
    if not user.is_verified:
        return jsonify({'error': 'Please verify your email address before logging in'}), 401

    if user.two_factor_enabled:
        otp_code = generate_otp()
        expiry = datetime.utcnow() + timedelta(minutes=10)
        otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
        db.session.add(otp)
        db.session.commit()
        if user.two_factor_method == 'sms':
            send_verification_sms(user.phone, otp_code)
        else:
            send_verification_email(user.email, otp_code)
        return jsonify({'message': '2FA code sent', 'user_id': user.id, 'two_factor_required': True}), 200

    access_token = create_access_token(identity=str(user.id))

    user_agent = request.headers.get('User-Agent', 'Unknown')
    ip_address = request.remote_addr or 'Unknown'
    session = UserSession(
        user_id=user.id,
        user_agent=user_agent,
        ip_address=ip_address
    )
    db.session.add(session)
    db.session.commit()

    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "gender": user.gender,
        "employment_status": user.employment_status,
        "is_verified": user.is_verified,
        "two_factor_enabled": user.two_factor_enabled
    }
    return jsonify({
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "user": user_data
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'name': current_user.full_name,
        'email': current_user.email,
        'role': current_user.role,
        'profilePicture': current_user.profile_picture
    })

@app.route('/api/admin/groups', methods=['GET'])
@token_required
def get_admin_groups(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    groups = StokvelGroup.query.all()
    groups_data = []
    for group in groups:
        groups_data.append({
            'id': group.id,
            'name': group.name,
            'description': group.description,
            'tier': group.tier,
            'contribution_amount': float(group.amount),
            'frequency': group.frequency,
            'max_members': group.max_members,
            'is_active': getattr(group, 'is_active', True),
            'created_at': group.created_at.isoformat() if group.created_at else None,
            'member_count': len(group.members) if hasattr(group, 'members') else 0,
            'group_code': group.group_code  # <-- ADD THIS LINE
        })
    return jsonify(groups_data), 200

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user):
    # Your implementation here
    pass

@app.route('/api/admin/groups', methods=['POST'])
@token_required
def create_stokvel_group(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Generate a unique group code if not provided
        group_code = data.get('group_code')
        if not group_code:
            # Ensure uniqueness
            while True:
                group_code = generate_group_code()
                if not StokvelGroup.query.filter_by(group_code=group_code).first():
                    break

        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            tier=data['tier'],
            group_code=group_code,  # <-- Set the generated code
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        db.session.commit()
        return jsonify({
            'id': new_group.id,
            'name': new_group.name,
            'description': new_group.description,
            'contribution_amount': new_group.amount,
            'frequency': new_group.frequency,
            'max_members': new_group.max_members,
            'tier': new_group.tier,
            'group_code': new_group.group_code,  # <-- Return the code
            'member_count': 0,
            'created_at': new_group.created_at.isoformat()
        }), 201

    except Exception as e:
        print(f"Error creating stokvel group: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create stokvel group'}), 500

@app.cli.command('init-db')
@with_appcontext
def init_db():
    db.create_all()
    click.echo('Initialized the database.')

@app.cli.command('create-admin')
@with_appcontext
def create_admin():
    """Creates a new admin user."""
    email = click.prompt('Enter admin email', type=str)
    password = click.prompt('Enter admin password', type=str, hide_input=True, confirmation_prompt=True)
    full_name = click.prompt('Enter admin full name', type=str, default='Admin User')
    phone = click.prompt('Enter admin phone number', type=str)

    if User.query.filter_by(email=email).first():
        click.echo(click.style(f"Error: Email '{email}' already exists.", fg='red'))
        return
        
    if User.query.filter_by(phone=phone).first():
        click.echo(click.style(f"Error: Phone number '{phone}' already exists.", fg='red'))
        return

    admin = User(
        email=email,
        full_name=full_name,
        phone=phone,
        role='admin',
        is_verified=True # Admins should be verified by default
    )
    admin.set_password(password)
    db.session.add(admin)
    db.session.commit()
    click.echo(click.style(f"Admin user '{full_name}' created successfully with email '{email}'.", fg='green'))

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    db.drop_all()
    db.create_all()
    click.echo(click.style('Database has been reset.', fg='green'))

@app.cli.command('reset-users')
@with_appcontext
def reset_users():
    """Delete all users and their related data from the database"""
    try:
        # Delete in order of dependencies (child tables first)
        
        # Delete messages (depends on conversations)
        Message.query.delete()
        
        # Delete conversations (depends on users and stokvel_groups)
        Conversation.query.delete()
        
        # Delete withdrawal requests (depends on stokvel_members)
        WithdrawalRequest.query.delete()
        
        # Delete contributions (depends on stokvel_members)
        Contribution.query.delete()
        
        # Delete stokvel members (depends on users and stokvel_groups)
        StokvelMember.query.delete()
        
        # Delete polls and poll options (depends on stokvel_groups)
        PollOption.query.delete()
        Poll.query.delete()
        
        # Delete meetings (depends on stokvel_groups)
        Meeting.query.delete()
        
        # Delete stokvel groups (depends on users via admin_id)
        StokvelGroup.query.delete()
        
        # Delete KYC verifications (depends on users)
        KYCVerification.query.delete()
        
        # Delete user sessions (depends on users)
        UserSession.query.delete()
        
        # Delete OTPs (depends on users)
        OTP.query.delete()
        
        # Delete wallets (depends on users)
        Wallet.query.delete()
        
        # Delete notification settings (depends on users)
        NotificationSettings.query.delete()
        
        # Delete user preferences (depends on users)
        UserPreferences.query.delete()
        
        # Finally delete all users
        User.query.delete()
        
        db.session.commit()
        print('All users and related data deleted successfully')
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')

@app.route('/api/polls', methods=['GET'])
@token_required
def get_polls(current_user):
    polls = Poll.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': poll.id,
        'title': poll.title,
        'description': poll.description,
        'end_date': poll.end_date.isoformat() if poll.end_date else None,
        'status': poll.status,
        'options': [{
            'id': option.id,
            'text': option.text,
            'votes': option.votes
        } for option in poll.options]
    } for poll in polls])

@app.route('/api/polls', methods=['POST'])
@token_required
def create_poll(current_user):
    data = request.get_json()
    poll = Poll(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        end_date=datetime.fromisoformat(data['end_date']) if data.get('end_date') else None
    )
    db.session.add(poll)
    db.session.commit()
    
    for option_text in data['options']:
        option = PollOption(poll_id=poll.id, text=option_text)
        db.session.add(option)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Poll created successfully', 'poll_id': poll.id})
    except SQLAlchemyError as e:
        db.session.rollback()
        return jsonify({'error': 'Database error occurred'}), 500

@app.route('/api/meetings', methods=['GET'])
@token_required
def get_meetings(current_user):
    meetings = Meeting.query.filter_by(group_id=current_user.group_id).all()
    return jsonify([{
        'id': meeting.id,
        'title': meeting.title,
        'description': meeting.description,
        'date': meeting.date.isoformat(),
        'location': meeting.location,
        'status': meeting.status
    } for meeting in meetings])

@app.route('/api/meetings', methods=['POST'])
@token_required
def create_meeting(current_user):
    data = request.get_json()
    meeting = Meeting(
        group_id=current_user.group_id,
        title=data['title'],
        description=data.get('description'),
        date=datetime.fromisoformat(data['date']),
        location=data.get('location')
    )
    db.session.add(meeting)
    db.session.commit()
    return jsonify({'message': 'Meeting created successfully', 'meeting_id': meeting.id})

@app.route('/api/withdrawals', methods=['GET'])
@token_required
def get_withdrawals(current_user):
    withdrawals = WithdrawalRequest.query.filter_by(member_id=current_user.id).all()
    return jsonify([{
        'id': w.id,
        'amount': w.amount,
        'reason': w.reason,
        'created_at': w.created_at.isoformat(),
        'status': w.status,
        'approvals_needed': w.approvals_needed,
        'approvals_received': w.approvals_received
    } for w in withdrawals])

@app.route('/api/withdrawals', methods=['POST'])
@token_required
def create_withdrawal(current_user):
    data = request.get_json()
    withdrawal = WithdrawalRequest(
        member_id=current_user.id,
        amount=data['amount'],
        reason=data.get('reason'),
        approvals_needed=data.get('approvals_needed', 2)
    )
    db.session.add(withdrawal)
    db.session.commit()
    return jsonify({'message': 'Withdrawal request created successfully', 'withdrawal_id': withdrawal.id})

@app.route('/api/groups/available', methods=['GET'])
def get_available_groups():
    groups = StokvelGroup.query.all()
    return jsonify([{
        'id': g.id,
        'name': g.name,
        'category': g.category,  # <-- ADD THIS LINE
        'tier': g.tier,
        'amount': g.amount,
        'rules': g.rules,
        'benefits': g.benefits,
        'description': g.description,
        'frequency': g.frequency,
        'max_members': g.max_members,
        # ... any other fields you want to expose ...
    } for g in groups])

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Get user's role in each group
        memberships = StokvelMember.query.filter_by(user_id=current_user.id).all()
        is_group_admin = any(m.role == 'admin' for m in memberships)
        
        # Get user's active groups
        active_groups = [m.group for m in memberships if m.status == 'active']
        
        # Get total contributions
        total_contributions = db.session.query(func.sum(Contribution.amount)) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .scalar() or 0.0

        # Get recent transactions
        recent_transactions = Contribution.query \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .order_by(Contribution.date.desc()) \
            .limit(5) \
            .all()

        # Get monthly contribution summary
        monthly_contributions = db.session.query(
            func.to_char(Contribution.date, 'YYYY-MM').label('month'),
            func.sum(Contribution.amount).label('total')
        ) \
            .join(StokvelMember) \
            .filter(StokvelMember.user_id == current_user.id) \
            .group_by('month') \
            .order_by('month') \
            .all()

        # Get wallet balance
        wallet_balance = current_user.wallet[0].balance if current_user.wallet else 0.0

        # Get group-specific stats if user is a group admin
        group_stats = []
        if is_group_admin:
            for membership in memberships:
                if membership.role == 'admin':
                    group = membership.group
                    group_contributions = db.session.query(func.sum(Contribution.amount)) \
                        .join(StokvelMember) \
                        .filter(StokvelMember.group_id == group.id) \
                        .scalar() or 0.0
                    
                    group_stats.append({
                        'group_id': group.id,
                        'group_name': group.name,
                        'total_contributions': float(group_contributions),
                        'member_count': len(group.members),
                        'active_members': len([m for m in group.members if m.status == 'active']),
                        'group_code': group.group_code
                    })

        return jsonify({
            'user': {
                'id': current_user.id,
                'name': current_user.full_name,
                'email': current_user.email,
                'role': current_user.role,
                'is_group_admin': is_group_admin
            },
            'walletBalance': float(wallet_balance),
            'activeGroupsCount': len(active_groups),
            'totalContributions': float(total_contributions),
            'recentTransactions': [{
                'id': t.id,
                'amount': float(t.amount),
                'date': t.date.isoformat(),
                'type': 'deposit',
                'description': f'Contribution to {t.member.group.name}'
            } for t in recent_transactions],
            'monthlySummary': [{'month': row.month, 'total': float(row.total)} for row in monthly_contributions],
            'groupStats': group_stats if is_group_admin else [],
            'activeGroups': [{
                'id': g.id,
                'name': g.name,
                'role': next(m.role for m in memberships if m.group_id == g.id),
                'contribution_amount': float(g.amount),
                'frequency': g.frequency
            } for g in active_groups]
        })

    except Exception as e:
        print(f"Error fetching dashboard stats: {str(e)}")
        return jsonify({'error': 'Failed to fetch dashboard stats'}), 500

@app.route('/api/stokvel/register-group', methods=['POST'])
@token_required
def register_stokvel_group(current_user):
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400

        # Generate unique group code
        while True:
            group_code = generate_group_code()
            if not StokvelGroup.query.filter_by(group_code=group_code).first():
                break

        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            tier=data['tier'],
            group_code=group_code,
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        
        # Create membership for the admin
        admin_membership = StokvelMember(
            user_id=current_user.id,
            group_id=new_group.id,
            status='active',
            role='admin'
        )
        
        db.session.add(admin_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Stokvel group created successfully',
            'group': new_group.to_dict(),
            'group_code': group_code  # Send this to admin to share with members
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/stokvel/join-group', methods=['POST'])
@token_required
def join_stokvel_group(current_user):
    try:
        data = request.get_json()
        group_code = data.get('group_code')
        
        if not group_code:
            return jsonify({'error': 'Group code is required'}), 400
            
        # Find group by code
        group = StokvelGroup.query.filter_by(group_code=group_code).first()
        if not group:
            return jsonify({'error': 'Invalid group code'}), 404
            
        # Check if user is already a member
        existing_membership = StokvelMember.query.filter_by(
            user_id=current_user.id,
            group_id=group.id
        ).first()
        
        if existing_membership:
            return jsonify({'error': 'You are already a member of this group'}), 400
            
        # Check if group is full
        if group.max_members and len(group.members) >= group.max_members:
            return jsonify({'error': 'Group has reached maximum member limit'}), 400
            
        # Create new membership
        new_membership = StokvelMember(
            user_id=current_user.id,
            group_id=group.id,
            status='active',
            role='member'
        )
        
        db.session.add(new_membership)
        db.session.commit()
        
        return jsonify({
            'message': 'Successfully joined stokvel group',
            'group': group.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def validate_email(email):
    # Add email validation
    pass

def validate_phone(phone):
    # Add phone validation
    pass

@app.route('/api/auth/verify', methods=['POST'])
def verify_otp():
    data = request.get_json()
    phone = data.get('phone')
    otp_code = data.get('otp_code')

    if not phone or not otp_code:
        return jsonify({'success': False, 'message': 'Phone and OTP code are required'}), 400

    user = User.query.filter_by(phone=phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404

    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'success': False, 'message': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    db.session.commit()

    # Create JWT token and return user info
    access_token = create_access_token(identity=str(user.id))
    user_data = {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "is_verified": user.is_verified
    }
    return jsonify({
        'success': True,
        'message': 'Phone verified successfully',
        'access_token': access_token,
        'user': user_data
    })

@app.route('/api/delete-all-users', methods=['GET'])
def delete_all_users():
    try:
        # Delete all OTPs first
        OTP.query.delete()
        # Then delete all users
        User.query.delete()
        db.session.commit()
        return jsonify({'message': 'All users and OTPs deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-users', methods=['GET'])
def test_users():
    try:
        users = User.query.all()
        return jsonify({
            'count': len(users),
            'users': [{'id': user.id, 'email': user.email} for user in users]
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test-email', methods=['POST'])
def test_email():
    """Test endpoint to verify email configuration"""
    try:
        data = request.get_json()
        test_email = data.get('email')
        
        if not test_email:
            return jsonify({'error': 'Email is required'}), 400
        
        # Check configuration
        if not check_email_config():
            return jsonify({'error': 'Email configuration is incomplete'}), 500
        
        # Send test email
        test_code = '123456'
        success, message = send_verification_email(test_email, test_code)
        
        if success:
            return jsonify({'message': 'Test email sent successfully', 'details': message}), 200
        else:
            return jsonify({'error': f'Failed to send test email: {message}'}), 500
            
    except Exception as e:
        return jsonify({'error': f'Test email failed: {str(e)}'}), 500

# After your app configuration
try:
   # db.engine.connect()
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Database connection failed: {str(e)}")
    raise

@app.route('/api/test-connection')
def test_connection():
    try:
        # Test database
        db.engine.connect()
        db_status = "Database: Connected"
        
        # Test email
        mail_status = "Email: Not tested"
        if app.config['MAIL_USERNAME'] and app.config['MAIL_PASSWORD']:
            mail_status = "Email: Configured"
        
        return jsonify({
            'status': 'success',
            'database': db_status,
            'email': mail_status,
            'database_url': app.config['SQLALCHEMY_DATABASE_URI'].replace('postgres:postgres', ':')  # Hide password
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@app.route('/api/dashboard/users', methods=['GET'])
@role_required(['admin'])
def get_users():
    # Only admin can access this endpoint
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@app.route('/api/dashboard/contributions', methods=['GET'])
@role_required(['admin', 'member'])
def get_contributions():
    # Both admin and members can access this endpoint
    user_id = get_jwt_identity()
    if request.args.get('all') and User.query.get(user_id).role == 'admin':
        # Admin can see all contributions
        contributions = Contribution.query.all()
    else:
        # Members can only see their own contributions
        contributions = Contribution.query.filter_by(user_id=user_id).all()
    return jsonify([contribution.to_dict() for contribution in contributions])

@app.route('/api/verify-email', methods=['POST', 'OPTIONS'])
def verify_email():
    if request.method == 'OPTIONS':
        # Explicitly handle OPTIONS preflight request
        response = Response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers'))
        response.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

    # Handle the POST request
    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email')
            code = data.get('verification_code')
            
            if not email or not code:
                return jsonify({'error': 'Email and verification code are required'}), 400

            # Clean the verification code
            code = code.replace(' ', '')
            
            user = User.query.filter_by(email=email).first()
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.is_verified:
                return jsonify({'error': 'Email already verified'}), 400
            
            if not user.verification_code or not user.verification_code_expiry:
                return jsonify({'error': 'No verification code found for this user'}), 400
            
            if datetime.utcnow() > user.verification_code_expiry:
                return jsonify({'error': 'Verification code expired'}), 400
            
            # Clean the stored verification code for comparison
            stored_code = user.verification_code.replace(' ', '')
            if stored_code != code:
                print(f"Code mismatch - Received: '{code}', Stored: '{stored_code}'")  # Debug log
                return jsonify({'error': 'Invalid verification code'}), 400
            
            # Mark user as verified
            user.is_verified = True
            user.verification_code = None
            user.verification_code_expiry = None
            db.session.commit()
            
            return jsonify({'message': 'Email verified successfully'}), 200
            
        except Exception as e:
            db.session.rollback()
            print(f"Verification error: {str(e)}")  # Debug log
            return jsonify({'error': str(e)}), 500

@app.route('/api/resend-verification', methods=['POST'])
def resend_verification():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required'}), 400
        
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_verified:
            return jsonify({'error': 'Email already verified'}), 400
        
        # Generate and send new verification code
        verification_code = user.generate_verification()
        print(f"Resending verification code: {verification_code} for user: {email}")
        
        success, message = send_verification_email(user.email, verification_code)
        print(f"Resend email result - Success: {success}, Message: {message}")
        
        if not success:
            db.session.rollback()
            return jsonify({'error': f'Failed to send verification email: {message}'}), 500
        
        db.session.commit()

        return jsonify({'message': 'New verification code sent successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error during resend: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Failed to resend verification code: {str(e)}'}), 500

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_user_profile(current_user):
    return jsonify({
        'id': current_user.id,
        'name': current_user.full_name,
        'email': current_user.email,
        'phone': current_user.phone,
        'role': current_user.role,
        'profile_picture': current_user.profile_picture,
        'is_verified': current_user.is_verified,
        'gender': current_user.gender,
        'employment_status': current_user.employment_status,
        'two_factor_enabled': current_user.two_factor_enabled,
        'date_of_birth': current_user.date_of_birth.isoformat() if current_user.date_of_birth else None
    })

@app.route('/api/user/profile', methods=['PUT'])
@token_required
def update_user_profile(current_user):
    data = request.get_json()

    # Update fields that are simple string assignments
    if 'name' in data:
        current_user.full_name = data['name']
    if 'phone' in data:
        current_user.phone = data['phone']
    if 'gender' in data:
        current_user.gender = data['gender']
    if 'employment_status' in data:
        current_user.employment_status = data['employment_status']

    # Specifically handle date_of_birth: parse string to datetime object
    if 'date_of_birth' in data and data['date_of_birth']:
        try:
            # The fromisoformat() method correctly parses 'YYYY-MM-DD'
            current_user.date_of_birth = datetime.fromisoformat(data['date_of_birth'])
        except (ValueError, TypeError):
            # Handle cases where the date format is wrong or data is null
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD.'}), 400

    db.session.commit()
    return jsonify({'message': 'Profile updated successfully'}), 200

@app.route('/api/user/security/password', methods=['PUT', 'OPTIONS'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not current_user or not current_user.check_password(current_password):
        return jsonify({'error': 'Current password is incorrect'}), 400

    current_user.set_password(new_password)
    db.session.commit()
    return jsonify({'message': 'Password changed successfully'})

@app.route('/api/user/security/2fa', methods=['POST', 'OPTIONS'])
@token_required
def toggle_two_factor(current_user):
    current_user.two_factor_enabled = not current_user.two_factor_enabled
    db.session.commit()
    return jsonify({
        "message": "Two-factor authentication updated",
        "two_factor_enabled": current_user.two_factor_enabled
    }), 200

@app.route('/api/user/communication', methods=['GET', 'OPTIONS'])
@token_required
def get_communication_preferences(current_user):
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
        db.session.commit()
    return jsonify({
        "email_announcements": settings.email_announcements,
        "email_stokvel_updates": settings.email_stokvel_updates,
        "push_announcements": settings.push_announcements
    })

@app.route('/api/user/communication', methods=['PUT', 'OPTIONS'])
@token_required
def update_communication_preferences(current_user):
    data = request.get_json()
    settings = NotificationSettings.query.filter_by(user_id=current_user.id).first()
    if not settings:
        settings = NotificationSettings(user_id=current_user.id)
        db.session.add(settings)
    for field in ["email_announcements", "email_stokvel_updates", "push_announcements"]:
        if field in data:
            setattr(settings, field, data[field])
    db.session.commit()
    return jsonify({"message": "Communication preferences updated successfully"}), 200

@app.route('/api/user/privacy', methods=['GET', 'OPTIONS'])
@token_required
def get_privacy_settings(current_user):
    prefs = UserPreferences.query.filter_by(user_id=current_user.id).first()
    if not prefs:
        prefs = UserPreferences(user_id=current_user.id)
        db.session.add(prefs)
        db.session.commit()
    return jsonify({
        "data_for_personalization": prefs.data_for_personalization,
        "data_for_analytics": prefs.data_for_analytics,
        "data_for_third_parties": prefs.data_for_third_parties,
    })

@app.route('/api/user/account', methods=['DELETE', 'OPTIONS'])
@token_required
def delete_account(current_user):
    data = request.get_json() or {}
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    db.session.delete(current_user)
    db.session.commit()
    return jsonify({'message': 'Account deleted successfully'})

@app.route('/api/start', methods=['POST'])
@token_required
def start_chat(current_user):
    data = request.get_json() or {}
    title = data.get('title', 'New Chat')
    is_stokvel_related = data.get('is_stokvel_related', False)
    stokvel_id = data.get('stokvel_id')

    conversation = Conversation(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        title=title,
        is_stokvel_related=is_stokvel_related,
        stokvel_id=stokvel_id
    )
    db.session.add(conversation)
    db.session.commit()

    # Add system message
    system_message = Message(
        conversation_id=conversation.id,
        role='system',
        content='You are a helpful assistant. Answer concisely in 1-3 sentences.'
    )
    db.session.add(system_message)
    db.session.commit()

    return jsonify({"conversation_id": conversation.id}), 201

@app.route('/api/message', methods=['POST'])
@token_required
def send_message(current_user):
    data = request.get_json()
    conversation_id = data.get('conversation_id')
    user_message = data.get('message')

    conversation = Conversation.query.filter_by(id=conversation_id, user_id=current_user.id).first()
    if not conversation:
        return jsonify({"error": "Conversation not found."}), 404

    # Add user message
    user_msg = Message(
        conversation_id=conversation_id,
        role='user',
        content=user_message
    )
    db.session.add(user_msg)
    db.session.commit()

    # Fetch all messages for OpenAI context
    messages = [
        {"role": m.role, "content": m.content}
        for m in Message.query.filter_by(conversation_id=conversation_id).order_by(Message.created_at).all()
    ]

    # Call OpenRouter API
    try:
        completion = client.chat.completions.create(
            extra_headers={
                "HTTP-Referer": os.getenv('FRONTEND_URL', 'http://localhost:3000'),
                "X-Title": "Stokvel Assistant",
            },
            model="meta-llama/llama-3-8b-instruct",
            messages=messages,
            max_tokens=150
        )
        ai_response = completion.choices[0].message.content

        # Store AI response
        assistant_msg = Message(
            conversation_id=conversation_id,
            role='assistant',
            content=ai_response
        )
        db.session.add(assistant_msg)
        db.session.commit()

        return jsonify({
            "response": ai_response,
            "conversation_id": conversation_id
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    try:
        api_key = os.getenv('OPENROUTER_API_KEY')
        if not api_key:
            return jsonify({'error': 'OpenRouter API key not set'}), 500

        payload = {
            "model": "meta-llama/llama-3-8b-instruct",
            "messages": [
                {"role": "system", "content": about_us_text},
                {"role": "user", "content": user_message}
            ],
            "max_tokens": 150
        }
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            json=payload,
            headers=headers
        )
        if response.status_code != 200:
            print("OpenRouter error:", response.text)
            return jsonify({'error': f'OpenRouter error: {response.text}'}), 500

        data = response.json()
        answer = data['choices'][0]['message']['content']
        return jsonify({'answer': answer})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.errorhandler(Exception)
def handle_error(error):
    # Let Flask handle HTTP errors (like 404, 405, etc.) with its default pages
    if isinstance(error, HTTPException):
        return error

    logger.error(f"Unhandled error: {str(error)}")
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
    if isinstance(error, (ExpiredSignatureError, InvalidTokenError)):
        return jsonify({"error": "Token has expired"}), 401
    return jsonify({"error": "An unexpected error occurred"}), 500



@app.before_request
def handle_options_requests():
    if request.method == 'OPTIONS':
        return '', 200

@app.route('/api/user/security/2fa/start', methods=['POST'])
@token_required
def start_2fa_setup(current_user):
    data = request.get_json()
    method = data.get('method', 'email')  # 'email' or 'sms'

    # Generate OTP
    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=current_user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    # Send OTP
    if method == 'sms':
        send_verification_sms(current_user.phone, otp_code)
    else:
        send_verification_email(current_user.email, otp_code)

    current_user.two_factor_method = method
    db.session.commit()

    return jsonify({'message': f'OTP sent via {method}.', 'method': method}), 200

@app.route('/api/user/security/2fa/verify', methods=['POST'])
@token_required
def verify_2fa_setup(current_user):
    data = request.get_json()
    otp_code = data.get('otp_code')

    otp = OTP.query.filter_by(user_id=current_user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400

    otp.is_used = True
    current_user.two_factor_enabled = True
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication enabled!'}), 200

@app.route('/api/auth/verify-2fa-login', methods=['POST'])
def verify_2fa_login():
    data = request.get_json()
    user_id = data.get('user_id')
    otp_code = data.get('otp_code')
    user = User.query.get(user_id)
    otp = OTP.query.filter_by(user_id=user.id, code=otp_code, is_used=False).order_by(OTP.created_at.desc()).first()
    if not otp or not otp.is_valid():
        return jsonify({'error': 'Invalid or expired OTP'}), 400
    otp.is_used = True
    db.session.commit()
    access_token = create_access_token(identity=str(user.id))
    return jsonify({'message': '2FA login successful', 'access_token': access_token}), 200

@app.route('/api/user/security/2fa/disable', methods=['POST'])
@token_required
def disable_2fa(current_user):
    data = request.get_json()
    password = data.get('password')

    if not current_user or not current_user.check_password(password):
        return jsonify({'error': 'Incorrect password'}), 401

    current_user.two_factor_enabled = False
    db.session.commit()
    return jsonify({'message': 'Two-factor authentication disabled!'}), 200

@app.route('/api/user/session/<int:session_id>/logout', methods=['POST'])
@token_required
def logout_session(current_user, session_id):
    session = UserSession.query.filter_by(id=session_id, user_id=current_user.id, is_active=True).first()
    if not session:
        return jsonify({'error': 'Session not found'}), 404
    session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Session logged out successfully'})

@app.route('/api/user/sessions', methods=['GET'])
@token_required
def get_user_sessions(current_user):
    sessions = UserSession.query.filter_by(user_id=current_user.id).order_by(UserSession.login_time.desc()).all()
    return jsonify([
        {
            'id': s.id,
            'user_agent': s.user_agent,
            'ip_address': s.ip_address,
            'login_time': s.login_time.isoformat(),
            'last_activity': s.last_activity.isoformat(),
            'is_active': s.is_active
        }
        for s in sessions
    ])

@app.route('/api/user/sessions/logout_all', methods=['POST'])
@token_required
def logout_all_sessions(current_user):
    current_user_agent = request.headers.get('User-Agent', '')
    current_ip = request.remote_addr or ''
    sessions = UserSession.query.filter_by(user_id=current_user.id, is_active=True).all()
    for session in sessions:
        # Keep the current session active, log out others
        if session.user_agent != current_user_agent or session.ip_address != current_ip:
            session.is_active = False
    db.session.commit()
    return jsonify({'message': 'Logged out from all other sessions.'})

  

KYC_UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'kyc_docs')
os.makedirs(KYC_UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/kyc/update', methods=['PATCH'])
@token_required
def update_kyc(current_user):
    # Find existing KYC record or create a new one in 'draft' state
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        kyc = KYCVerification(user_id=current_user.id, status='draft')
        db.session.add(kyc)

    # Handle file uploads
    if request.files:
        files = request.files
        
        def save_file(field_name):
            file = files.get(field_name)
            if file and file.filename:
                # Validate file type
                allowed_extensions = {'pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'}
                file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                
                if file_extension not in allowed_extensions:
                    raise ValueError(f'File type .{file_extension} is not allowed. Please upload PDF, JPG, PNG, or DOC files.')
                
                # Validate file size (10MB limit)
                file.seek(0, 2)  # Seek to end
                file_size = file.tell()
                file.seek(0)  # Reset to beginning
                
                if file_size > 10 * 1024 * 1024:  # 10MB
                    raise ValueError('File size must be less than 10MB.')
                
                filename = secure_filename(f"{current_user.id}_{field_name}_{file.filename}")
                file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
                file.save(file_path)
                return file_path
            return None

        # Save uploaded files and update database paths
        if 'documents.idDocument' in files:
            kyc.id_document_path = save_file('documents.idDocument')
        if 'documents.proofOfAddress' in files:
            kyc.proof_of_address_path = save_file('documents.proofOfAddress')
        if 'documents.proofOfIncome' in files:
            kyc.proof_of_income_path = save_file('documents.proofOfIncome')
        if 'documents.bankStatement' in files:
            kyc.bank_statement_path = save_file('documents.bankStatement')

    # Handle JSON data for form fields
    if request.is_json:
        data = request.get_json()
        
        # Map frontend camelCase to backend snake_case
        key_map = {
            'fullName': 'full_name', 'dateOfBirth': 'date_of_birth', 'idNumber': 'id_number',
            'employmentStatus': 'employment_status', 'employerName': 'employer_name',
            'streetAddress': 'street_address', 'postalCode': 'postal_code', 'monthlyIncome': 'monthly_income',
            'incomeSource': 'income_source', 'employmentType': 'employment_type', 'bankName': 'bank_name',
            'accountNumber': 'account_number', 'accountType': 'account_type', 'branchCode': 'branch_code'
        }

        # data will be like {'personal': {'fullName': 'John'}}
        section_data = list(data.values())[0]

        for camel_key, value in section_data.items():
            snake_key = key_map.get(camel_key, camel_key)
            if hasattr(kyc, snake_key):
                # Safely handle empty strings for numeric fields
                if snake_key == 'monthly_income' and (value == '' or value is None):
                    setattr(kyc, snake_key, None)
                else:
                    setattr(kyc, snake_key, value)

    try:
        db.session.commit()
        return jsonify({'message': 'KYC details saved successfully!'}), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'An error occurred while saving KYC data.'}), 500

@app.route('/api/kyc/submit', methods=['POST'])
@token_required
def submit_kyc(current_user):
    # The final submission now assumes a draft KYC record exists
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).first()
    if not kyc:
        return jsonify({'error': 'Please save your details before submitting.'}), 400

    files = request.files

    def save_file(field):
        file = files.get(field)
        if file:
            filename = secure_file(f"{current_user.id}_{field}_{file.filename}")
            file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
            file.save(file_path)
            return file_path
        return None

    # Update document paths
    kyc.id_document_path = save_file('documents.idDocument') or kyc.id_document_path
    kyc.proof_of_address_path = save_file('documents.proofOfAddress') or kyc.proof_of_address_path
    kyc.proof_of_income_path = save_file('documents.proofOfIncome') or kyc.proof_of_income_path
    kyc.bank_statement_path = save_file('documents.bankStatement') or kyc.bank_statement_path
    
    # Change status to 'pending' for review
    kyc.status = 'pending'
    db.session.commit()

    return jsonify({'message': 'KYC submitted successfully for review', 'kyc_id': kyc.id}), 201

@app.route('/api/kyc/status', methods=['GET'])
@token_required
def get_kyc_status(current_user):
    kyc = KYCVerification.query.filter_by(user_id=current_user.id).order_by(KYCVerification.created_at.desc()).first()
    if not kyc:
        return jsonify({'status': 'not_submitted', 'message': 'No KYC submission found.'}), 200

    return jsonify({
        'status': kyc.status,
        'full_name': kyc.full_name,
        'date_of_birth': str(kyc.date_of_birth) if kyc.date_of_birth else None,
        'id_number': kyc.id_number,
        'phone': kyc.phone,
        'email': kyc.email,
        'employment_status': kyc.employment_status,
        'employer_name': kyc.employer_name,
        'street_address': kyc.street_address,
        'city': kyc.city,
        'province': kyc.province,
        'postal_code': kyc.postal_code,
        'country': kyc.country,
        'monthly_income': kyc.monthly_income,
        'income_source': kyc.income_source,
        'employment_type': kyc.employment_type,
        'bank_name': kyc.bank_name,
        'account_number': kyc.account_number,
        'account_type': kyc.account_type,
        'branch_code': kyc.branch_code,
        'id_document_path': kyc.id_document_path,
        'proof_of_address_path': kyc.proof_of_address_path,
        'proof_of_income_path': kyc.proof_of_income_path,
        'bank_statement_path': kyc.bank_statement_path,
        'verification_date': str(kyc.verification_date) if kyc.verification_date else None,
        'rejection_reason': kyc.rejection_reason,
        'created_at': str(kyc.created_at),
        'updated_at': str(kyc.updated_at)
    }), 200

@app.route('/api/admin/kyc/submissions', methods=['GET'])
@role_required(['admin'])
def get_kyc_submissions():
    """Get all KYC submissions for admin review"""
    try:
        submissions = KYCVerification.query.all()
        submissions_data = []
        
        for submission in submissions:
            user = User.query.get(submission.user_id)
            submissions_data.append({
                'id': submission.id,
                'user_id': submission.user_id,
                'user_email': user.email if user else 'Unknown',
                'user_name': user.full_name if user else 'Unknown',
                'status': submission.status,
                'full_name': submission.full_name,
                'email': submission.email,
                'phone': submission.phone,
                'id_number': submission.id_number,
                'employment_status': submission.employment_status,
                'bank_name': submission.bank_name,
                'account_number': submission.account_number,
                'id_document_path': submission.id_document_path,
                'proof_of_address_path': submission.proof_of_address_path,
                'proof_of_income_path': submission.proof_of_income_path,
                'bank_statement_path': submission.bank_statement_path,
                'created_at': submission.created_at.isoformat(),
                'updated_at': submission.updated_at.isoformat(),
                'rejection_reason': submission.rejection_reason
            })
        
        return jsonify(submissions_data), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/approve', methods=['POST'])
@role_required(['admin'])
def approve_kyc(submission_id):
    """Approve a KYC submission"""
    try:
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'approved'
        kyc.verification_date = datetime.utcnow()
        
        # Update user verification status
        user = User.query.get(kyc.user_id)
        if user:
            user.is_verified = True
        
        db.session.commit()

        # On approval
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Approved",
            message="Your KYC verification has been approved! You can now join groups.",
            type="kyc_approved",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission approved successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/<int:submission_id>/reject', methods=['POST'])
@role_required(['admin'])
def reject_kyc(submission_id):
    """Reject a KYC submission"""
    try:
        data = request.get_json()
        rejection_reason = data.get('rejection_reason', 'No reason provided')
        
        kyc = KYCVerification.query.get(submission_id)
        if not kyc:
            return jsonify({'error': 'KYC submission not found'}), 404
        
        kyc.status = 'rejected'
        kyc.rejection_reason = rejection_reason
        
        db.session.commit()

        # On rejection
        notification = Notification(
            user_id=kyc.user_id,
            title="KYC Rejected",
            message=f"Your KYC verification was rejected. Reason: {kyc.rejection_reason}",
            type="kyc_rejected",
            data={}
        )
        db.session.add(notification)
        db.session.commit()

        return jsonify({'message': 'KYC submission rejected successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/kyc/document/<path:filename>', methods=['GET'])
@token_required
def download_kyc_document(current_user, filename):
    """Download a KYC document (only accessible by the document owner or admin)"""
    try:
        # Check if user is admin or the document belongs to them
        if current_user.role != 'admin':
            # Extract user_id from filename (format: user_id_fieldname_originalname)
            filename_parts = filename.split('_')
            if len(filename_parts) < 2 or filename_parts[0] != str(current_user.id):
                return jsonify({'error': 'Access denied'}), 403
        
        file_path = os.path.join(KYC_UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(file_path, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/kyc/stats', methods=['GET'])
@role_required(['admin'])
def get_kyc_stats():
    try:
        pending_count = KYCVerification.query.filter_by(status='pending').count()
        approved_count = KYCVerification.query.filter_by(status='approved').count()
        rejected_count = KYCVerification.query.filter_by(status='rejected').count()
        
        return jsonify({
            'pending': pending_count,
            'approved': approved_count,
            'rejected': rejected_count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def check_email_config():
    """Check if email configuration is properly set up"""
    required_vars = ['SENDGRID_API_KEY', 'SENDGRID_FROM_EMAIL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"WARNING: Missing email configuration variables: {missing_vars}")
        print("Email functionality will not work properly!")
        return False
    
    print("Email configuration check passed!")
    return True

# Call this when the app starts
check_email_config()

bp = Blueprint('admin', __name__)

@bp.route('/stokvels', methods=['GET'])
def list_all_stokvels():
    # your code here
    pass

@app.route('/api/admin/groups/<int:group_id>', methods=['PUT'])
@token_required
def update_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    data = request.get_json()
    group.name = data.get('name', group.name)
    group.description = data.get('description', group.description)
    group.contribution_amount = float(data.get('contribution_amount', group.amount))
    group.frequency = data.get('frequency', group.frequency)
    group.max_members = int(data.get('max_members', group.max_members))
    group.tier = data.get('tier', group.tier)  # Add this if you have a tier field

    db.session.commit()
    return jsonify({'message': 'Group updated successfully'}), 200

@app.route('/api/admin/groups/<int:group_id>', methods=['DELETE'])
@token_required
def delete_group(current_user, group_id):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    group = StokvelGroup.query.get_or_404(group_id)
    db.session.delete(group)
    db.session.commit()
    return jsonify({'message': 'Group deleted successfully'}), 200

@app.route('/api/groups/join', methods=['POST'])
@jwt_required()
def join_group():
    data = request.get_json()
    user_id = get_jwt_identity()
    tier_id = data.get('tierId')

    # Check for existing pending request
    existing = GroupJoinRequest.query.filter_by(user_id=user_id, tier_id=tier_id, status='pending').first()
    if existing:
        return jsonify({'error': 'You already have a pending request for this tier.'}), 400

    join_request = GroupJoinRequest(user_id=user_id, tier_id=tier_id)
    db.session.add(join_request)
    db.session.commit()
    return jsonify({"message": "Join request submitted!"}), 200

class GroupJoinRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    tier_id = db.Column(db.Integer, nullable=False)  # or group_id if you use groups
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected
    reason = db.Column(db.String(255))  # Reason for rejection
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', backref='join_requests')

@app.route('/api/admin/join-requests', methods=['GET'])
@jwt_required()
def list_join_requests():
    # Optionally check admin role here
    requests = GroupJoinRequest.query.order_by(GroupJoinRequest.created_at.desc()).all()
    result = []
    for req in requests:
        result.append({
            'id': req.id,
            'user_id': req.user_id,
            'tier_id': req.tier_id,
            'status': req.status,
            'reason': req.reason,
            'created_at': req.created_at.isoformat(),
            'user': {
                'id': req.user.id,
                'name': req.user.full_name,
                'email': req.user.email,
            }
        })
    return jsonify(result)

@app.route('/api/admin/join-requests/<int:request_id>/approve', methods=['POST'])
@jwt_required()
def approve_join_request(request_id):
    req = GroupJoinRequest.query.get_or_404(request_id)
    user = User.query.get(req.user_id)
    kyc = KYCVerification.query.filter_by(user_id=user.id).order_by(KYCVerification.created_at.desc()).first()
    
    if not kyc or kyc.status != 'approved':
        # Send notification to user to complete KYC
        notification = Notification(
            user_id=user.id,
            title="KYC Required for Group Approval",
            message="Your join request is pending. Please complete your KYC verification to be approved for the group.",
            type="kyc_required",
            data={
                "join_request_id": req.id,
                "group_id": req.tier_id,
                "action_required": "complete_kyc",
                "kyc_url": "/dashboard/kyc"  # <-- Add this line
            }
        )
        db.session.add(notification)
        db.session.commit()
        
        return jsonify({
            'error': 'User must complete and have KYC approved before approval.',
            'message': 'Notification sent to user to complete KYC',
            'user_email': user.email
        }), 400
    
    req.status = 'approved'
    db.session.commit()
    return jsonify({'message': 'Request approved'})

@app.route('/api/admin/join-requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_join_request(request_id):
    data = request.get_json()
    reason = data.get('reason', '')
    req = GroupJoinRequest.query.get_or_404(request_id)
    req.status = 'rejected'
    req.reason = reason
    db.session.commit()
    return jsonify({'message': 'Request rejected'})

@app.route('/api/user/join-requests', methods=['GET'])
@jwt_required()
def get_user_join_requests():
    user_id = get_jwt_identity()
    requests = GroupJoinRequest.query.filter_by(user_id=user_id).all()
    result = []
    for req in requests:
        group = StokvelGroup.query.get(req.tier_id)
        result.append({
            'tier_id': req.tier_id,
            'status': req.status,
            'reason': req.reason,
            'group_name': group.name if group else None,
            'tier': group.tier if group else None,
            'amount': group.amount if group else None,
            'created_at': req.created_at.isoformat() if req.created_at else None
        })
    return jsonify(result)



@app.route('/api/user/notifications', methods=['GET'])
@jwt_required()
def get_user_notifications():
    user_id = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/user/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})

@app.route('/api/admin/notifications', methods=['GET'])
@jwt_required()
def get_admin_notifications():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    # Get notifications for admin users
    notifications = Notification.query.filter_by(user_id=user_id).order_by(Notification.created_at.desc()).all()
    
    return jsonify([{
        'id': n.id,
        'title': n.title,
        'message': n.message,
        'type': n.type,
        'data': n.data,
        'is_read': n.is_read,
        'created_at': n.created_at.isoformat()
    } for n in notifications])

@app.route('/api/admin/notifications/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_admin_notification_read(notification_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 401
    
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()
    
    if notification:
        notification.is_read = True
        db.session.commit()
    
    return jsonify({'message': 'Notification marked as read'})


  # -------------------- MAIN --------------------
if __name__ == '__main__':
    app.run(port=5001, debug=True)

@event.listens_for(Engine, "connect")
def connect(dbapi_connection, connection_record):
    connection_record.info['pid'] = os.getpid()

@event.listens_for(Engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    pid = os.getpid()
    if connection_record.info['pid'] != pid:
        connection_record.info['pid'] = pid
        connection_record.info['checked_out'] = time.time()

@app.route('/api/auth/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json()
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400

    normalized_phone = normalize_phone(phone)
    user = User.query.filter_by(phone=normalized_phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User with this phone does not exist'}), 404

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    success, message = send_verification_sms(normalized_phone, otp_code)
    if not success:
        return jsonify({'success': False, 'message': f'Failed to send SMS: {message}'}), 500

    return jsonify({'success': True, 'message': 'OTP sent successfully'})

@app.route('/api/auth/resend-sms', methods=['POST'])
def resend_sms():
    data = request.get_json()
    phone = data.get('phone')
    if not phone:
        return jsonify({'success': False, 'message': 'Phone number is required'}), 400

    normalized_phone = normalize_phone(phone)
    user = User.query.filter_by(phone=normalized_phone).first()
    if not user:
        return jsonify({'success': False, 'message': 'User with this phone does not exist'}), 404

    otp_code = generate_otp()
    expiry = datetime.utcnow() + timedelta(minutes=10)
    otp = OTP(user_id=user.id, code=otp_code, expires_at=expiry)
    db.session.add(otp)
    db.session.commit()

    success, message = send_verification_sms(normalized_phone, otp_code)
    if not success:
        return jsonify({'success': False, 'message': f'Failed to send SMS: {message}'}), 500

    return jsonify({'success': True, 'message': 'OTP resent successfully'})

UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads', 'profile_pics')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/api/user/profile-picture', methods=['POST'])
@token_required
def upload_profile_picture(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(f"{current_user.id}_{file.filename}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        # Save the relative path or URL in the database
        current_user.profile_picture = f"/uploads/profile_pics/{filename}"
        db.session.commit()
        return jsonify({'profile_picture': current_user.profile_picture}), 200

@app.route('/uploads/profile_pics/<filename>')
def serve_profile_picture(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


