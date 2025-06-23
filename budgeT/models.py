from django.db import models
from django.contrib.auth.models import User


class PlaidAccount(models.Model):
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="plaid_accounts")
    access_token = models.CharField(max_length=255)
    item_id = models.CharField(max_length=255)
    institution_name = models.CharField(max_length=255, blank=True, null=True)
    account_name = models.CharField(max_length=255, blank=True, null=True)
    account_type = models.CharField(max_length=100, blank=True, null=True)
    mask = models.CharField(max_length=4, blank=True, null=True)
    current_balance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    available_balance = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    limit = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True)
    last_synced = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        institution = self.institution_name or "Unknown Institution"
        return f"PlaidAccount - {institution} (User: {self.user.username})"


class Transaction(models.Model):
    plaid_account = models.ForeignKey(
        PlaidAccount, on_delete=models.CASCADE, related_name="transactions")
    transaction_id = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    category = models.CharField(max_length=255, default='Uncategorized')
    payment_channel = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.amount}"


class Payment(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('missed', 'Missed'),
    )

    FREQUENCY_CHOICES = (
        ('weekly', 'Weekly'),
        ('biweekly', 'Bi-weekly'),
        ('monthly', 'Monthly'),
        ('quarterly', 'Quarterly'),
        ('annually', 'Annually'),
    )

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='payments')
    recipient = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    dueDate = models.DateField()
    paidDate = models.DateField(null=True, blank=True)
    category = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending')
    isRecurring = models.BooleanField(default=False)
    frequency = models.CharField(
        max_length=10, choices=FREQUENCY_CHOICES, default='monthly')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.recipient}: ${self.amount} due {self.dueDate}"
