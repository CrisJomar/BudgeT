# Generated by Django 5.2.3 on 2025-06-17 17:41

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('budgeT', '0003_transaction_payment_channel_transaction_updated_at_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient', models.CharField(max_length=255)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('dueDate', models.DateField()),
                ('paidDate', models.DateField(blank=True, null=True)),
                ('category', models.CharField(max_length=100)),
                ('description', models.TextField(blank=True)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('paid', 'Paid'), ('missed', 'Missed')], default='pending', max_length=10)),
                ('isRecurring', models.BooleanField(default=False)),
                ('frequency', models.CharField(choices=[('weekly', 'Weekly'), ('biweekly', 'Bi-weekly'), ('monthly', 'Monthly'), ('quarterly', 'Quarterly'), ('annually', 'Annually')], default='monthly', max_length=10)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payments', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
