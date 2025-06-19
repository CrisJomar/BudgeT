from django.http import JsonResponse
from django.conf import settings
from plaid.api_client import ApiClient
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.link_token_create_request_user import LinkTokenCreateRequestUser
from plaid.model.products import Products
from plaid.model.country_code import CountryCode
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from .models import PlaidAccount, Transaction, Payment  # Add Payment import
from django.shortcuts import render
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import PlaidAccount, Transaction
# Add PaymentSerializer import
from .serializers import PlaidAccountSerializer, TransactionSerializer, PaymentSerializer
from django.contrib.auth.models import User
import plaid
import traceback


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_link_token(request):
    try:
        print("Creating link token for user:", request.user.id)

        # Create an API client first, then use it to create the Plaid client
        api_client = ApiClient(settings.PLAID_CONFIGURATION)
        client = plaid_api.PlaidApi(api_client)

        print("Plaid client created successfully")

        # Create link token
        request_data = LinkTokenCreateRequest(
            user=LinkTokenCreateRequestUser(
                client_user_id=str(request.user.id)
            ),
            client_name="BudgeT App",
            products=[Products("transactions")],
            country_codes=[CountryCode("US")],
            language="en"
        )

        print("Link request built successfully")
        response = client.link_token_create(request_data)
        print("Link token created successfully")

        return Response({"link_token": response['link_token']})

    except Exception as e:
        traceback.print_exc()
        print("Error creating link token:", str(e))
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_public_token(request):
    try:
        print("Exchanging public token for user:", request.user.id)

        # Create an API client first, then use it to create the Plaid client
        # THIS IS THE FIX - same pattern as in create_link_token
        api_client = ApiClient(settings.PLAID_CONFIGURATION)
        client = plaid_api.PlaidApi(api_client)

        public_token = request.data.get('public_token')
        if not public_token:
            return Response({"error": "Missing public token"}, status=400)

        print(f"Got public token: {public_token[:10]}...")

        # Create the exchange request
        exchange_request = ItemPublicTokenExchangeRequest(
            public_token=public_token
        )

        # Exchange the public token for an access token
        print("Calling item_public_token_exchange...")
        exchange_response = client.item_public_token_exchange(exchange_request)

        # Get the access token and item ID
        access_token = exchange_response['access_token']
        item_id = exchange_response['item_id']

        print(f"Successfully exchanged token. Item ID: {item_id[:10]}...")

        # Save to database
        from .models import PlaidAccount
        PlaidAccount.objects.create(
            user=request.user,
            access_token=access_token,
            item_id=item_id
        )

        return Response({"success": True})

    except Exception as e:
        traceback.print_exc()
        print("Error exchanging public token:", str(e))
        return Response({"error": str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def sync_transactions(request):
    try:
        # Get all connected accounts for this user
        accounts = PlaidAccount.objects.filter(user=request.user)

        if not accounts:
            return Response({"error": "No connected accounts found"}, status=404)

        total_transactions = 0

        for account in accounts:
            try:
                # Create API client for each request to avoid any potential issues
                api_client = ApiClient(settings.PLAID_CONFIGURATION)
                client = plaid_api.PlaidApi(api_client)

                # Get transactions from the last 30 days
                start_date = (datetime.now() - timedelta(days=30)).date()
                end_date = datetime.now().date()

                print(
                    f"Fetching transactions for account {account.id} from {start_date} to {end_date}")

                request_data = TransactionsGetRequest(
                    access_token=account.access_token,
                    start_date=start_date,
                    end_date=end_date
                )

                # Add more detailed logging
                try:
                    response = client.transactions_get(request_data)
                    print(
                        f"Successfully retrieved {len(response.transactions)} transactions")

                    # Store each transaction in the database
                    for plaid_transaction in response.transactions:
                        transaction, created = Transaction.objects.update_or_create(
                            transaction_id=plaid_transaction.transaction_id,
                            defaults={
                                'plaid_account': account,
                                'amount': plaid_transaction.amount,
                                'date': plaid_transaction.date,
                                'name': plaid_transaction.name,
                                'category': plaid_transaction.category[0] if plaid_transaction.category else 'Uncategorized',
                                'payment_channel': plaid_transaction.payment_channel
                            }
                        )

                        if created:
                            total_transactions += 1

                except Exception as e:
                    print(
                        f"Error syncing transactions for account {account.id}: {str(e)}")
                    traceback.print_exc()
                    # Continue with next account instead of failing completely
                    continue

            except Exception as account_e:
                print(
                    f"Error processing account {account.id}: {str(account_e)}")
                traceback.print_exc()
                # Continue with next account
                continue

        return Response({
            "success": True,
            "message": f"Successfully synced {total_transactions} new transactions"
        })

    except Exception as e:
        traceback.print_exc()
        print(f"Global error in sync_transactions: {str(e)}")
        return Response({"error": str(e)}, status=500)


@csrf_exempt
def dashboard_combined_view(request):
    email = request.session.get("email")

    # Step 1: Get email from form
    if request.method == "POST" and not email:
        email = request.POST.get("email")
        request.session["email"] = email

    if not email:
        return render(request, "dashboard.html", {"email": None})

    # Step 2: Check if access_token exists
    account = PlaidAccount.objects.last()  # Simplified for demo
    if account:
        client = plaid_api.PlaidApi(settings.PLAID_CONFIGURATION)
        start = (datetime.now() - timedelta(days=30)).date()
        end = datetime.now().date()

        request_data = TransactionsGetRequest(
            access_token=account.access_token,
            start_date=start,
            end_date=end,
            options=TransactionsGetRequestOptions(count=10)
        )
        response = client.transactions_get(request_data)

        return render(request, "dashboard.html", {
            "email": email,
            "token": True,
            "transactions": response.transactions
        })

    # Step 3: If no access_token, show Plaid Link
    client = plaid_api.PlaidApi(settings.PLAID_CONFIGURATION)

    anon_id = str(uuid.uuid4())  # Generate a unique ID for the user

    request_data = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Budget App",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(client_user_id=anon_id)
    )
    response = client.link_token_create(request_data)
    return render(request, "dashboard.html", {
        "email": email,
        "token": False,
        "link_token": response.link_token
    })


class PlaidAccountViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = PlaidAccountSerializer

    def get_queryset(self):
        return PlaidAccount.objects.filter(user=self.request.user)


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer

    def get_queryset(self):
        return Transaction.objects.filter(plaid_account__user=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')

    if not username or not email or not password:
        return Response(
            {"detail": "Please provide username, email and password"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if user already exists
    if User.objects.filter(username=username).exists():
        return Response(
            {"username": "Username is already taken"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {"email": "Email is already registered"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Create user
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    return Response({
        "detail": "User registered successfully",
        "id": user.id,
        "username": user.username
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_accounts(request):
    # Your view code here
    accounts = PlaidAccount.objects.filter(user=request.user)
    serializer = PlaidAccountSerializer(accounts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transactions(request):
    # Your view code here
    transactions = Transaction.objects.filter(plaid_account__user=request.user)
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    user = request.user
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email
    }
    return Response(user_data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_accounts(request):
    accounts = PlaidAccount.objects.filter(user=request.user)
    serializer = PlaidAccountSerializer(accounts, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_transactions(request):
    transactions = Transaction.objects.filter(plaid_account__user=request.user)
    serializer = TransactionSerializer(transactions, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_plaid_account(request):
    try:
        account = PlaidAccount.objects.get(user=request.user)
        serializer = PlaidAccountSerializer(account)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except PlaidAccount.DoesNotExist:
        return Response({"error": "Plaid account not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_transactions_by_account(request, account_id):
    try:
        account = PlaidAccount.objects.get(id=account_id, user=request.user)
        transactions = Transaction.objects.filter(plaid_account=account)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except PlaidAccount.DoesNotExist:
        return Response({"error": "Plaid account not found"}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_transaction_summary(request):
    transactions = Transaction.objects.filter(plaid_account__user=request.user)
    total_spent = sum(t.amount for t in transactions if t.amount < 0)
    total_received = sum(t.amount for t in transactions if t.amount > 0)
    summary = {
        "total_spent": total_spent,
        "total_received": total_received,
        "balance": total_received + total_spent
    }
    return Response(summary, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def payment_list(request):
    """
    List all payments or create a new payment.
    """
    if request.method == 'GET':
        try:
            print("Attempting to fetch payments for user:", request.user.id)
            # Check if Payment model exists
            from django.apps import apps
            payment_model = apps.get_model('budgeT', 'Payment')
            print("Payment model exists:", payment_model)

            payments = Payment.objects.filter(user=request.user)
            print(f"Found {len(payments)} payments")
            serializer = PaymentSerializer(payments, many=True)
            return Response(serializer.data)
        except Exception as e:
            import traceback
            print(f"Error fetching payments: {str(e)}")
            print(traceback.format_exc())  # Print full traceback
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    elif request.method == 'POST':
        try:
            print("Received payment data:", request.data)
            serializer = PaymentSerializer(data=request.data)

            if serializer.is_valid():
                # Save with user association
                payment = serializer.save(user=request.user)
                print(f"Payment created successfully with ID: {payment.id}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)

            # Print detailed validation errors
            print("Validation errors:", serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            print(f"Error creating payment: {str(e)}")
            print(traceback.format_exc())
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def payment_detail(request, pk):
    try:
        payment = Payment.objects.get(pk=pk, user=request.user)
    except Payment.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PaymentSerializer(payment)
        return Response(serializer.data)

    elif request.method in ['PUT', 'PATCH']:
        serializer = PaymentSerializer(
            payment, data=request.data, partial=request.method == 'PATCH')
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        payment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# filepath: /Users/cris/Proyects/BudgeT/budgeT/urls.py
# Add these URLs to your urlpatterns
