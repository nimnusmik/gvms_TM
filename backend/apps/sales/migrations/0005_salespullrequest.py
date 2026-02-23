from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('agents', '0012_alter_agent_team'),
        ('sales', '0004_alter_salesassignment_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='SalesPullRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('requested_count', models.IntegerField(default=0, verbose_name='요청 수량')),
                ('approved_count', models.IntegerField(default=0, verbose_name='승인 배정 수량')),
                ('status', models.CharField(choices=[('PENDING', '승인 대기'), ('APPROVED', '승인'), ('REJECTED', '거절')], default='PENDING', max_length=10)),
                ('request_note', models.TextField(blank=True, default='', verbose_name='요청 사유')),
                ('reject_reason', models.TextField(blank=True, default='', verbose_name='거절 사유')),
                ('processed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('agent', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pull_requests', to='agents.agent')),
                ('processed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='processed_pull_requests', to='agents.agent', verbose_name='처리자')),
            ],
            options={
                'db_table': 'tm_sales_pull_requests',
                'ordering': ['-created_at'],
                'indexes': [
                    models.Index(fields=['status', 'created_at'], name='sales_pull_status_created_idx'),
                    models.Index(fields=['agent', 'status'], name='sales_pull_agent_status_idx'),
                ],
            },
        ),
    ]
