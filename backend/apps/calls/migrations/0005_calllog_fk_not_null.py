from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("calls", "0004_fix_calllog_fk_defaults"),
    ]

    operations = [
        migrations.AlterField(
            model_name="calllog",
            name="agent",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="call_history",
                to="agents.agent",
                verbose_name="상담원",
            ),
        ),
        migrations.AlterField(
            model_name="calllog",
            name="assignment",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="call_logs",
                to="sales.salesassignment",
                verbose_name="영업 배정 건",
            ),
        ),
    ]
