from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('customers', '0013_delete_assignmentlog_alter_customer_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='status',
            field=models.CharField(default='NEW', max_length=20, verbose_name='(레거시) 상태'),
        ),
    ]
