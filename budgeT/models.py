from django.db import models

class PlaidAccount(models.Model):
    access_token = models.CharField(max_length=120)
    item_id = models.CharField(max_length=120)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PlaidAccount - Item {self.item_id}"