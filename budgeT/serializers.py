from rest_framework import serializers
from .models import PlaidAccount, Transaction, Payment
import datetime


class TransactionSerializer(serializers.ModelSerializer):
    # Change to PrimaryKeyRelatedField to ensure we get just the ID
    plaid_account = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'transaction_id', 'amount',
                  'date', 'name', 'category', 'plaid_account']


class PlaidAccountSerializer(serializers.ModelSerializer):
    transactions = TransactionSerializer(many=True, read_only=True)

    class Meta:
        model = PlaidAccount
        fields = ['id', 'institution_name',
                  'account_type', 'last_synced', 'transactions']
        # Note: We don't include access_token for security reasons


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
