"""Seed database with demo data"""
import random
from datetime import datetime, timedelta
from app import app, db
from models import (
    User, Building, Room, Repair, PowerRecord,
    HygieneRecord, Visitor, LateReturn, MutualAid,
    Announcement, Notification
)
from werkzeug.security import generate_password_hash


def seed():
    with app.app_context():
        db.drop_all()
        db.create_all()

        # ── Buildings & Rooms ──
        buildings = []
        for name in ['梅园1号楼', '梅园2号楼', '兰园1号楼', '竹园1号楼']:
            b = Building(name=name, floors=random.randint(5, 7))
            db.session.add(b)
            buildings.append(b)
        db.session.commit()

        rooms = []
        for b in buildings:
            for floor in range(1, b.floors + 1):
                for rnum in range(1, 7):
                    room = Room(
                        building_id=b.id, floor=floor,
                        number=f'{floor}0{rnum}', capacity=4
                    )
                    db.session.add(room)
                    rooms.append(room)
        db.session.commit()

        # ── Users ──
        admin = User(
            username='admin', password_hash=generate_password_hash('admin123'),
            name='张管理', role='admin', gender='男', phone='13800000001'
        )
        db.session.add(admin)

        names = ['李明', '王芳', '赵强', '刘洋', '陈静', '杨帆', '黄磊', '周婷',
                 '吴涛', '郑雪', '孙浩', '朱丽', '马超', '胡梅', '林峰']
        students = []
        for i, name in enumerate(names):
            u = User(
                username=f'student{i+1}',
                password_hash=generate_password_hash('123456'),
                name=name,
                role='student',
                gender='男' if i % 3 != 1 else '女',
                phone=f'138{10000000+i:08d}',
                building_id=buildings[i % 4].id,
                room_id=rooms[i].id
            )
            db.session.add(u)
            students.append(u)
        db.session.commit()

        # ── Repairs ──
        types = ['water', 'electric', 'furniture', 'network', 'other']
        urgencies = ['low', 'medium', 'high']
        statuses = ['pending', 'processing', 'done']
        repair_descs = [
            '水龙头漏水，关不紧', '灯管闪烁，需要更换', '桌子腿松动了',
            '网络连接不上', '空调不制冷', '窗户关不严实',
            '马桶冲水失灵', '插座接触不良', '衣柜门合页坏了'
        ]
        for i in range(20):
            r = Repair(
                user_id=students[i % len(students)].id,
                room_id=rooms[i % len(rooms)].id,
                type=random.choice(types),
                description=random.choice(repair_descs),
                urgency=random.choice(urgencies),
                status=random.choice(statuses),
                assigned_to=random.choice(['王师傅', '李师傅', '']) if i > 5 else ''
            )
            db.session.add(r)
        db.session.commit()

        # ── Power Records ──
        for room in rooms[:20]:
            for hour in range(24):
                watt = random.uniform(50, 1800)
                if random.random() < 0.08:
                    watt = random.uniform(2200, 3500)  # warning
                rec = PowerRecord(
                    room_id=room.id, watt=round(watt, 1),
                    threshold=2000, is_warning=watt > 2000
                )
                db.session.add(rec)
        db.session.commit()

        # ── Hygiene Records ──
        comments = ['整洁有序', '物品摆放整齐', '需要加强打扫', '地面有污渍',
                     '垃圾桶未倒', '床铺整理规范', '阳台需要清理']
        levels_map = {9: 'excellent', 7: 'good', 5: 'average'}
        for i in range(30):
            score = random.randint(4, 10)
            level = 'poor'
            for threshold, lv in sorted(levels_map.items(), reverse=True):
                if score >= threshold:
                    level = lv
                    break
            h = HygieneRecord(
                room_id=rooms[i % len(rooms)].id,
                inspector_id=admin.id,
                score=score, level=level,
                comment=random.choice(comments)
            )
            db.session.add(h)
        db.session.commit()

        # ── Visitors ──
        visitor_names = ['张父', '李母', '王兄', '赵姐', '刘友']
        reasons = ['探望学生', '送生活用品', '办理手续', '参加活动']
        for i in range(10):
            v = Visitor(
                user_id=students[i % len(students)].id,
                visitor_name=random.choice(visitor_names),
                visitor_id_card=f'310{random.randint(100000,999999)}X',
                reason=random.choice(reasons),
                visit_time=f'2026-05-{random.randint(20, 31):02d} {random.randint(9,18):02d}:00',
                status=random.choice(['pending', 'approved', 'rejected'])
            )
            db.session.add(v)
        db.session.commit()

        # ── Late Returns ──
        late_reasons = ['图书馆自习', '实验室做项目', '社团活动', '回家晚了', '看病']
        for i in range(8):
            l = LateReturn(
                user_id=students[i % len(students)].id,
                reason=random.choice(late_reasons),
                expected_time=f'2{random.randint(2,23)}:00',
                actual_time='',
                status=random.choice(['pending', 'approved', 'rejected'])
            )
            db.session.add(l)
        db.session.commit()

        # ── Mutual Aid ──
        aid_types = ['delivery', 'carpool', 'borrow', 'study', 'other']
        aid_titles = [
            '帮忙代取快递', '周末拼车去火车站', '借一个排插',
            '一起复习高数', '帮忙带份饭', '借自行车',
            '找人一起打球', '拼单买水果'
        ]
        for i in range(12):
            m = MutualAid(
                user_id=students[i % len(students)].id,
                type=random.choice(aid_types),
                title=random.choice(aid_titles),
                description='有意向的同学请联系我，谢谢！',
                status=random.choice(['open', 'accepted', 'done']),
                helper_id=random.choice(students).id if random.random() > 0.5 else None
            )
            db.session.add(m)
        db.session.commit()

        # ── Announcements ──
        anns = [
            ('关于五一假期宿舍安全的通知', '各位同学：五一假期期间请注意宿舍用电安全，离开宿舍前请关闭所有电源。'),
            ('宿舍卫生检查安排', '本周三下午将进行宿舍卫生检查，请各宿舍做好准备。'),
            ('夏季空调使用须知', '夏季来临，空调使用温度建议设置在26℃以上，避免用电过载。'),
            ('访客管理制度更新', '即日起，所有访客需提前一天在线预约，经管理员审批后方可入内。'),
            ('宿舍报修流程优化', '系统已上线智能报修功能，同学们可通过系统直接提交报修申请。'),
        ]
        for i, (title, content) in enumerate(anns):
            a = Announcement(
                title=title, content=content,
                author_id=admin.id,
                is_pinned=(i == 0)
            )
            db.session.add(a)
        db.session.commit()

        # ── Notifications ──
        for s in students[:5]:
            for title in ['您的报修申请已受理', '卫生检查结果已出', '新公告发布']:
                n = Notification(
                    user_id=s.id, title=title,
                    content=f'{title}，请查看详情。', is_read=random.random() > 0.5
                )
                db.session.add(n)
        db.session.commit()

        print('✅ Seed data created successfully!')
        print(f'   Buildings: {Building.query.count()}')
        print(f'   Rooms: {Room.query.count()}')
        print(f'   Users: {User.query.count()} (admin: admin/admin123, student: student1/123456)')
        print(f'   Repairs: {Repair.query.count()}')
        print(f'   Power Records: {PowerRecord.query.count()}')
        print(f'   Hygiene Records: {HygieneRecord.query.count()}')
        print(f'   Visitors: {Visitor.query.count()}')
        print(f'   Late Returns: {LateReturn.query.count()}')
        print(f'   Mutual Aids: {MutualAid.query.count()}')
        print(f'   Announcements: {Announcement.query.count()}')
        print(f'   Notifications: {Notification.query.count()}')


if __name__ == '__main__':
    seed()
