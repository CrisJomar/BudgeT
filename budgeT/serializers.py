from rest_framework import serializers
from .models import PlaidAccount, Transaction, Payment
import datetime


class PlaidAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlaidAccount
        fields = ['id', 'institution_name', 'account_name', 'account_type', 'mask',
                  'current_balance', 'available_balance', 'limit', 'last_synced', 'created_at']


class TransactionSerializer(serializers.ModelSerializer):
    # Include bank name directly in the transaction
    institution_name = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_id', 'plaid_account', 'institution_name',
                  'amount', 'date', 'name', 'category', 'payment_channel']

    def get_institution_name(self, obj):
        """Get the institution name directly from the plaid account"""
        if obj.plaid_account:
            return obj.plaid_account.institution_name
        return "Unknown Bank"


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'recipient', 'amount', 'dueDate', 'paidDate',
                  'category', 'description', 'status', 'isRecurring',
                  'frequency', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        """
        Check that amount is positive.
        """
        if value <= 0:
            raise serializers.ValidationError(
                "Amount must be a positive number")
        return value

    # Add this if you're using camelCase in your model
    def to_internal_value(self, data):
        if 'dueDate' in data and data['dueDate']:
            try:
                # Ensure the date is properly formatted
                parse_date = datetime.datetime.strptime(
                    data['dueDate'], '%Y-%m-%d').date()
            except ValueError:
                raise serializers.ValidationError(
                    {'dueDate': 'Date must be in YYYY-MM-DD format'})

        return super().to_internal_value(data)
