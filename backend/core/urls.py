"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def api_root(request):
    return JsonResponse({
        'message': 'IMAS API is running.',
        'auth_endpoints': {
            'register': '/api/auth/register/',
            'login': '/api/auth/login/',
            'refresh': '/api/auth/refresh/',
            'password_reset': '/api/auth/password-reset/',
            'password_reset_confirm': '/api/auth/password-reset-confirm/',
            'enable_2fa': '/api/auth/2fa/enable/',
            'confirm_2fa': '/api/auth/2fa/confirm/',
            'verify_2fa_login': '/api/auth/login/verify-2fa/',
        },
        'contacts_endpoint': '/api/v1/contacts/',
        'items_endpoint': '/api/v1/items/',
        'invoices_endpoint': '/api/v1/invoices/',
        'payments_endpoint': '/api/v1/payments/',
        'credit_notes_endpoint': '/api/v1/credit-notes/',
        'accounts_endpoint': '/api/v1/accounts/',
        'journal_entries_endpoint': '/api/v1/journal-entries/',
    })


urlpatterns = [
    path('', api_root, name='api_root'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/v1/', include('contacts.urls')),
    path('api/v1/', include('items.urls')),
    path('api/v1/', include('invoices.urls')),
    path('api/v1/', include('payments.urls')),
    path('api/v1/', include('accounting.urls')),
]
