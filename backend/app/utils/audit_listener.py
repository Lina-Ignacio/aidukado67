from sqlalchemy import event, inspect
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog
from app.context import current_user_id
import logging

logger = logging.getLogger(__name__)

EXCLUDED_TABLES = {"audit_log"}  # prevent infinite loop

def get_changed_fields(original: dict, new: dict) -> dict:
    return {k: v for k, v in new.items() if original.get(k) != v}

def model_to_dict(instance) -> dict:
    return {
        c.key: getattr(instance, c.key)
        for c in inspect(instance).mapper.column_attrs
    }

def register_audit_listeners(Base):
    @event.listens_for(Session, "after_flush")
    def after_flush(session, flush_context):
        user_id = current_user_id.get()

        for obj in list(session.new):
            table = obj.__tablename__
            if table in EXCLUDED_TABLES:
                continue
            new_vals = model_to_dict(obj)
            session.add(AuditLog(
                table_name=table,
                record_id=str(new_vals.get("id", "no_id")),
                operation_type="INSERT",
                changed_by=user_id,
                original_values=None,
                new_values=new_vals,
                changed_fields=new_vals
            ))

        for obj in list(session.dirty):
            if not session.is_modified(obj):
                continue
            table = obj.__tablename__
            if table in EXCLUDED_TABLES:
                continue
            new_vals = model_to_dict(obj)
            # Get original values from identity map
            original_vals = {
                attr.key: session.identity_map._dict.get(
                    (type(obj), (getattr(obj, attr.key),)), {}
                )
                for attr in inspect(obj).mapper.column_attrs
            }
            # Simpler way to get originals
            history_dict = {}
            for attr in inspect(obj).attrs:
                hist = attr.load_history()
                if hist.deleted:
                    history_dict[attr.key] = hist.deleted[0]
                else:
                    history_dict[attr.key] = getattr(obj, attr.key)

            changed = get_changed_fields(history_dict, new_vals)
            session.add(AuditLog(
                table_name=table,
                record_id=str(new_vals.get("id", "no_id")),
                operation_type="UPDATE",
                changed_by=user_id,
                original_values=history_dict,
                new_values=new_vals,
                changed_fields=changed
            ))

        for obj in list(session.deleted):
            table = obj.__tablename__
            if table in EXCLUDED_TABLES:
                continue
            original_vals = model_to_dict(obj)
            session.add(AuditLog(
                table_name=table,
                record_id=str(original_vals.get("id", "no_id")),
                operation_type="DELETE",
                changed_by=user_id,
                original_values=original_vals,
                new_values=None,
                changed_fields=None
            ))