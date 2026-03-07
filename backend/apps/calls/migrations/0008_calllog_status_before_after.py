from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("calls", "0007_calllog_idx_call_assignment_start_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="calllog",
            name="status_before",
            field=models.CharField(
                blank=True,
                choices=[
                    ("NEW", "대기(미배정)"),
                    ("ASSIGNED", "배정됨"),
                    ("TRYING", "통화중"),
                    ("REJECT", "거절"),
                    ("INVALID", "결번"),
                    ("SUCCESS", "성공(동의/계약)"),
                    ("BUY", "구매"),
                    ("HOLD", "보류"),
                ],
                max_length=20,
                null=True,
                verbose_name="배정 상태(변경 전)",
            ),
        ),
        migrations.AddField(
            model_name="calllog",
            name="status_after",
            field=models.CharField(
                blank=True,
                choices=[
                    ("NEW", "대기(미배정)"),
                    ("ASSIGNED", "배정됨"),
                    ("TRYING", "통화중"),
                    ("REJECT", "거절"),
                    ("INVALID", "결번"),
                    ("SUCCESS", "성공(동의/계약)"),
                    ("BUY", "구매"),
                    ("HOLD", "보류"),
                ],
                max_length=20,
                null=True,
                verbose_name="배정 상태(변경 후)",
            ),
        ),
    ]
