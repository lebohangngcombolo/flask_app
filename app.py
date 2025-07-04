from flask import Flask, request, jsonify, Response, make_response, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import jwt as pyjwt
import datetime
from functools import wraps
import click
from flask.cli import with_appcontext
from datetime import datetime, timedelta
from sqlalchemy import func, select
from sqlalchemy.sql import text
from dotenv import load_dotenv
import os
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from sqlalchemy.exc import SQLAlchemyError
from flask_mail import Mail, Message
import random
import requests
import logging
import string
from iStokvel.utils.email_utils import send_verification_email
from flask_migrate import Migrate
from twilio.rest import Client
import phonenumbers
from werkzeug.utils import secure_filename
from werkzeug.exceptions import HTTPException
from sqlalchemy import event
from sqlalchemy.engine import Engine
from flask_jwt_extended.exceptions import JWTExtendedException
from jwt.exceptions import ExpiredSignatureError
import uuid
import time
from sqlalchemy.orm import validates, joinedload, selectinload
import re
from celery import Celery
from flask_compress import Compress
from flask_dance.contrib.facebook import make_facebook_blueprint, facebook

# # Load environment variables from .env file  <- We are disabling this for now
# load_dotenv()

# Config
app = Flask(__name__)

# --- Configuration is now hardcoded for testing ---
# IMPORTANT: This is for local testing only. Use environment variables for production.
app.config['SECRET_KEY'] = 'a-very-secret-key-for-testing'
app.config['JWT_SECRET_KEY'] = 'a-different-jwt-secret-key'
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:35Longbeach@172.19.96.1:5433/authdb'
app.config['FACEBOOK_OAUTH_CLIENT_ID'] = 'dummy-id-for-testing'
app.config['FACEBOOK_OAUTH_CLIENT_SECRET'] = 'dummy-secret-for-testing'
# --- End of hardcoded section ---

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
# The following lines can stay as they have default fallbacks or are optional
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'your-email@gmail.com')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'your-app-password')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'your-email@gmail.com')
app.config['SENDGRID_API_KEY'] = os.getenv('SENDGRID_API_KEY')
app.config['SENDGRID_FROM_EMAIL'] = os.getenv('SENDGRID_FROM_EMAIL')
app.config['CELERY_BROKER_URL'] = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
app.config['CELERY_RESULT_BACKEND'] = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')

# Add JWT configuration
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)  # Token expires in 1 hour
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

# Add Facebook OAuth configuration
app.config['FACEBOOK_OAUTH_CLIENT_ID'] = os.getenv('FACEBOOK_OAUTH_CLIENT_ID')
app.config['FACEBOOK_OAUTH_CLIENT_SECRET'] = os.getenv('FACEBOOK_OAUTH_CLIENT_SECRET')

# -------------------- INITIALIZE EXTENSIONS --------------------
db = SQLAlchemy()
mail = Mail()
migrate = Migrate()
jwt_manager = JWTManager()

db.init_app(app)
mail.init_app(app)
migrate.init_app(app, db)
jwt_manager.init_app(app)
Compress(app)

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# -------------------- CORS SETUP --------------------
CORS(app, resources={
    r"/*": {  # Allow all routes
        "origins": ["http://localhost:5173", "http://localhost:3000"],
        "supports_credentials": True,
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# -------------------- UTILITY FUNCTIONS --------------------
def generate_otp():
    """Generate a 6-digit OTP."""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp):
    """Sends an OTP email to the user."""
    try:
        msg = Message(
            'Your Verification Code',
            sender=app.config['MAIL_DEFAULT_SENDER'],
            recipients=[email]
        )
        msg.body = f'Your verification code is: {otp}'
        mail.send(msg)
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {email}: {e}")
        return False

def get_user_by_referral_code(code):
    # Refer and Earn: Utility to fetch a user by their referral code
    stmt = select(User).where(User.referral_code == code)
    return db.session.execute(stmt).scalar_one_or_none()

def is_group_member(user_id, group_id):
    stmt = select(StokvelMember).where(StokvelMember.user_id == user_id, StokvelMember.group_id == group_id)
    return db.session.execute(stmt).first() is not None

def check_and_process_referral_completion(referee_user):
    # Refer and Earn: Main logic for awarding points and milestone notifications
    stmt = select(Referral).where(
        Referral.referee_id == referee_user.id,
        Referral.status == 'verified'
    )
    referral = db.session.execute(stmt).scalar_one_or_none()

    if not referral:
        return  # No active referral found for this user.

    # Ensure the check only proceeds if the referee has completed both steps
    if not (referee_user.is_verified and referee_user.kyc_completed):
        return

    # Avoid processing the same referral twice
    if referral.status == 'completed':
        return

    referral.status = 'completed'

    referrer = db.session.get(User, referral.referrer_id)
    if not referrer:
        return

    # --- Refer and Earn: Points and Milestone Logic ---
    referrer.valid_referrals += 1

    if referrer.valid_referrals == 1:
        # Refer and Earn: First referral unlock bonus (20 pts)
        referrer.points += 20
        # Refer and Earn: Notification for unlock bonus
        unlock_notification = Notification(
            user_id=referrer.id,
            title="Referral Bonus Unlocked!",
            message="Congratulations! Your first successful referral earned you a 20 point unlock bonus. You now get points for every new referral."
        )
        db.session.add(unlock_notification)
    else:
        # Refer and Earn: Base points for every referral after the first (30 pts)
        referrer.points += 30
        
        # Refer and Earn: Milestone bonus every 3rd referral (100 pts)
        if referrer.valid_referrals > 0 and referrer.valid_referrals % 3 == 0:
            referrer.points += 100
            # Refer and Earn: Notification for milestone
            milestone_notification = Notification(
                user_id=referrer.id,
                title="🎉 Milestone Reached! 🎉",
                message=f"Amazing! You've reached {referrer.valid_referrals} successful referrals and earned a 100 point bonus!"
            )
            db.session.add(milestone_notification)

# -------------------- MODELS Changes made here------------------

# -------------------- iDeals Feature: Voucher Model --------------------
# This model tracks each voucher redemption for a user and a specific store.
# Used for the iDeals (Redeeming Points) page to generate and manage store vouchers.
class Voucher(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    store = db.Column(db.String(50), nullable=False)
    voucher_code = db.Column(db.String(20), unique=True, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    points_used = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='active')  # active, redeemed, expired
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
    kyc_completed = db.Column(db.Boolean, default=False)
    two_factor_enabled = db.Column(db.Boolean, default=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    referral_code = db.Column(db.String(8), unique=True, nullable=False, default=lambda: uuid.uuid4().hex[:8].upper())
    points = db.Column(db.Integer, default=0)
    valid_referrals = db.Column(db.Integer, default=0)
    __table_args__ = (
        db.Index('idx_user_email', 'email'),
        db.Index('idx_user_phone', 'phone'),
    )

    def __init__(self, full_name, phone, email, password=None, role='member', is_verified=False, **kwargs):
        self.full_name = full_name
        self.phone = phone
        self.email = email
        if password:
            self.set_password(password)
        self.role = role
        self.is_verified = is_verified

    def set_password(self, password):
        self.password = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password, password)

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "phone": self.phone,
            "role": self.role,
            "is_verified": self.is_verified,
            "kyc_completed": self.kyc_completed,
            "points": self.points,
            "valid_referrals": self.valid_referrals,
            "referral_code": self.referral_code,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

class OTP(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    user = db.relationship('User', backref=db.backref('otps', lazy=True))

    def __init__(self, user_id, code):
        self.user_id = user_id
        self.code = code
        self.expires_at = datetime.utcnow() + timedelta(minutes=10) # OTP is valid for 10 minutes

class StokvelGroup(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    contribution_amount = db.Column(db.Float, nullable=False)
    frequency = db.Column(db.String(50), nullable=False)  # weekly, monthly, etc.
    max_members = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    group_code = db.Column(db.String(10), unique=True)  # Add this for group joining
    admin_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # Group admin
    members = db.relationship('StokvelMember', backref='group', lazy=True)

    def __init__(self, name, description, contribution_amount, frequency, max_members, admin_id, group_code=None, **kwargs):
        self.name = name
        self.description = description
        self.contribution_amount = contribution_amount
        self.frequency = frequency
        self.max_members = max_members
        self.admin_id = admin_id
        self.group_code = group_code

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'contribution_amount': float(self.contribution_amount),
            'frequency': self.frequency,
            'max_members': self.max_members,
            'member_count': len(self.members),
            'group_code': self.group_code,
            'admin_id': self.admin_id,
            'created_at': self.created_at.isoformat()
        }

class StokvelMember(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False, index=True)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='active')  # active, inactive, suspended
    role = db.Column(db.String(20), default='member')  # member, admin
    user = db.relationship('User', backref='memberships')

    def __init__(self, user_id, group_id, joined_at=None, status='active', role='member', **kwargs):
        self.user_id = user_id
        self.group_id = group_id
        if joined_at:
            self.joined_at = joined_at
        self.status = status
        self.role = role

class Contribution(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('stokvel_member.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(50), default='pending')  # pending, confirmed, rejected
    member = db.relationship('StokvelMember', backref='contributions')

    def __init__(self, member_id, amount, date=None, status='pending', **kwargs):
        self.member_id = member_id
        self.amount = amount
        if date:
            self.date = date
        self.status = status

    def to_dict(self):
        return {
            "id": self.id,
            "amount": self.amount,
            "date": self.date.isoformat() if self.date else None,
            "status": self.status,
            "member_id": self.member_id
        }

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    end_date = db.Column(db.DateTime)
    status = db.Column(db.String(50), default='active')  # active, closed
    group = db.relationship('StokvelGroup', backref='polls')

    def __init__(self, group_id, title, description=None, end_date=None, status='active', **kwargs):
        self.group_id = group_id
        self.title = title
        self.description = description
        if end_date:
            self.end_date = end_date
        self.status = status

class PollOption(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    text = db.Column(db.String(200), nullable=False)
    votes = db.Column(db.Integer, default=0)
    poll = db.relationship('Poll', backref='options')

    def __init__(self, poll_id, text, votes=0, **kwargs):
        self.poll_id = poll_id
        self.text = text
        self.votes = votes

class Meeting(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    group_id = db.Column(db.Integer, db.ForeignKey('stokvel_group.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    date = db.Column(db.DateTime, nullable=False)
    location = db.Column(db.String(200))
    status = db.Column(db.String(50), default='scheduled')  # scheduled, completed, cancelled
    group = db.relationship('StokvelGroup', backref='meetings')

    def __init__(self, group_id, title, date, description=None, location=None, status='scheduled', **kwargs):
        self.group_id = group_id
        self.title = title
        self.date = date
        self.description = description
        self.location = location
        self.status = status

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

    def __init__(self, member_id, amount, reason=None, created_at=None, status='pending', approvals_needed=2, approvals_received=0, **kwargs):
        self.member_id = member_id
        self.amount = amount
        self.reason = reason
        if created_at:
            self.created_at = created_at
        self.status = status
        self.approvals_needed = approvals_needed
        self.approvals_received = approvals_received

class Wallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    balance = db.Column(db.Float, default=0.00)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user = db.relationship('User', backref='wallet')

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    title = db.Column(db.String(100), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic'))

    def __init__(self, user_id, title, message, **kwargs):
        self.user_id = user_id
        self.title = title
        self.message = message

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat()
        }

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

class UserSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    user_agent = db.Column(db.String(500))
    ip_address = db.Column(db.String(45))
    login_time = db.Column(db.DateTime, default=datetime.utcnow)
    last_activity = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)

    user = db.relationship('User', backref=db.backref('sessions', lazy=True))

    def __init__(self, user_id, user_agent=None, ip_address=None, login_time=None, last_activity=None, is_active=True, **kwargs):
        self.user_id = user_id
        self.user_agent = user_agent
        self.ip_address = ip_address
        if login_time:
            self.login_time = login_time
        if last_activity:
            self.last_activity = last_activity
        self.is_active = is_active

class Referral(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    referee_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # Refer and Earn: pending, verified, completed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    __table_args__ = (
        db.UniqueConstraint('referrer_id', 'referee_id', name='uq_referral_pair'),
    )
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_sent')
    referee = db.relationship('User', foreign_keys=[referee_id], backref='referrals_received')

    def __init__(self, referrer_id, referee_id, status='pending', created_at=None, **kwargs):
        self.referrer_id = referrer_id
        self.referee_id = referee_id
        self.status = status
        if created_at:
            self.created_at = created_at

# -------------------- DECORATORS --------------------
def token_required(f):
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user_id = get_jwt_identity()
        current_user = db.session.get(User, current_user_id)
        if not current_user:
            return jsonify({'error': 'User not found'}), 404
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
            payload = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            user = db.session.get(User, payload['user_id'])
            
            if not user or user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
                
            return f(*args, **kwargs)
        except pyjwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except pyjwt.InvalidTokenError:
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
                payload = pyjwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                user = db.session.get(User, payload['user_id'])
                
                if not user:
                    return jsonify({'error': 'User not found'}), 401
                
                if user.role not in allowed_roles:
                    return jsonify({'error': 'Insufficient permissions'}), 403
                    
                return f(*args, **kwargs)
            except pyjwt.ExpiredSignatureError:
                return jsonify({'error': 'Token has expired'}), 401
            except pyjwt.InvalidTokenError:
                return jsonify({'error': 'Invalid token'}), 401
                
        return decorated_function
    return decorator

# -------------------- ROUTES --------------------


@app.route('/api/test', methods=['GET'])
def test():
    logger.debug('Test route accessed')
    return jsonify({"message": "Server is working!"}), 200

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        response = make_response()
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:5173')
        response.headers.add('Access-Control-Allow-Headers', request.headers.get('Access-Control-Request-Headers'))
        response.headers.add('Access-Control-Allow-Methods', request.headers.get('Access-Control-Request-Method'))
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Max-Age', '3600')
        return response, 200

    if request.method == 'POST':
        try:
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            email = data.get('email')
            password = data.get('password')
            full_name = data.get('full_name')
            phone = data.get('phone')
            referral_code = data.get('referral_code') or request.args.get('ref')

            # Check if user already exists
            stmt = select(User).where(User.email == email)
            existing_user = db.session.execute(stmt).scalar_one_or_none()

            if existing_user:
                # If user exists but is not verified, resend OTP
                if not existing_user.is_verified:
                    otp_code = generate_otp()
                    new_otp = OTP(user_id=existing_user.id, code=otp_code)
                    db.session.add(new_otp)
                    db.session.commit()
                    send_otp_email(existing_user.email, otp_code)
                    return jsonify({
                        'message': 'User already exists. A new verification code has been sent.',
                        'user_id': existing_user.id,
                        'TESTING_OTP': otp_code
                    }), 200
                else:
                    return jsonify({'error': 'Email already registered and verified'}), 400

            # Create new user (unverified)
            user = User(
                email=email,
                full_name=full_name,
                phone=phone,
                role='member',
                is_verified=False
            )
            user.set_password(password)
            db.session.add(user)
            db.session.flush()

            # Generate and send OTP
            otp_code = generate_otp()
            new_otp = OTP(user_id=user.id, code=otp_code)
            db.session.add(new_otp)
            send_otp_email(user.email, otp_code)

            # --- Referral logic ---
            if referral_code:
                referrer = get_user_by_referral_code(referral_code)
                if referrer:
                    # Refer and Earn: Create a pending referral record
                    referral = Referral(referrer_id=referrer.id, referee_id=user.id, status='pending')
                    db.session.add(referral)
                    # DO NOT increment valid_referrals here. It happens upon verification.

            db.session.commit()

            return jsonify({
                'message': 'Registration successful. Please check your email for a verification code.',
                'user_id': user.id,
                'TESTING_OTP': otp_code
            }), 201

        except Exception as e:
            db.session.rollback()
            print(f"Error during registration: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'An unexpected error occurred during registration'}), 500

@app.route('/api/auth/verify', methods=['POST'])
def verify_otp():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        otp_code = data.get('otp')

        if not user_id or not otp_code:
            return jsonify({'error': 'User ID and OTP are required'}), 400

        # Find the OTP in the database
        stmt = select(OTP).where(OTP.user_id == user_id, OTP.code == otp_code)
        otp_entry = db.session.execute(stmt).scalar_one_or_none()

        if not otp_entry:
            return jsonify({'error': 'Invalid OTP'}), 400

        if datetime.utcnow() > otp_entry.expires_at:
            return jsonify({'error': 'OTP has expired'}), 400

        # Update user to verified status
        user = db.session.get(User, user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        user.is_verified = True

        # --- Referral Validation Logic ---
        # Check if this user was referred by someone.
        stmt = select(Referral).where(Referral.referee_id == user.id, Referral.status == 'pending')
        pending_referral = db.session.execute(stmt).scalar_one_or_none()
        
        if pending_referral:
            # Mark the referral as 'verified'. Points are awarded later.
            pending_referral.status = 'verified'
        
        # Refer and Earn: Check for referral completion (awards points if KYC is also done)
        check_and_process_referral_completion(user)
        
        db.session.delete(otp_entry) # OTP is used, so delete it
        db.session.commit()
        
        # Automatically log the user in by creating a token
        access_token = create_access_token(identity=str(user.id))

        return jsonify({
            'message': 'Account verified successfully. You are now logged in.',
            'access_token': access_token,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during OTP verification: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred during verification'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    stmt = select(User).where(User.email == email)
    user = db.session.execute(stmt).scalar_one_or_none()

    if not user or not user.check_password(password):
        return jsonify({'error': 'Invalid email or password'}), 401

    if not user.is_verified:
        return jsonify({
            "success": False,
            "message": "Account not verified. Please check your email for the verification code.",
            "verification_required": True,
            "user_id": user.id
        }), 401

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
@jwt_required()
def get_current_user():
    # Refer and Earn: Returns points, valid_referrals, and referral_code in user object
    user_id = get_jwt_identity()
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify(user.to_dict())

@app.route('/api/user/referral-details', methods=['GET'])
@token_required
def get_user_referral_details(current_user):
    # Refer and Earn: Returns referral code and referral link for sharing
    try:
        # 1. Get the user's unique referral code
        referral_code = current_user.referral_code

        # 2. Get your Facebook App ID from the server configuration
        facebook_app_id = app.config.get('FACEBOOK_OAUTH_CLIENT_ID')

        # This is the base URL of your frontend website.
        # !!! IMPORTANT: Change this to your actual domain !!!
        base_frontend_url = "https://your-app-website.com" 

        # 3. Create the full referral link
        referral_link = f"{base_frontend_url}/signup?ref={referral_code}"
        
        # 4. Return all the info the frontend needs
        return jsonify({
            'referral_code': referral_code,
            'referral_link': referral_link,
            'facebook_app_id': facebook_app_id
        }), 200

    except Exception as e:
        logger.error(f"Error fetching referral details: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

@app.route('/api/user/kyc', methods=['POST'])
@token_required
def complete_kyc(current_user):
    # Refer and Earn: Completing KYC may trigger referral completion and points
    try:
        if current_user.kyc_completed:
            return jsonify({'message': 'KYC already completed'}), 200

        current_user.kyc_completed = True
        
        # Check if this action completes a referral
        check_and_process_referral_completion(current_user)

        db.session.commit()
        
        return jsonify({
            'message': 'KYC process completed successfully.',
            'user': current_user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during KYC completion: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred during KYC completion'}), 500

# -------------------- iDeals Feature: Rewards Catalog --------------------
# This catalog defines the available rewards and their point values.
# Used for reference in the iDeals and redeem endpoints.
REWARD_CATALOG = {
    'airtime_10': {'points': 100, 'description': 'R10 Airtime or Mobile Data'},
    'voucher_50': {'points': 500, 'description': 'R50 Grocery Voucher'},
    'credit_100': {'points': 1000, 'description': 'R100 Wallet Credit'},
}

# -------------------- iDeals Feature: Rewards Catalog Endpoint --------------------
# Returns the available rewards catalog for the frontend to display.
@app.route('/api/user/points/rewards', methods=['GET'])
@token_required
def get_rewards_catalog(current_user):
    """Returns the available rewards catalog."""
    return jsonify(REWARD_CATALOG)

# -------------------- iDeals Feature: Store-Specific Redeem Endpoint --------------------
# Allows users to redeem points for a store-specific voucher.
# Generates a unique voucher code, deducts points, and creates a Voucher record.
# Returns voucher details (code, store, amount, expiry) to the user.
@app.route('/api/redeem', methods=['POST'])
@token_required
def redeem_points(current_user):
    data = request.get_json()
    store = data.get('store')
    points = int(data.get('points'))

    # Conversion: 100 points = R10
    if points < 100 or points % 100 != 0:
        return jsonify({'error': 'Redeem in multiples of 100 points'}), 400

    if current_user.points < points:
        return jsonify({'error': 'Insufficient points'}), 400

    amount = points * 0.10
    voucher_code = f"{store[:3].upper()}-{uuid.uuid4().hex[:6].upper()}"
    expires_at = datetime.utcnow() + timedelta(days=7)

    # Create a new voucher record for this redemption
    voucher = Voucher(
        user_id=current_user.id,
        store=store,
        voucher_code=voucher_code,
        amount=amount,
        points_used=points,
        expires_at=expires_at
    )
    current_user.points -= points
    db.session.add(voucher)
    db.session.commit()

    return jsonify({
        'voucher_code': voucher_code,
        'store': store,
        'amount': amount,
        'expires_at': expires_at.isoformat()
    }), 201

@app.route('/api/admin/groups', methods=['GET'])
@token_required
def get_admin_groups(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    stmt = select(StokvelGroup)
    groups = db.session.execute(stmt).scalars().all()
    return jsonify([group.to_dict() for group in groups]), 200

@app.route('/api/admin/stats', methods=['GET'])
@token_required
def get_admin_stats(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403

    user_count = db.session.execute(select(func.count(User.id))).scalar()
    group_count = db.session.execute(select(func.count(StokvelGroup.id))).scalar()
    contribution_sum = db.session.execute(select(func.sum(Contribution.amount))).scalar() or 0.0
    withdrawal_count = db.session.execute(select(func.count(WithdrawalRequest.id))).scalar()

    return jsonify({
        'user_count': user_count,
        'group_count': group_count,
        'total_contributions': float(contribution_sum),
        'withdrawal_count': withdrawal_count
    }), 200

@app.route('/api/admin/groups', methods=['POST'])
@token_required
def create_stokvel_group(current_user):
    if current_user.role != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'description', 'contribution_amount', 'frequency', 'max_members']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            admin_id=current_user.id
        )
        
        db.session.add(new_group)
        try:
            db.session.commit()
            return jsonify({
                'id': new_group.id,
                'name': new_group.name,
                'description': new_group.description,
                'contribution_amount': new_group.contribution_amount,
                'frequency': new_group.frequency,
                'max_members': new_group.max_members,
                'member_count': 0,
                'created_at': new_group.created_at.isoformat()
            }), 201
        except SQLAlchemyError as e:
            db.session.rollback()
            return jsonify({'error': 'Database error occurred'}), 500
        
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
    admin = User(
        full_name='Admin User',
        email='admin@example.com',
        phone='1234567890',
        role='admin'
    )
    admin.set_password('admin123')
    db.session.add(admin)
    db.session.commit()
    click.echo('Created admin user.')

@app.cli.command('reset-db')
@with_appcontext
def reset_db():
    """More robustly drops and recreates all database tables."""
    click.echo('Resetting the database...')
    try:
        # We execute raw SQL to drop the schema. This is the most
        # reliable way to clean everything, including leftover tables
        # and dependencies that SQLAlchemy's drop_all() can miss.
        db.session.execute(text('DROP SCHEMA public CASCADE;'))
        db.session.execute(text('CREATE SCHEMA public;'))
        db.session.commit()
        click.echo('Database schema has been completely reset.')

        # Now, recreate all tables from the models
        db.create_all()
        click.echo('All tables have been recreated successfully.')
        click.echo('Database reset complete.')
    except Exception as e:
        db.session.rollback()
        click.echo(f"An error occurred: {e}")

@app.cli.command('reset-users')
@with_appcontext
def reset_users():
    """Delete all users and their OTPs from the database"""
    try:
        # This is a cascading delete, be careful.
        # It's better to delete in order of dependency.
        db.session.execute(text('DELETE FROM "referral"'))
        db.session.execute(text('DELETE FROM "stokvel_member"'))
        db.session.execute(text('DELETE FROM "otp"'))
        db.session.execute(text('DELETE FROM "user"'))
        db.session.commit()
        print('All users and related membership/referral data deleted successfully')
    except Exception as e:
        db.session.rollback()
        print(f'Error: {str(e)}')

@app.route('/api/polls', methods=['GET'])
@token_required
def get_polls(current_user):
    group_id = request.args.get('group_id')
    if not group_id:
        return jsonify({'error': 'Group ID is required'}), 400
    if not is_group_member(current_user.id, group_id):
        return jsonify({'error': 'You are not a member of this group'}), 403
    
    stmt = select(Poll).where(Poll.group_id == group_id)
    polls = db.session.execute(stmt).scalars().all()

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
    group_id = data.get('group_id')
    if not group_id:
        return jsonify({'error': 'Group ID is required'}), 400
    # Optionally, check if user is a member of this group
    if not is_group_member(current_user.id, group_id):
        return jsonify({'error': 'You are not a member of this group'}), 403
    
    poll = Poll(
        group_id=group_id,
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
    # This assumes a user can only be in one group, which might not be correct.
    # A better implementation would pass group_id as an argument.
    # For now, we'll leave it but it's a potential bug.
    if not hasattr(current_user, 'group_id'):
         return jsonify({'error': 'This endpoint requires a group context.'}), 400

    stmt = select(Meeting).where(Meeting.group_id == current_user.group_id)
    meetings = db.session.execute(stmt).scalars().all()
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
    group_id = data.get('group_id')
    if not group_id:
        return jsonify({'error': 'Group ID is required'}), 400
    membership = StokvelMember.query.filter_by(user_id=current_user.id, group_id=group_id).first()
    if not membership:
        return jsonify({'error': 'You are not a member of this group'}), 403
    meeting = Meeting(
        group_id=group_id,
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
    # This might need to be filtered by group as well
    stmt = select(WithdrawalRequest).join(StokvelMember).where(StokvelMember.user_id == current_user.id)
    withdrawals = db.session.execute(stmt).scalars().all()

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
    group_id = data.get('group_id')
    if not group_id:
        return jsonify({'error': 'Group ID is required'}), 400
    
    stmt = select(StokvelMember).where(StokvelMember.user_id == current_user.id, StokvelMember.group_id == group_id)
    membership = db.session.execute(stmt).scalar_one_or_none()

    if not membership:
        return jsonify({'error': 'You are not a member of this group'}), 403

    withdrawal = WithdrawalRequest(
        member_id=membership.id,
        amount=data['amount'],
        reason=data.get('reason'),
        approvals_needed=data.get('approvals_needed', 2)
    )
    db.session.add(withdrawal)
    db.session.commit()
    return jsonify({'message': 'Withdrawal request created successfully', 'withdrawal_id': withdrawal.id})

@app.route('/api/groups/available', methods=['GET'])
@token_required
def get_available_groups(current_user):
    try:
        # Get all groups that the user is not a member of
        subquery = select(StokvelMember.group_id).where(StokvelMember.user_id == current_user.id)
        stmt = select(StokvelGroup).where(StokvelGroup.id.not_in(subquery))
        available_groups = db.session.execute(stmt).scalars().all()
        
        return jsonify({
            'groups': [{
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'contributionAmount': float(group.contribution_amount),
                'contributionFrequency': group.frequency,
                'memberCount': len(group.members),
                'maxMembers': group.max_members,
                'status': 'active'
            } for group in available_groups]
        })
    except Exception as e:
        print(f"Error fetching available groups: {str(e)}")
        return jsonify({'error': 'Failed to fetch available groups'}), 500

@app.route('/api/groups/<int:group_id>/contributions', methods=['POST'])
@token_required
def make_contribution(current_user, group_id):
    """Allows a user to make a contribution to a stokvel group they are a member of."""
    try:
        data = request.get_json()
        amount = data.get('amount')

        if not amount or not isinstance(amount, (int, float)) or amount <= 0:
            return jsonify({'error': 'A valid contribution amount is required.'}), 400

        # Verify the user is a member of the group
        stmt = select(StokvelMember).where(
            StokvelMember.user_id == current_user.id,
            StokvelMember.group_id == group_id,
            StokvelMember.status == 'active'
        )
        membership = db.session.execute(stmt).scalar_one_or_none()

        if not membership:
            return jsonify({'error': 'You are not an active member of this group.'}), 403

        # Create the contribution record
        new_contribution = Contribution(
            member_id=membership.id,
            amount=float(amount),
            status='confirmed' # Assuming direct confirmation for simplicity
        )
        db.session.add(new_contribution)

        # Check if this action completes a referral
        check_and_process_referral_completion(current_user)
        
        db.session.commit()

        return jsonify({
            'message': f'Contribution of {amount} to group {group_id} was successful.',
            'contribution': new_contribution.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        logger.error(f"Error during contribution: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred during contribution'}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def get_dashboard_stats(current_user):
    try:
        # Get user's role in each group
        stmt = select(StokvelMember).where(StokvelMember.user_id == current_user.id)
        memberships = db.session.execute(stmt).scalars().all()
        is_group_admin = any(m.role == 'admin' for m in memberships)
        
        # Get user's active groups
        active_groups = [m.group for m in memberships if m.status == 'active']
        
        # Get total contributions
        stmt = select(func.sum(Contribution.amount)).join(StokvelMember).where(StokvelMember.user_id == current_user.id)
        total_contributions = db.session.execute(stmt).scalar() or 0.0

        # Get recent transactions
        stmt = select(Contribution).join(StokvelMember).where(StokvelMember.user_id == current_user.id).order_by(Contribution.date.desc()).limit(5)
        recent_transactions = db.session.execute(stmt).scalars().all()

        # Get monthly contribution summary
        stmt = select(
            func.to_char(Contribution.date, 'YYYY-MM').label('month'),
            func.sum(Contribution.amount).label('total')
        ).join(StokvelMember).where(StokvelMember.user_id == current_user.id).group_by('month').order_by('month')
        monthly_contributions = db.session.execute(stmt).all()

        # Get wallet balance
        wallet_balance = current_user.wallet[0].balance if current_user.wallet else 0.0

        # Get group-specific stats if user is a group admin
        group_stats = []
        if is_group_admin:
            for membership in memberships:
                if membership.role == 'admin':
                    group = membership.group
                    stmt = select(func.sum(Contribution.amount)).join(StokvelMember).where(StokvelMember.group_id == group.id)
                    group_contributions = db.session.execute(stmt).scalar() or 0.0
                    
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
                'contribution_amount': float(g.contribution_amount),
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
        group_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while db.session.execute(select(StokvelGroup).where(StokvelGroup.group_code == group_code)).first():
            group_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

        # Create new stokvel group
        new_group = StokvelGroup(
            name=data['name'],
            description=data['description'],
            contribution_amount=float(data['contribution_amount']),
            frequency=data['frequency'],
            max_members=int(data['max_members']),
            admin_id=current_user.id,
            group_code=group_code
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
        stmt = select(StokvelGroup).where(StokvelGroup.group_code == group_code)
        group = db.session.execute(stmt).scalar_one_or_none()
        if not group:
            return jsonify({'error': 'Invalid group code'}), 404
            
        # Check if user is already a member
        if is_group_member(current_user.id, group.id):
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
    return re.match(r"[^@]+@[^@]+\.[^@]+", email) is not None

def validate_phone(phone):
    return re.match(r"^\+?\d{10,15}$", phone) is not None

@app.route('/api/auth/facebook')
def facebook_login():
    if not facebook.authorized:
        return redirect(url_for('facebook.login'))
    resp = facebook.get('/me?fields=id,name,email')
    if not resp.ok:
        return jsonify({'error': 'Failed to fetch user info from Facebook'}), 400
    fb_info = resp.json()
    email = fb_info.get('email')
    full_name = fb_info.get('name')
    facebook_id = fb_info.get('id')

    # Check if user exists
    stmt = select(User).where(User.email == email)
    user = db.session.execute(stmt).scalar_one_or_none()

    if not user:
        # Register new user
        user = User(
            email=email,
            full_name=full_name,
            phone='',  # Facebook may not provide phone
            role='member',
            is_verified=True  # Facebook login is considered verified
        )
        db.session.add(user)
        db.session.commit()

    # Log the user in (issue JWT)
    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "success": True,
        "message": "Facebook login successful",
        "access_token": access_token,
        "user": user.to_dict()
    }), 200

@app.errorhandler(Exception)
def handle_error(error):
    # Let Flask handle HTTP errors (like 404, 405, etc.) with its default pages
    if isinstance(error, HTTPException):
        return error

    logger.error(f"Unhandled error: {str(error)}")
    if isinstance(error, SQLAlchemyError):
        db.session.rollback()
        return jsonify({"error": "Database error occurred"}), 500
    if isinstance(error, (pyjwt.ExpiredSignatureError, JWTExtendedException)):
        return jsonify({"error": "Token has expired"}), 401
    if isinstance(error, pyjwt.InvalidTokenError):
        return jsonify({"error": "Invalid token"}), 401
    return jsonify({"error": "An unexpected error occurred"}), 500

# -------------------- MAIN --------------------
@event.listens_for(Engine, "connect")
def connect(dbapi_connection, connection_record):
    connection_record.info['pid'] = os.getpid()

@event.listens_for(Engine, "checkout")
def checkout(dbapi_connection, connection_record, connection_proxy):
    pid = os.getpid()
    if connection_record.info['pid'] != pid:
        connection_record.info['pid'] = pid
        connection_record.info['checked_out'] = time.time()

def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=app.config['CELERY_RESULT_BACKEND'],
        broker=app.config['CELERY_BROKER_URL']
    )
    celery.conf.update(app.config)
    return celery

celery = make_celery(app)

@app.route('/api/dashboard/summary', methods=['GET'])
@jwt_required()
def dashboard_summary():
    user_id = get_jwt_identity()
    result = db.session.execute(
        text("SELECT * FROM user_dashboard_summary WHERE user_id = :uid"), {'uid': user_id}
    ).fetchone()
    return jsonify(dict(result)) if result else jsonify({})

# Add Facebook OAuth blueprint
facebook_bp = make_facebook_blueprint(
    client_id=app.config['FACEBOOK_OAUTH_CLIENT_ID'],
    client_secret=app.config['FACEBOOK_OAUTH_CLIENT_SECRET'],
    redirect_to='facebook_login'
)
app.register_blueprint(facebook_bp, url_prefix="/login")

# --- NOTIFICATION ROUTES ---

@app.route('/api/user/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    # Refer and Earn: Used to fetch referral milestone/unlock notifications
    try:
        # The backref is 'notifications' with lazy='dynamic', so it's a query object
        notifications_query = current_user.notifications.order_by(Notification.created_at.desc())
        notifications = notifications_query.all()
        
        return jsonify({
            'notifications': [n.to_dict() for n in notifications],
            'unread_count': notifications_query.filter_by(is_read=False).count()
        }), 200
    except Exception as e:
        logger.error(f"Error fetching notifications for user {current_user.id}: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred while fetching notifications.'}), 500

@app.route('/api/user/notifications/mark-as-read', methods=['POST'])
@token_required
def mark_notifications_as_read(current_user):
    # Refer and Earn: Used to mark referral notifications as read
    try:
        data = request.get_json() or {}
        notification_ids = data.get('notification_ids')

        query = Notification.query.filter_by(user_id=current_user.id, is_read=False)

        if notification_ids and isinstance(notification_ids, list):
            # Only mark specific notifications if a non-empty list is provided
            if len(notification_ids) > 0:
                query = query.filter(Notification.id.in_(notification_ids))
        
        # If no list is provided, the query marks all unread notifications.
        updated_count = query.update({'is_read': True}, synchronize_session=False)
        db.session.commit()
        
        return jsonify({
            'message': f'{updated_count} notification(s) marked as read.',
        }), 200
    except Exception as e:
        db.session.rollback()
        logger.error(f"Error marking notifications as read for user {current_user.id}: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred.'}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)