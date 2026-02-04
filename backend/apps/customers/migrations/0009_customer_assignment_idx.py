from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0008_assignmentlog_delete_autoassignlog'),
    ]

    operations = [
        migrations.AddIndex(
            model_name='customer',
            index=models.Index(
                fields=['status', 'assigned_agent', 'team', 'created_at'],
                name='cust_stat_agent_team_ct',
            ),
        ),
    ]
