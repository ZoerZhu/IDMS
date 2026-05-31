import os
from datetime import timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from models import (
    db, User, Building, Room, Repair, PowerRecord,
    HygieneRecord, Visitor, LateReturn, MutualAid,
    Announcement, Notification
)

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///dormitory.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'dormitory-secret-key-2026'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)
db.init_app(app)

with app.app_context():
    db.create_all()


def ok(data=None, msg='success'):
    return jsonify({'code': 0, 'msg': msg, 'data': data})


def fail(msg='error', code=1):
    return jsonify({'code': code, 'msg': msg, 'data': None})


# ─── Auth ───────────────────────────────────────────────
@app.route('/api/login', methods=['POST'])
def login():
    d = request.json
    user = User.query.filter_by(username=d.get('username')).first()
    if not user or not check_password_hash(user.password_hash, d.get('password', '')):
        return fail('用户名或密码错误')
    token = create_access_token(identity=str(user.id))
    return ok({'token': token, 'user': user.to_dict()})


@app.route('/api/register', methods=['POST'])
def register():
    d = request.json
    if User.query.filter_by(username=d.get('username')).first():
        return fail('用户名已存在')
    user = User(
        username=d['username'],
        password_hash=generate_password_hash(d['password']),
        name=d.get('name', d['username']),
        role=d.get('role', 'student'),
        gender=d.get('gender', ''),
        phone=d.get('phone', '')
    )
    db.session.add(user)
    db.session.commit()
    return ok(user.to_dict(), '注册成功')


@app.route('/api/me', methods=['GET'])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    return ok(user.to_dict()) if user else fail('用户不存在')


@app.route('/api/me', methods=['PUT'])
@jwt_required()
def update_me():
    user = User.query.get(int(get_jwt_identity()))
    d = request.json
    for k in ['name', 'gender', 'phone', 'avatar']:
        if k in d:
            setattr(user, k, d[k])
    db.session.commit()
    return ok(user.to_dict())


# ─── Users (admin) ──────────────────────────────────────
@app.route('/api/users', methods=['GET'])
@jwt_required()
def list_users():
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != 'admin':
        return fail('无权限', 403)
    users = User.query.all()
    return ok([u.to_dict() for u in users])


# ─── Buildings ──────────────────────────────────────────
@app.route('/api/buildings', methods=['GET'])
@jwt_required()
def list_buildings():
    bs = Building.query.all()
    return ok([b.to_dict() for b in bs])


@app.route('/api/buildings', methods=['POST'])
@jwt_required()
def create_building():
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != 'admin':
        return fail('无权限', 403)
    d = request.json
    b = Building(name=d['name'], floors=d.get('floors', 6))
    db.session.add(b)
    db.session.commit()
    return ok(b.to_dict())


@app.route('/api/buildings/<int:bid>', methods=['DELETE'])
@jwt_required()
def delete_building(bid):
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != 'admin':
        return fail('无权限', 403)
    b = Building.query.get_or_404(bid)
    db.session.delete(b)
    db.session.commit()
    return ok(None, '已删除')


# ─── Rooms ──────────────────────────────────────────────
@app.route('/api/rooms', methods=['GET'])
@jwt_required()
def list_rooms():
    q = Room.query
    bid = request.args.get('building_id')
    if bid:
        q = q.filter_by(building_id=int(bid))
    return ok([r.to_dict() for r in q.all()])


@app.route('/api/rooms', methods=['POST'])
@jwt_required()
def create_room():
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != 'admin':
        return fail('无权限', 403)
    d = request.json
    r = Room(building_id=d['building_id'], floor=d['floor'],
             number=d['number'], capacity=d.get('capacity', 4))
    db.session.add(r)
    db.session.commit()
    return ok(r.to_dict())


@app.route('/api/rooms/<int:rid>', methods=['DELETE'])
@jwt_required()
def delete_room(rid):
    admin = User.query.get(int(get_jwt_identity()))
    if not admin or admin.role != 'admin':
        return fail('无权限', 403)
    r = Room.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return ok(None, '已删除')


# ─── Repairs ────────────────────────────────────────────
@app.route('/api/repairs', methods=['GET'])
@jwt_required()
def list_repairs():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = Repair.query
    if user.role != 'admin':
        q = q.filter_by(user_id=uid)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    return ok([r.to_dict() for r in q.order_by(Repair.created_at.desc()).all()])


@app.route('/api/repairs', methods=['POST'])
@jwt_required()
def create_repair():
    uid = int(get_jwt_identity())
    d = request.json
    user = User.query.get(uid)
    r = Repair(
        user_id=uid, room_id=user.room_id,
        type=d.get('type', 'other'),
        description=d.get('description', ''),
        urgency=d.get('urgency', 'medium'),
        images=d.get('images', '')
    )
    db.session.add(r)
    db.session.commit()
    return ok(r.to_dict())


@app.route('/api/repairs/<int:rid>', methods=['PUT'])
@jwt_required()
def update_repair(rid):
    r = Repair.query.get_or_404(rid)
    d = request.json
    for k in ['status', 'assigned_to', 'description', 'urgency']:
        if k in d:
            setattr(r, k, d[k])
    db.session.commit()
    return ok(r.to_dict())


@app.route('/api/repairs/<int:rid>', methods=['DELETE'])
@jwt_required()
def delete_repair(rid):
    r = Repair.query.get_or_404(rid)
    db.session.delete(r)
    db.session.commit()
    return ok(None, '已删除')


# ─── Power ──────────────────────────────────────────────
@app.route('/api/power', methods=['GET'])
@jwt_required()
def list_power():
    q = PowerRecord.query
    room_id = request.args.get('room_id')
    if room_id:
        q = q.filter_by(room_id=int(room_id))
    warning = request.args.get('is_warning')
    if warning is not None:
        q = q.filter_by(is_warning=warning == 'true')
    return ok([p.to_dict() for p in q.order_by(PowerRecord.created_at.desc()).limit(100).all()])


@app.route('/api/power/latest', methods=['GET'])
@jwt_required()
def power_latest():
    """Latest power reading per room"""
    rooms = Room.query.all()
    result = []
    for room in rooms:
        rec = PowerRecord.query.filter_by(room_id=room.id)\
            .order_by(PowerRecord.created_at.desc()).first()
        if rec:
            result.append(rec.to_dict())
    return ok(result)


@app.route('/api/power/record', methods=['POST'])
@jwt_required()
def record_power():
    d = request.json
    rec = PowerRecord(
        room_id=d['room_id'], watt=d['watt'],
        threshold=d.get('threshold', 2000),
        is_warning=d['watt'] > d.get('threshold', 2000)
    )
    db.session.add(rec)
    db.session.commit()
    return ok(rec.to_dict())


@app.route('/api/power/stats', methods=['GET'])
@jwt_required()
def power_stats():
    from sqlalchemy import func
    warnings = PowerRecord.query.filter_by(is_warning=True).count()
    total = PowerRecord.query.count()
    avg = db.session.query(func.avg(PowerRecord.watt)).scalar() or 0
    return ok({'warnings': warnings, 'total_records': total, 'avg_watt': round(avg, 1)})


# ─── Hygiene ────────────────────────────────────────────
@app.route('/api/hygiene', methods=['GET'])
@jwt_required()
def list_hygiene():
    q = HygieneRecord.query
    room_id = request.args.get('room_id')
    if room_id:
        q = q.filter_by(room_id=int(room_id))
    return ok([h.to_dict() for h in q.order_by(HygieneRecord.created_at.desc()).all()])


@app.route('/api/hygiene', methods=['POST'])
@jwt_required()
def create_hygiene():
    uid = int(get_jwt_identity())
    d = request.json
    level_map = {9: 'excellent', 7: 'good', 5: 'average'}
    score = d.get('score', 8)
    level = 'poor'
    for threshold, lv in sorted(level_map.items(), reverse=True):
        if score >= threshold:
            level = lv
            break
    h = HygieneRecord(
        room_id=d['room_id'], inspector_id=uid,
        score=score, level=level,
        comment=d.get('comment', '')
    )
    db.session.add(h)
    db.session.commit()
    return ok(h.to_dict())


@app.route('/api/hygiene/<int:hid>', methods=['DELETE'])
@jwt_required()
def delete_hygiene(hid):
    h = HygieneRecord.query.get_or_404(hid)
    db.session.delete(h)
    db.session.commit()
    return ok(None, '已删除')


# ─── Visitors ───────────────────────────────────────────
@app.route('/api/visitors', methods=['GET'])
@jwt_required()
def list_visitors():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = Visitor.query
    if user.role != 'admin':
        q = q.filter_by(user_id=uid)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    return ok([v.to_dict() for v in q.order_by(Visitor.created_at.desc()).all()])


@app.route('/api/visitors', methods=['POST'])
@jwt_required()
def create_visitor():
    uid = int(get_jwt_identity())
    d = request.json
    v = Visitor(
        user_id=uid, visitor_name=d['visitor_name'],
        visitor_id_card=d.get('visitor_id_card', ''),
        reason=d.get('reason', ''),
        visit_time=d.get('visit_time', '')
    )
    db.session.add(v)
    db.session.commit()
    return ok(v.to_dict())


@app.route('/api/visitors/<int:vid>', methods=['PUT'])
@jwt_required()
def update_visitor(vid):
    v = Visitor.query.get_or_404(vid)
    d = request.json
    if 'status' in d:
        v.status = d['status']
        v.reviewer_id = int(get_jwt_identity())
    db.session.commit()
    return ok(v.to_dict())


@app.route('/api/visitors/<int:vid>', methods=['DELETE'])
@jwt_required()
def delete_visitor(vid):
    v = Visitor.query.get_or_404(vid)
    db.session.delete(v)
    db.session.commit()
    return ok(None, '已删除')


# ─── Late Return ────────────────────────────────────────
@app.route('/api/late-returns', methods=['GET'])
@jwt_required()
def list_late_returns():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    q = LateReturn.query
    if user.role != 'admin':
        q = q.filter_by(user_id=uid)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    return ok([l.to_dict() for l in q.order_by(LateReturn.created_at.desc()).all()])


@app.route('/api/late-returns', methods=['POST'])
@jwt_required()
def create_late_return():
    uid = int(get_jwt_identity())
    d = request.json
    l = LateReturn(
        user_id=uid, reason=d.get('reason', ''),
        expected_time=d.get('expected_time', ''),
        actual_time=d.get('actual_time', '')
    )
    db.session.add(l)
    db.session.commit()
    return ok(l.to_dict())


@app.route('/api/late-returns/<int:lid>', methods=['PUT'])
@jwt_required()
def update_late_return(lid):
    l = LateReturn.query.get_or_404(lid)
    d = request.json
    if 'status' in d:
        l.status = d['status']
        l.reviewer_id = int(get_jwt_identity())
    if 'actual_time' in d:
        l.actual_time = d['actual_time']
    db.session.commit()
    return ok(l.to_dict())


@app.route('/api/late-returns/<int:lid>', methods=['DELETE'])
@jwt_required()
def delete_late_return(lid):
    l = LateReturn.query.get_or_404(lid)
    db.session.delete(l)
    db.session.commit()
    return ok(None, '已删除')


# ─── Mutual Aid ─────────────────────────────────────────
@app.route('/api/mutual-aids', methods=['GET'])
@jwt_required()
def list_mutual_aids():
    q = MutualAid.query
    aid_type = request.args.get('type')
    if aid_type:
        q = q.filter_by(type=aid_type)
    status = request.args.get('status')
    if status:
        q = q.filter_by(status=status)
    return ok([m.to_dict() for m in q.order_by(MutualAid.created_at.desc()).all()])


@app.route('/api/mutual-aids', methods=['POST'])
@jwt_required()
def create_mutual_aid():
    uid = int(get_jwt_identity())
    d = request.json
    m = MutualAid(
        user_id=uid, type=d.get('type', 'other'),
        title=d.get('title', ''), description=d.get('description', '')
    )
    db.session.add(m)
    db.session.commit()
    return ok(m.to_dict())


@app.route('/api/mutual-aids/<int:mid>', methods=['PUT'])
@jwt_required()
def update_mutual_aid(mid):
    m = MutualAid.query.get_or_404(mid)
    d = request.json
    uid = int(get_jwt_identity())
    if 'status' in d:
        m.status = d['status']
        if d['status'] == 'accepted' and not m.helper_id:
            m.helper_id = uid
    db.session.commit()
    return ok(m.to_dict())


@app.route('/api/mutual-aids/<int:mid>', methods=['DELETE'])
@jwt_required()
def delete_mutual_aid(mid):
    m = MutualAid.query.get_or_404(mid)
    db.session.delete(m)
    db.session.commit()
    return ok(None, '已删除')


# ─── Announcements ──────────────────────────────────────
@app.route('/api/announcements', methods=['GET'])
@jwt_required()
def list_announcements():
    pinned = Announcement.query.filter_by(is_pinned=True)\
        .order_by(Announcement.created_at.desc()).all()
    rest = Announcement.query.filter_by(is_pinned=False)\
        .order_by(Announcement.created_at.desc()).all()
    return ok([a.to_dict() for a in pinned + rest])


@app.route('/api/announcements', methods=['POST'])
@jwt_required()
def create_announcement():
    uid = int(get_jwt_identity())
    user = User.query.get(uid)
    if not user or user.role != 'admin':
        return fail('无权限', 403)
    d = request.json
    a = Announcement(
        title=d['title'], content=d.get('content', ''),
        author_id=uid, is_pinned=d.get('is_pinned', False)
    )
    db.session.add(a)
    db.session.commit()
    return ok(a.to_dict())


@app.route('/api/announcements/<int:aid>', methods=['DELETE'])
@jwt_required()
def delete_announcement(aid):
    a = Announcement.query.get_or_404(aid)
    db.session.delete(a)
    db.session.commit()
    return ok(None, '已删除')


# ─── Notifications ──────────────────────────────────────
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def list_notifications():
    uid = int(get_jwt_identity())
    ns = Notification.query.filter_by(user_id=uid)\
        .order_by(Notification.created_at.desc()).limit(50).all()
    return ok([n.to_dict() for n in ns])


@app.route('/api/notifications/unread-count', methods=['GET'])
@jwt_required()
def unread_count():
    uid = int(get_jwt_identity())
    count = Notification.query.filter_by(user_id=uid, is_read=False).count()
    return ok({'count': count})


@app.route('/api/notifications/<int:nid>/read', methods=['PUT'])
@jwt_required()
def mark_read(nid):
    n = Notification.query.get_or_404(nid)
    n.is_read = True
    db.session.commit()
    return ok(n.to_dict())


@app.route('/api/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    uid = int(get_jwt_identity())
    Notification.query.filter_by(user_id=uid, is_read=False)\
        .update({'is_read': True})
    db.session.commit()
    return ok(None, '全部已读')


# ─── Statistics ─────────────────────────────────────────
@app.route('/api/statistics', methods=['GET'])
@jwt_required()
def statistics():
    from sqlalchemy import func
    # Repair stats
    repair_total = Repair.query.count()
    repair_pending = Repair.query.filter_by(status='pending').count()
    repair_processing = Repair.query.filter_by(status='processing').count()
    repair_done = Repair.query.filter_by(status='done').count()
    repair_types = db.session.query(Repair.type, func.count(Repair.id))\
        .group_by(Repair.type).all()

    # Hygiene stats
    hygiene_total = HygieneRecord.query.count()
    hygiene_avg = db.session.query(func.avg(HygieneRecord.score)).scalar() or 0

    # Visitor stats
    visitor_total = Visitor.query.count()
    visitor_pending = Visitor.query.filter_by(status='pending').count()

    # Late return stats
    late_total = LateReturn.query.count()
    late_pending = LateReturn.query.filter_by(status='pending').count()

    # Power stats
    power_warnings = PowerRecord.query.filter_by(is_warning=True).count()
    power_avg = db.session.query(func.avg(PowerRecord.watt)).scalar() or 0

    # Mutual aid stats
    aid_total = MutualAid.query.count()
    aid_open = MutualAid.query.filter_by(status='open').count()

    return ok({
        'repair': {'total': repair_total, 'pending': repair_pending,
                    'processing': repair_processing, 'done': repair_done,
                    'types': [{'type': t, 'count': c} for t, c in repair_types]},
        'hygiene': {'total': hygiene_total, 'avg_score': round(hygiene_avg, 1)},
        'visitor': {'total': visitor_total, 'pending': visitor_pending},
        'late_return': {'total': late_total, 'pending': late_pending},
        'power': {'warnings': power_warnings, 'avg_watt': round(power_avg, 1)},
        'mutual_aid': {'total': aid_total, 'open': aid_open}
    })


# ─── Dashboard ──────────────────────────────────────────
@app.route('/api/dashboard', methods=['GET'])
@jwt_required()
def dashboard():
    from sqlalchemy import func
    return ok({
        'repairs': Repair.query.count(),
        'repairs_pending': Repair.query.filter_by(status='pending').count(),
        'hygiene_today': HygieneRecord.query.count(),
        'late_today': LateReturn.query.count(),
        'visitors_pending': Visitor.query.filter_by(status='pending').count(),
        'power_warnings': PowerRecord.query.filter_by(is_warning=True).count(),
        'announcements': Announcement.query.order_by(
            Announcement.created_at.desc()).limit(5).all().__len__(),
        'aids_open': MutualAid.query.filter_by(status='open').count(),
        'users': User.query.count(),
        'buildings': Building.query.count(),
        'rooms': Room.query.count(),
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
