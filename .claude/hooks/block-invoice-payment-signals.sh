#!/usr/bin/env bash
# PreToolUse hook: blocks Edit/Write calls that reintroduce Django
# post_save/pre_save signal wiring in backend/invoices/ or backend/payments/.
#
# Background: this project used to fire journal-entry creation from a
# post_save signal on Invoice.objects.create(), before line items existed
# and calculate_totals() had run, so every invoice posted a 0.00 journal
# entry. signals.py was deleted from both apps; CLAUDE.md documents
# "no signals for business logic" as a hard rule. This hook enforces it
# mechanically instead of relying on the rule being remembered.

input=$(cat)

file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
[ -z "$file_path" ] && exit 0

case "$file_path" in
  *backend/invoices/*.py|*backend/payments/*.py) ;;
  *) exit 0 ;;
esac

content=$(echo "$input" | jq -r '
  [.tool_input.content, .tool_input.new_string, .tool_input.new_str]
  | map(select(. != null)) | join("\n")
')
[ -z "$content" ] && exit 0

if echo "$content" | grep -qE 'post_save\.connect|pre_save\.connect|@receiver\(\s*post_save|@receiver\(\s*pre_save'; then
  reason='Blocked: post_save/pre_save signals are not allowed in invoices/ or payments/ for business-logic side effects.

This project hit a real bug from this pattern: Invoice journal entries were posted from a post_save signal fired at Invoice.objects.create(), before line items existed and calculate_totals() had run, so the ledger always recorded a 0.00 entry. Both signals.py files were removed and apps.py::ready() no longer wires them up — see CLAUDE.md "No signals for business logic".

Instead, call the service function directly from the serializer after totals are known, wrapped in transaction.atomic():
  - invoices/services.py::create_invoice
  - payments/services.py::create_payment_allocation
  - accounting/models.py::create_journal_entry'

  jq -n --arg reason "$reason" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
fi

exit 0
