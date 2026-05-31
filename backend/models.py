from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), default='student')  # student / admin
    gender = db.Column(db.String(10), default='')
    phone = db.Column(db.String(20), default='')
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True)
    avatar = db.Column(db.String(256), default='')
    created_at = db.Column(db.DateTime, default=datetime.now)

    def to_dict(self):
        from sqlalchemy.orm import object_session
        building_name = ''
        room_number = ''
        if self.room_id:
            room = Room.query.get(self.room_id)
            if room:
                room_number = room.number
                if room.building:
                    building_name = room.building.name
        return {
            'id': self.id, 'username': self.username, 'name': self.name,
            'role': self.role, 'gender': self.gender, 'phone': self.phone,
            'building_id': self.building_id, 'room_id': self.room_id,
            'building': building_name,
            'room': room_number,
            'avatar': self.avatar, 'created_at': self.created_at.isoformat()
        }


class Building(db.Model):
    __tablename__ = 'buildings'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    floors = db.Column(db.Integer, default=6)
    created_at = db.Column(db.DateTime, default=datetime.now)
    rooms = db.relationship('Room', backref='building', lazy=True, cascade='all,delete')

    def to_dict(self):
        return {'id': self.id, 'name': self.name, 'floors': self.floors,
                'room_count': len(self.rooms), 'created_at': self.created_at.isoformat()}


class Room(db.Model):
    __tablename__ = 'rooms'
    id = db.Column(db.Integer, primary_key=True)
    building_id = db.Column(db.Integer, db.ForeignKey('buildings.id'), nullable=False)
    floor = db.Column(db.Integer, nullable=False)
    number = db.Column(db.String(20), nullable=False)
    capacity = db.Column(db.Integer, default=4)
    created_at = db.Column(db.DateTime, default=datetime.now)
    occupants = db.relationship('User', backref='room', lazy=True)

    def to_dict(self):
        return {'id': self.id, 'building_id': self.building_id,
                'building_name': self.building.name if self.building else '',
                'floor': self.floor, 'number': self.number,
                'capacity': self.capacity, 'occupant_count': len(self.occupants),
                'created_at': self.created_at.isoformat()}


class Repair(db.Model):
    __tablename__ = 'repairs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=True)
    type = db.Column(db.String(20), default='other')  # water/electric/furniture/network/other
    description = db.Column(db.Text, default='')
    urgency = db.Column(db.String(10), default='medium')  # low/medium/high
    status = db.Column(db.String(20), default='pending')  # pending/processing/done
    assigned_to = db.Column(db.String(80), default='')
    images = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    user = db.relationship('User', backref='repairs')

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id,
                'user_name': self.user.name if self.user else '',
                'room_id': self.room_id,
                'room_number': self.room.number if self.room else '',
                'building': self.room.building.name if self.room and self.room.building else '',
                'type': self.type, 'description': self.description,
                'urgency': self.urgency, 'status': self.status,
                'assigned_to': self.assigned_to, 'images': self.images,
                'created_at': self.created_at.isoformat(),
                'updated_at': self.updated_at.isoformat()}


class PowerRecord(db.Model):
    __tablename__ = 'power_records'
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    watt = db.Column(db.Float, default=0)
    threshold = db.Column(db.Float, default=2000)
    is_warning = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    room = db.relationship('Room', backref='power_records')

    def to_dict(self):
        return {'id': self.id, 'room_id': self.room_id,
                'room_number': self.room.number if self.room else '',
                'building': self.room.building.name if self.room and self.room.building else '',
                'watt': self.watt, 'threshold': self.threshold,
                'is_warning': self.is_warning,
                'created_at': self.created_at.isoformat()}


class HygieneRecord(db.Model):
    __tablename__ = 'hygiene_records'
    id = db.Column(db.Integer, primary_key=True)
    room_id = db.Column(db.Integer, db.ForeignKey('rooms.id'), nullable=False)
    inspector_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    score = db.Column(db.Integer, default=0)  # 1-10
    level = db.Column(db.String(20), default='good')  # excellent/good/average/poor
    comment = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.now)
    room = db.relationship('Room', backref='hygiene_records')
    inspector = db.relationship('User', backref='inspections')

    def to_dict(self):
        return {'id': self.id, 'room_id': self.room_id,
                'room_number': self.room.number if self.room else '',
                'building': self.room.building.name if self.room and self.room.building else '',
                'inspector_id': self.inspector_id,
                'inspector_name': self.inspector.name if self.inspector else '',
                'score': self.score, 'level': self.level,
                'comment': self.comment,
                'created_at': self.created_at.isoformat()}


class Visitor(db.Model):
    __tablename__ = 'visitors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    visitor_name = db.Column(db.String(80), nullable=False)
    visitor_id_card = db.Column(db.String(20), default='')
    reason = db.Column(db.Text, default='')
    visit_time = db.Column(db.String(40), default='')
    status = db.Column(db.String(20), default='pending')  # pending/approved/rejected
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', foreign_keys=[user_id], backref='visitors')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id,
                'user_name': self.user.name if self.user else '',
                'room': self.user.room.number if self.user and self.user.room else '',
                'building': self.user.room.building.name if self.user and self.user.room and self.user.room.building else '',
                'visitor_name': self.visitor_name,
                'visitor_id_card': self.visitor_id_card,
                'reason': self.reason, 'visit_time': self.visit_time,
                'status': self.status,
                'reviewer_name': self.reviewer.name if self.reviewer else '',
                'created_at': self.created_at.isoformat()}


class LateReturn(db.Model):
    __tablename__ = 'late_returns'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    reason = db.Column(db.Text, default='')
    expected_time = db.Column(db.String(40), default='')
    actual_time = db.Column(db.String(40), default='')
    status = db.Column(db.String(20), default='pending')  # pending/approved/rejected
    reviewer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', foreign_keys=[user_id], backref='late_returns')
    reviewer = db.relationship('User', foreign_keys=[reviewer_id])

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id,
                'user_name': self.user.name if self.user else '',
                'room': self.user.room.number if self.user and self.user.room else '',
                'building': self.user.room.building.name if self.user and self.user.room and self.user.room.building else '',
                'reason': self.reason, 'expected_time': self.expected_time,
                'actual_time': self.actual_time, 'status': self.status,
                'reviewer_name': self.reviewer.name if self.reviewer else '',
                'created_at': self.created_at.isoformat()}


class MutualAid(db.Model):
    __tablename__ = 'mutual_aids'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(30), default='other')  # delivery/carpool/borrow/study/other
    title = db.Column(db.String(120), default='')
    description = db.Column(db.Text, default='')
    status = db.Column(db.String(20), default='open')  # open/accepted/done
    helper_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', foreign_keys=[user_id], backref='posted_aids')
    helper = db.relationship('User', foreign_keys=[helper_id], backref='helped_aids')

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id,
                'user_name': self.user.name if self.user else '',
                'type': self.type, 'title': self.title,
                'description': self.description, 'status': self.status,
                'helper_id': self.helper_id,
                'helper_name': self.helper.name if self.helper else '',
                'created_at': self.created_at.isoformat()}


class Announcement(db.Model):
    __tablename__ = 'announcements'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, default='')
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    author = db.relationship('User', backref='announcements')

    def to_dict(self):
        return {'id': self.id, 'title': self.title, 'content': self.content,
                'author_id': self.author_id,
                'author_name': self.author.name if self.author else '',
                'is_pinned': self.is_pinned,
                'created_at': self.created_at.isoformat()}


class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(200), default='')
    content = db.Column(db.Text, default='')
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    user = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {'id': self.id, 'user_id': self.user_id,
                'title': self.title, 'content': self.content,
                'is_read': self.is_read,
                'created_at': self.created_at.isoformat()}
