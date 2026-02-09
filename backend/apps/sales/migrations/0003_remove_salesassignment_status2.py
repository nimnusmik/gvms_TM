from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('sales', '0002_salesassignment_status2'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='salesassignment',
            name='status2',
        ),
    ]
