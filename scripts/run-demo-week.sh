#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"

post_json() {
  local path="$1"
  local body="$2"
  curl -fsS -X POST "${API_BASE_URL}${path}" \
    -H 'Content-Type: application/json' \
    -d "$body" >/dev/null
}

load_participants() {
  curl -fsS "${API_BASE_URL}/api/demo/participants" | python3 -c '
import json
import sys

for user in json.load(sys.stdin):
    print("{}|{}|{}|{}".format(user["userId"], user["username"], user["groupId"], user["groupName"]))
'
}

post_transaction() {
  local user_id="$1"
  local username="$2"
  local amount="$3"
  local description="$4"
  local now
  now="$(date '+%Y-%m-%dT%H:%M:%S')"

  printf '%s  %-12s  $%s  %s\n' "$now" "$username" "$amount" "$description"
  post_json "/api/transactions/simulate" \
    "{\"userId\":\"${user_id}\",\"amount\":${amount},\"description\":\"${description}\",\"timestamp\":\"${now}\"}"
}

mapfile -t PARTICIPANTS < <(load_participants)
if [ "${#PARTICIPANTS[@]}" -eq 0 ]; then
  echo "No participants found. Start the Java backend with demo seed data, or join from the Expo app first."
  exit 1
fi

declare -A GROUPS=()
for participant in "${PARTICIPANTS[@]}"; do
  IFS='|' read -r _ _ group_id group_name <<<"$participant"
  GROUPS["$group_id"]="$group_name"
done

echo "Resetting live weeks for ${#GROUPS[@]} group(s) at ${API_BASE_URL}"
for group_id in "${!GROUPS[@]}"; do
  printf '  %-36s  %s\n' "$group_id" "${GROUPS[$group_id]}"
  curl -fsS -X POST "${API_BASE_URL}/api/demo/reset-live-week?groupId=${group_id}" >/dev/null
done
sleep 3

DESCRIPTIONS=(
  "McDonalds Queen Street"
  "Coffee Supreme"
  "Nike Online Shoes"
  "Netflix Subscription"
  "Uber Eats Late Dinner"
  "Spotify Subscription"
  "Event Cinemas"
  "Gong Cha Ponsonby"
  "New World Groceries"
  "BurgerFuel Mission Bay"
  "Disney Plus"
  "Glassons Online"
)

AMOUNTS=(10.50 6.90 59.99 15.20 22.40 8.99 31.80 14.60 44.20 18.30 12.00 38.75)

echo "Streaming transactions for the current week"
start_epoch="$(date '+%s')"
index=0
while [ $(( "$(date '+%s')" - start_epoch )) -lt 84 ]; do
  participant="${PARTICIPANTS[$(( index % ${#PARTICIPANTS[@]} ))]}"
  IFS='|' read -r user_id username _ _ <<<"$participant"
  tx_index=$(( index % ${#DESCRIPTIONS[@]} ))
  post_transaction "$user_id" "$username" "${AMOUNTS[$tx_index]}" "${DESCRIPTIONS[$tx_index]}"
  index=$(( index + 1 ))
  sleep 4
done

echo "Rolling all demo groups to the next week"
for group_id in "${!GROUPS[@]}"; do
  curl -fsS -X POST "${API_BASE_URL}/api/demo/roll-week?groupId=${group_id}" >/dev/null
done
sleep 6

echo "Sending final next-week burst"
for offset in 0 1 2 3 4 5 6 7; do
  participant="${PARTICIPANTS[$(( (index + offset) % ${#PARTICIPANTS[@]} ))]}"
  IFS='|' read -r user_id username _ _ <<<"$participant"
  tx_index=$(( (index + offset) % ${#DESCRIPTIONS[@]} ))
  post_transaction "$user_id" "$username" "${AMOUNTS[$tx_index]}" "${DESCRIPTIONS[$tx_index]}"
  sleep 4
done

echo "Demo complete"
