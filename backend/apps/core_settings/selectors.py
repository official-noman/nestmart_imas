from .models import CompanyProfile, TaxRate


def get_tax_rates():
    return TaxRate.objects.all()


def get_company_profiles():
    return CompanyProfile.objects.all()
