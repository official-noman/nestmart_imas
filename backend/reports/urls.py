from django.urls import path
from .views import DashboardKPIView, ProfitAndLossView

urlpatterns = [
    path('dashboard/', DashboardKPIView.as_view(), name='dashboard-kpi'),
    path('pnl/', ProfitAndLossView.as_view(), name='profit-and-loss'),
]
