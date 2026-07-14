---
name: drf-api
description: Add or modify a REST API endpoint in this project (nestmart_imas backend) -- serializer, viewset/view, urls.py wiring, and permissions together. Use when exposing a model over the API, adding an action to an existing endpoint, or changing request/response shape. Covers this project's ModelSerializer + ModelViewSet + DefaultRouter + role-based permission conventions.
---

# DRF API conventions (nestmart_imas)

Reference implementation: `backend/apps/invoices/api/v1/{serializers.py,views.py,urls.py}`.

## Serializer

`ModelSerializer`, nested serializers for related line items, explicit `read_only_fields` for anything server-computed:

```python
class InvoiceLineItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceLineItem
        fields = ('id', 'item', 'quantity', 'unit_price', 'discount', 'tax_rate',
                  'tax_amount', 'total_amount')
        read_only_fields = ('id', 'tax_amount', 'total_amount')

class InvoiceSerializer(serializers.ModelSerializer):
    lines = InvoiceLineItemSerializer(many=True)

    class Meta:
        model = Invoice
        fields = (..., 'lines', 'created_at', 'updated_at')
        read_only_fields = ('id', 'status', 'subtotal', 'discount_total',
                             'tax_total', 'grand_total', 'created_at', 'updated_at')
```

**`create`/`update` orchestrate, they don't compute.** Delegate the actual write to a service function ([[django-service]]) after known totals; don't inline business logic in the serializer:

```python
def create(self, validated_data):
    lines_data = validated_data.pop('lines', [])
    return create_invoice(lines=lines_data, **validated_data)  # from .services

@transaction.atomic
def update(self, instance, validated_data):
    lines_data = validated_data.pop('lines', None)
    for attr, value in validated_data.items():
        setattr(instance, attr, value)
    instance.save()
    if lines_data is not None:
        instance.lines.all().delete()
        for line_data in lines_data:
            InvoiceLineItem.objects.create(invoice=instance, **line_data)
    instance.calculate_totals()
    return instance
```

Wrap `update` in `@transaction.atomic` whenever it does more than one write (here: replacing line items + recalculating totals).

## View

`viewsets.ModelViewSet` with `permission_classes`, `select_related`/`prefetch_related` on the queryset to avoid N+1s, and any pre-fetch side effect (like lazily marking overdue invoices) overridden in `get_queryset`:

```python
class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.prefetch_related('lines').select_related('customer')
    serializer_class = InvoiceSerializer
    permission_classes = [IsAccountant]

    def get_queryset(self):
        Invoice.mark_overdue_invoices()
        return super().get_queryset()
```

## Permissions

Role-gated via `apps/common/permissions.py`. Reuse an existing permission class (`IsAccountant`, `IsAdminOrReadOnly`) if it fits the role split you need; otherwise subclass `HasRole` with `allowed_roles = (...)`:

```python
class IsAccountant(HasRole):
    allowed_roles = (CustomUser.Role.ADMIN, CustomUser.Role.ACCOUNTANT)
```

Don't hand-roll `request.user.role == ...` checks inline in a view -- put them in a permission class so they're reusable and testable in isolation.

## URL wiring

`DefaultRouter` per app, registered in that app's `urls.py`, then included from the project's root URLconf (check `backend/config/urls.py` for where to add it if this is a new app):

```python
router = DefaultRouter()
router.register('invoices', InvoiceViewSet, basename='invoice')

urlpatterns = [path('', include(router.urls))]
```

## After adding/changing an endpoint

1. `cd backend && ./venv/bin/python manage.py check`
2. Write/update view tests -- auth (401), wrong role (403), and the happy path. See [[django-tests]] for the `assert_requires_authentication`/`assert_forbidden_for_role` helpers and `make_authenticated_client` fixture that already cover the boilerplate.
3. `ruff check backend/<app>`
