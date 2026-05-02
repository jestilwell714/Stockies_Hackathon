#!/usr/bin/env bash
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://localhost:8080}"
SLEEP_SECONDS="${SLEEP_SECONDS:-8}"

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

sunday_start() {
  python3 -c '
from datetime import date, timedelta
today = date.today()
days_since_sunday = (today.weekday() + 1) % 7
print((today - timedelta(days=days_since_sunday)).isoformat())
'
}

timestamp_for_day() {
  local start_date="$1"
  local day_offset="$2"
  local hour="$3"
  local minute="$4"
  python3 -c '
from datetime import date, datetime, time, timedelta
import sys
start = date.fromisoformat(sys.argv[1])
day = start + timedelta(days=int(sys.argv[2]))
stamp = datetime.combine(day, time(int(sys.argv[3]), int(sys.argv[4]), 0))
print(stamp.isoformat(timespec="seconds"))
' "$start_date" "$day_offset" "$hour" "$minute"
}

post_transaction() {
  local user_id="$1"
  local username="$2"
  local amount="$3"
  local description="$4"
  local timestamp="$5"

  printf '%s  %-12s  $%s  %s\n' "$timestamp" "$username" "$amount" "$description"
  post_json "/api/transactions/simulate" \
    "{\"userId\":\"${user_id}\",\"amount\":${amount},\"description\":\"${description}\",\"timestamp\":\"${timestamp}\"}"
}

PARTICIPANTS=()
while IFS= read -r participant; do
  [ -n "$participant" ] && PARTICIPANTS+=("$participant")
done < <(load_participants)
if [ "${#PARTICIPANTS[@]}" -eq 0 ]; then
  echo "No participants found. Have people join from the Expo app first."
  exit 1
fi

GROUP_IDS=()
GROUP_NAMES=()
for participant in "${PARTICIPANTS[@]}"; do
  IFS='|' read -r _ _ group_id group_name <<<"$participant"
  seen=false
  if [ "${#GROUP_IDS[@]}" -gt 0 ]; then
    for existing_group_id in "${GROUP_IDS[@]}"; do
      if [ "$existing_group_id" = "$group_id" ]; then
        seen=true
        break
      fi
    done
  fi
  if [ "$seen" = false ]; then
    GROUP_IDS+=("$group_id")
    GROUP_NAMES+=("$group_name")
  fi
done

WEEK_START="$(sunday_start)"

echo "Resetting demo week to Sunday ${WEEK_START} for ${#GROUP_IDS[@]} group(s) at ${API_BASE_URL}"
for group_index in "${!GROUP_IDS[@]}"; do
  group_id="${GROUP_IDS[$group_index]}"
  group_name="${GROUP_NAMES[$group_index]}"
  printf '  %-36s  %s\n' "$group_id" "$group_name"
  curl -fsS -X POST "${API_BASE_URL}/api/demo/reset-live-week?groupId=${group_id}&startDate=${WEEK_START}" >/dev/null
done
sleep 3

DAY_NAMES=(Sunday Monday Tuesday Wednesday Thursday Friday Saturday)
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
  "KFC Drive Thru"
  "H&M Queen Street"
)
AMOUNTS=(10.50 6.90 59.99 15.20 22.40 8.99 31.80 14.60 44.20 18.30 12.00 38.75 17.40 52.10)

echo "Simulating Sunday through Saturday in about two minutes"
index=0
for day in 0 1 2 3 4 5 6; do
  echo ""
  echo "===== ${DAY_NAMES[$day]} ====="
  for slot in 0 1; do
    participant="${PARTICIPANTS[$(( index % ${#PARTICIPANTS[@]} ))]}"
    IFS='|' read -r user_id username _ _ <<<"$participant"
    tx_index=$(( index % ${#DESCRIPTIONS[@]} ))
    hour=$(( 9 + slot * 9 ))
    minute=$(( (index * 7) % 50 ))
    timestamp="$(timestamp_for_day "$WEEK_START" "$day" "$hour" "$minute")"
    post_transaction "$user_id" "$username" "${AMOUNTS[$tx_index]}" "${DESCRIPTIONS[$tx_index]}" "$timestamp"
    index=$(( index + 1 ))
    sleep "$SLEEP_SECONDS"
  done
done

echo ""
echo "Ending the week and creating the recap"
for group_id in "${GROUP_IDS[@]}"; do
  curl -fsS -X POST "${API_BASE_URL}/api/demo/roll-week?groupId=${group_id}" >/dev/null
done

echo ""
echo "Week complete. Open Profile -> Weekly Memories to show the recap."
echo "Recap endpoint for each group:"
for group_id in "${GROUP_IDS[@]}"; do
  echo "  ${API_BASE_URL}/api/groups/${group_id}/weekly-recaps"
done
