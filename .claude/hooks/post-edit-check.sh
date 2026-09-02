#!/usr/bin/env bash
set -uo pipefail

input=$(cat)
file=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_response.filePath // empty')

case "$file" in
  *.ts) ;;
  *) exit 0 ;;
esac

typecheck_out=$(pnpm typecheck 2>&1)
typecheck_rc=$?

lint_out=$(pnpm lint:fix 2>&1)
lint_rc=$?

pnpm format >/dev/null 2>&1

if [ "$typecheck_rc" -ne 0 ] || [ "$lint_rc" -ne 0 ]; then
  reason=$(printf 'Checklist pós-edição falhou em %s\n\n=== pnpm typecheck (exit %s) ===\n%s\n\n=== pnpm lint:fix (exit %s) ===\n%s' \
    "$file" "$typecheck_rc" "$typecheck_out" "$lint_rc" "$lint_out")
  jq -n --arg reason "$reason" '{decision: "block", reason: $reason}'
fi

exit 0
