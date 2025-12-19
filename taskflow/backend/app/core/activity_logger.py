from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from app.models.models import ActivityLog
from datetime import datetime

def log_activity(
    db: Session,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    details: Optional[Dict[str, Any]] = None
):
    """
    Ghi log hoạt động vào database
    """
    log = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log)
    db.commit()

def get_recent_activities(db: Session, limit: int = 50, skip: int = 0):
    """
    Lấy danh sách hoạt động gần đây
    """
    return db.query(ActivityLog)\
        .order_by(ActivityLog.created_at.desc())\
        .offset(skip).limit(limit).all()

def get_user_activities(db: Session, user_id: int, limit: int = 30):
    """
    Lấy hoạt động của một user cụ thể
    """
    return db.query(ActivityLog)\
        .filter(ActivityLog.user_id == user_id)\
        .order_by(ActivityLog.created_at.desc())\
        .limit(limit).all()

def get_entity_activities(db: Session, entity_type: str, entity_id: int, limit: int = 20):
    """
    Lấy hoạt động của một entity cụ thể
    """
    return db.query(ActivityLog)\
        .filter(
            ActivityLog.entity_type == entity_type,
            ActivityLog.entity_id == entity_id
        )\
        .order_by(ActivityLog.created_at.desc())\
        .limit(limit).all()

def search_activities(
    db: Session,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 50,
    skip: int = 0
):
    """
    Tìm kiếm hoạt động với các bộ lọc
    """
    query = db.query(ActivityLog)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    if action:
        query = query.filter(ActivityLog.action == action)
    
    if entity_type:
        query = query.filter(ActivityLog.entity_type == entity_type)
    
    if start_date:
        query = query.filter(ActivityLog.created_at >= start_date)
    
    if end_date:
        query = query.filter(ActivityLog.created_at <= end_date)
    
    return query.order_by(ActivityLog.created_at.desc())\
        .offset(skip).limit(limit).all()

def get_activity_stats(db: Session, days: int = 7):
    """
    Thống kê hoạt động trong N ngày gần nhất
    """
    from datetime import timedelta
    import json
    
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Hoạt động theo ngày
    daily_stats = db.query(
        db.func.date(ActivityLog.created_at).label('date'),
        db.func.count(ActivityLog.id).label('count')
    ).filter(
        ActivityLog.created_at >= start_date,
        ActivityLog.created_at <= end_date
    ).group_by(db.func.date(ActivityLog.created_at)).all()
    
    # Hoạt động theo loại
    type_stats = db.query(
        ActivityLog.entity_type,
        db.func.count(ActivityLog.id).label('count')
    ).filter(
        ActivityLog.created_at >= start_date,
        ActivityLog.created_at <= end_date
    ).group_by(ActivityLog.entity_type).all()
    
    # Hoạt động theo hành động
    action_stats = db.query(
        ActivityLog.action,
        db.func.count(ActivityLog.id).label('count')
    ).filter(
        ActivityLog.created_at >= start_date,
        ActivityLog.created_at <= end_date
    ).group_by(ActivityLog.action).all()
    
    # Top users hoạt động nhiều nhất
    top_users = db.query(
        ActivityLog.user_id,
        db.func.count(ActivityLog.id).label('count')
    ).filter(
        ActivityLog.created_at >= start_date,
        ActivityLog.created_at <= end_date
    ).group_by(ActivityLog.user_id)\
     .order_by(db.func.count(ActivityLog.id).desc())\
     .limit(10).all()
    
    return {
        "period": f"{days} days",
        "total_activities": sum([stat[1] for stat in daily_stats]),
        "daily_stats": [{"date": stat[0], "count": stat[1]} for stat in daily_stats],
        "type_stats": [{"type": stat[0], "count": stat[1]} for stat in type_stats],
        "action_stats": [{"action": stat[0], "count": stat[1]} for stat in action_stats],
        "top_users": [{"user_id": stat[0], "count": stat[1]} for stat in top_users]
    }