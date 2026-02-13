from django.db import migrations


def forwards(apps, schema_editor):
    # 테이블이 아직 없으면 스킵
    table_names = schema_editor.connection.introspection.table_names()
    if "tm_call_logs" not in table_names:
        return

    CallLog = apps.get_model("calls", "CallLog")
    Agent = apps.get_model("agents", "Agent")
    SalesAssignment = apps.get_model("sales", "SalesAssignment")

    admin_agent = (
        Agent.objects.filter(role__in=["ADMIN", "MANAGER"]).order_by("-created_at").first()
    )
    latest_assignment = SalesAssignment.objects.order_by("-assigned_at").first()

    update_kwargs = {}
    if admin_agent:
        update_kwargs["agent_id"] = admin_agent.agent_id
    if latest_assignment:
        update_kwargs["assignment_id"] = latest_assignment.id

    if not update_kwargs:
        return

    # agent/assignment가 비어있는 레코드 정리
    CallLog.objects.filter(agent__isnull=True).update(**update_kwargs)
    CallLog.objects.filter(assignment__isnull=True).update(**update_kwargs)


def backwards(apps, schema_editor):
    # 되돌림 불가 (데이터 정정)
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("calls", "0003_calllog_agent_calllog_assignment"),
        ("agents", "0012_alter_agent_team"),
        ("sales", "0006_alter_salesassignment_status_delete_calllog"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
