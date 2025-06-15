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
from .models import PlaidAccount
from django.shortcuts import render
from plaid.model.transactions_get_request import TransactionsGetRequest
from plaid.model.transactions_get_request_options import TransactionsGetRequestOptions
from datetime import datetime, timedelta
import uuid

def create_link_token(request):
    client = plaid_api.PlaidApi(ApiClient(settings.PLAID_CONFIGURATION))

    req = LinkTokenCreateRequest(
        products=[Products("transactions")],
        client_name="Budget App",
        country_codes=[CountryCode("US")],
        language="en",
        user=LinkTokenCreateRequestUser(client_user_id="user-test-001"),
    )
    res = client.link_token_create(req)
    return JsonResponse(res.to_dict())

@csrf_exempt
@require_POST
def exchange_public_token(request):
    body = json.loads(request.body)
    public_token = body.get("public_token")

    if not public_token:
        return JsonResponse({"error": "Missing public token"}, status=400)

    client = plaid_api.PlaidApi(ApiClient(settings.PLAID_CONFIGURATION))

    try:
        exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)

        response = client.item_public_token_exchange(exchange_request)
        access_token = response["access_token"]
        item_id = response["item_id"]

        # TODO: Store access_token and item_id in your database
        
        PlaidAccount.objects.create(
            access_token=access_token,
            item_id=item_id
        )

        return JsonResponse({
            "access_token": access_token,
            "item_id": item_id
        })
    
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
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
        client = plaid_api.PlaidApi(ApiClient(settings.PLAID_CONFIGURATION))
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
    client = plaid_api.PlaidApi(ApiClient(settings.PLAID_CONFIGURATION))

    anon_id = str(uuid.uuid4()) # Generate a unique ID for the user


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