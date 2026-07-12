from django.db import models


class InvoiceNumberSequence(models.Model):
    """Per-prefix counter row locked with select_for_update() to hand out
    sequential invoice numbers safely under concurrent requests."""

    prefix = models.CharField(max_length=100, unique=True)
    last_number = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f'{self.prefix} -> {self.last_number}'
