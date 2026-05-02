package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DemoReadService {
    private static final List<String> DAY_LABELS = List.of("Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat");

    private final UserRepository userRepository;
    private final FriendGroupRepository groupRepository;
    private final WeeklyChallengeRepository challengeRepository;
    private final TransactionRepository transactionRepository;

    public DemoReadService(
            UserRepository userRepository,
            FriendGroupRepository groupRepository,
            WeeklyChallengeRepository challengeRepository,
            TransactionRepository transactionRepository
    ) {
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.challengeRepository = challengeRepository;
        this.transactionRepository = transactionRepository;
    }

    public Map<String, Object> homeDashboard(UUID userId) {
        User user = findUser(userId);
        FriendGroup group = groupFor(user);
        ChallengeWindow challenge = activeChallenge(group.getId());

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("profile", profile(user));
        dashboard.put("group", group(group));
        dashboard.put("challenge", challenge(challenge, group));
        dashboard.put("leaderboard", weeklyLeaderboard(group.getId(), challenge.id()));
        dashboard.put("graph", weeklyGraph(group.getId(), challenge.id()));
        dashboard.put("activityFeed", activityFeed(group.getId(), 8));
        return dashboard;
    }

    public List<Map<String, Object>> weeklyLeaderboard(UUID groupId, UUID challengeId) {
        FriendGroup group = findGroup(groupId);
        ChallengeWindow challenge = challengeWindow(groupId, challengeId);
        Set<String> badCategories = badCategories(group);
        List<Transaction> transactions = weeklyBadTransactions(group.getId(), challenge, badCategories);

        Map<UUID, Double> totals = transactions.stream()
                .collect(Collectors.groupingBy(t -> t.getUser().getId(), Collectors.summingDouble(this::amount)));

        List<Map<String, Object>> rows = usersForGroup(group.getId()).stream()
                .map(user -> {
                    Map<String, Object> row = basePerson(user);
                    double weeklyBadSpend = money(totals.getOrDefault(user.getId(), 0.0));
                    row.put("weeklyBadSpend", weeklyBadSpend);
                    row.put("trend", weeklyBadSpend < 60 ? "up" : weeklyBadSpend > 90 ? "down" : "flat");
                    return row;
                })
                .sorted(Comparator.comparingDouble(row -> ((Number) row.get("weeklyBadSpend")).doubleValue()))
                .collect(Collectors.toCollection(ArrayList::new));

        rankRows(rows, "weeklyBadSpend");
        return rows;
    }

    public List<Map<String, Object>> pointsLeaderboard(UUID groupId) {
        List<Map<String, Object>> rows = usersForGroup(groupId).stream()
                .map(user -> {
                    Map<String, Object> row = basePerson(user);
                    row.put("totalPoints", user.getTotalPoints());
                    return row;
                })
                .sorted((a, b) -> Integer.compare((Integer) b.get("totalPoints"), (Integer) a.get("totalPoints")))
                .collect(Collectors.toCollection(ArrayList::new));

        rankRows(rows, "totalPoints");
        return rows;
    }

    public Map<String, Object> weeklyGraph(UUID groupId, UUID challengeId) {
        FriendGroup group = findGroup(groupId);
        ChallengeWindow challenge = challengeWindow(groupId, challengeId);
        Set<String> badCategories = badCategories(group);
        List<Transaction> transactions = weeklyBadTransactions(group.getId(), challenge, badCategories);

        List<Map<String, Object>> series = usersForGroup(group.getId()).stream().map(user -> {
            double running = 0;
            List<Map<String, Object>> points = new ArrayList<>();
            for (int i = 0; i < DAY_LABELS.size(); i++) {
                LocalDate date = challenge.start().toLocalDate().plusDays(i);
                double dayTotal = transactions.stream()
                        .filter(transaction -> transaction.getUser().getId().equals(user.getId()))
                        .filter(transaction -> transaction.getTimestamp().toLocalDate().equals(date))
                        .mapToDouble(this::amount)
                        .sum();
                running += dayTotal;

                Map<String, Object> point = new LinkedHashMap<>();
                point.put("day", DAY_LABELS.get(i));
                point.put("dayIndex", i);
                point.put("date", date.toString());
                point.put("cumulativeAmount", money(running));
                points.add(point);
            }

            Map<String, Object> line = new LinkedHashMap<>();
            line.put("userId", String.valueOf(user.getId()));
            line.put("displayName", user.getUsername());
            line.put("avatarColor", avatarColor(user.getId()));
            line.put("points", points);
            return line;
        }).toList();

        Map<String, Object> graph = new LinkedHashMap<>();
        graph.put("days", DAY_LABELS);
        graph.put("series", series);
        return graph;
    }

    public List<Map<String, Object>> activityFeed(UUID groupId, Integer limit) {
        FriendGroup group = findGroup(groupId);
        Set<String> badCategories = badCategories(group);
        return transactionRepository.findAllByUserFriendGroupIdOrderByTimestampDesc(group.getId()).stream()
                .filter(transaction -> badCategories.contains(canonicalCategory(transaction.getCategory())))
                .limit(limit == null ? 8 : limit)
                .map(this::activityItem)
                .toList();
    }

    public Map<String, Object> profileSummary(UUID userId, UUID groupId, UUID challengeId) {
        User user = findUser(userId);
        List<Map<String, Object>> leaderboard = weeklyLeaderboard(groupId, challengeId);
        Map<String, Object> currentRow = leaderboard.stream()
                .filter(row -> row.get("userId").equals(String.valueOf(userId)))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User is not in this group"));
        double weeklySpend = ((Number) currentRow.get("weeklyBadSpend")).doubleValue();

        Map<String, Object> medals = new LinkedHashMap<>();
        medals.put("gold", user.getGoldMedel());
        medals.put("silver", user.getSilverMedel());
        medals.put("bronze", user.getBronzeMedel());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("profile", profile(user));
        summary.put("medals", medals);
        summary.put("weeklySpend", weeklySpend);
        summary.put("averageDailySpend", money(weeklySpend / 7));
        summary.put("currentRank", currentRow.get("rank"));
        summary.put("recentTransactions", userTransactions(userId, 3));
        return summary;
    }

    public List<Map<String, Object>> userTransactions(UUID userId, Integer limit) {
        return transactionRepository.findAllByUserIdOrderByTimestampDesc(userId).stream()
                .limit(limit == null ? Long.MAX_VALUE : limit)
                .map(this::transaction)
                .toList();
    }

    public List<Map<String, Object>> weeklyRecaps(UUID groupId) {
        FriendGroup group = findGroup(groupId);
        return challengeRepository.findAll().stream()
                .sorted(Comparator.comparing(WeeklyChallenge::getStartDate).reversed())
                .map(challenge -> recap(group, challenge))
                .toList();
    }

    private Map<String, Object> recap(FriendGroup group, WeeklyChallenge challenge) {
        ChallengeWindow window = fromChallenge(challenge);
        List<Map<String, Object>> leaderboard = weeklyLeaderboard(group.getId(), challenge.getId());

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBadSpend", money(leaderboard.stream()
                .mapToDouble(row -> ((Number) row.get("weeklyBadSpend")).doubleValue())
                .sum()));
        stats.put("winnerName", leaderboard.isEmpty() ? "No winner" : leaderboard.get(0).get("displayName"));
        stats.put("cleanestDay", "Sunday");
        stats.put("biggestDrop", "Tracked by backend totals");

        Map<String, Object> recap = new LinkedHashMap<>();
        recap.put("id", "recap-" + challenge.getId());
        recap.put("groupId", String.valueOf(group.getId()));
        recap.put("challengeId", String.valueOf(challenge.getId()));
        recap.put("weekLabel", window.start().toLocalDate() + " - " + window.end().toLocalDate());
        recap.put("startDate", window.start().toLocalDate().toString());
        recap.put("endDate", window.end().toLocalDate().toString());
        recap.put("finalLeaderboard", leaderboard);
        recap.put("graph", weeklyGraph(group.getId(), challenge.getId()));
        recap.put("dailyBreakdown", List.of());
        recap.put("highlights", List.of("Backend persisted this weekly result."));
        recap.put("keyStats", stats);
        return recap;
    }

    private List<Transaction> weeklyBadTransactions(UUID groupId, ChallengeWindow challenge, Set<String> badCategories) {
        return transactionRepository.findAllByUserFriendGroupIdAndTimestampBetween(groupId, challenge.start(), challenge.end()).stream()
                .filter(transaction -> badCategories.contains(canonicalCategory(transaction.getCategory())))
                .toList();
    }

    private void rankRows(List<Map<String, Object>> rows, String rankedValue) {
        for (int i = 0; i < rows.size(); i++) {
            Map<String, Object> row = rows.get(i);
            int rank = i + 1;
            row.put("rank", rank);
            if (rank == 1) row.put("medal", "gold");
            if (rank == 2) row.put("medal", "silver");
            if (rank == 3) row.put("medal", "bronze");
        }
    }

    private Map<String, Object> transaction(Transaction transaction) {
        FriendGroup group = transaction.getUser().getFriendGroup();
        String category = canonicalCategory(transaction.getCategory());
        boolean badSpend = group != null && badCategories(group).contains(category);

        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", String.valueOf(transaction.getId()));
        row.put("userId", String.valueOf(transaction.getUser().getId()));
        row.put("groupId", group == null ? "" : String.valueOf(group.getId()));
        row.put("challengeId", String.valueOf(transaction.getWeeklyChallenge() == null ? activeChallenge(group.getId()).id() : transaction.getWeeklyChallenge().getId()));
        row.put("amount", amount(transaction));
        row.put("currency", "NZD");
        row.put("description", transaction.getDescription());
        row.put("merchant", merchant(transaction.getDescription()));
        row.put("timestamp", transaction.getTimestamp().toString());
        row.put("category", category);
        row.put("categoryMethod", "backend");
        row.put("categorizedAt", transaction.getTimestamp().toString());
        row.put("isBadSpend", badSpend);
        row.put("needsReview", false);
        row.put("sourceTransactionId", "backend-" + transaction.getId());
        return row;
    }

    private Map<String, Object> activityItem(Transaction transaction) {
        User user = transaction.getUser();
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("id", String.valueOf(transaction.getId()));
        item.put("userId", String.valueOf(user.getId()));
        item.put("displayName", user.getUsername());
        item.put("avatarColor", avatarColor(user.getId()));
        item.put("merchant", merchant(transaction.getDescription()));
        item.put("amount", amount(transaction));
        item.put("category", canonicalCategory(transaction.getCategory()));
        item.put("timestamp", transaction.getTimestamp().toString());
        item.put("tone", amount(transaction) >= 50 ? "nudge" : "neutral");
        return item;
    }

    private Map<String, Object> profile(User user) {
        Map<String, Object> row = basePerson(user);
        row.put("totalPoints", user.getTotalPoints());
        return row;
    }

    private Map<String, Object> basePerson(User user) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("userId", String.valueOf(user.getId()));
        row.put("id", String.valueOf(user.getId()));
        row.put("displayName", user.getUsername());
        row.put("username", user.getUsername());
        row.put("avatarColor", avatarColor(user.getId()));
        return row;
    }

    private Map<String, Object> group(FriendGroup group) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", String.valueOf(group.getId()));
        row.put("groupName", group.getGroupName());
        row.put("inviteCode", group.getInviteCode());
        row.put("creatorUserId", group.getCreator() == null ? "" : String.valueOf(group.getCreator().getId()));
        row.put("badCategories", new ArrayList<>(badCategories(group)));
        row.put("active", true);
        return row;
    }

    private Map<String, Object> challenge(ChallengeWindow challenge, FriendGroup group) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", String.valueOf(challenge.id()));
        row.put("groupId", String.valueOf(group.getId()));
        row.put("startDate", challenge.start().toLocalDate().toString());
        row.put("endDate", challenge.end().toLocalDate().toString());
        row.put("isActive", true);
        row.put("badCategorySnapshot", new ArrayList<>(badCategories(group)));
        return row;
    }

    private User findUser(UUID userId) {
        return userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
    }

    private FriendGroup findGroup(UUID groupId) {
        return groupRepository.findById(groupId).orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
    }

    private FriendGroup groupFor(User user) {
        if (user.getFriendGroup() != null) return user.getFriendGroup();
        return groupRepository.findTopByOrderByIdDesc().orElseThrow(() -> new IllegalStateException("No friend group exists"));
    }

    private List<User> usersForGroup(UUID groupId) {
        return userRepository.findByFriendGroupId(groupId);
    }

    private Set<String> badCategories(FriendGroup group) {
        return Optional.ofNullable(group.getBannedCategories()).orElse(Set.of());
    }

    private ChallengeWindow activeChallenge(UUID groupId) {
        LocalDateTime now = LocalDateTime.now();
        return challengeRepository.findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(groupId, now, now)
                .map(this::fromChallenge)
                .or(() -> challengeRepository.findTopByFriendGroupIdOrderByStartDateDesc(groupId).map(this::fromChallenge))
                .orElseGet(this::currentWeekWindow);
    }

    private ChallengeWindow challengeWindow(UUID groupId, UUID challengeId) {
        if (challengeId != null) {
            return challengeRepository.findById(challengeId).map(this::fromChallenge).orElseGet(() -> activeChallenge(groupId));
        }
        return activeChallenge(groupId);
    }

    private ChallengeWindow fromChallenge(WeeklyChallenge challenge) {
        LocalDateTime start = challenge.getStartDate();
        LocalDateTime end = challenge.getEndDate() == null ? start.plusDays(6).withHour(23).withMinute(59).withSecond(59) : challenge.getEndDate();
        return new ChallengeWindow(challenge.getId(), start, end);
    }

    private ChallengeWindow currentWeekWindow() {
        LocalDate today = LocalDate.now();
        int offset = today.getDayOfWeek() == DayOfWeek.SUNDAY ? 0 : today.getDayOfWeek().getValue();
        LocalDate start = today.minusDays(offset);
        return new ChallengeWindow(new UUID(0L, 0L), start.atStartOfDay(), start.plusDays(6).atTime(23, 59, 59));
    }

    private double amount(Transaction transaction) {
        return transaction.getAmount() == null ? 0.0 : transaction.getAmount();
    }

    private double money(double amount) {
        return Math.round(amount * 100.0) / 100.0;
    }

    private String merchant(String description) {
        if (description == null || description.isBlank()) return "Transaction";
        String trimmed = description.trim();
        int firstSpace = trimmed.indexOf(' ');
        return firstSpace > 0 ? trimmed.substring(0, firstSpace) : trimmed;
    }

    private String avatarColor(UUID userId) {
        List<String> colors = List.of("#B8F2D0", "#C7E6FF", "#FFD6C9", "#E3D7FF", "#FFF3B0", "#FF9E9E");
        return colors.get(Math.floorMod(userId.hashCode(), colors.size()));
    }

    private String canonicalCategory(String category) {
        if (category == null || category.isBlank()) return "other";
        return switch (category) {
            case "fast_food" -> "eating_out";
            case "subscriptions_streaming_saas" -> "subscriptions";
            case "uncatergorise", "uncategorised", "uncategorized" -> "other";
            default -> category;
        };
    }

    private record ChallengeWindow(UUID id, LocalDateTime start, LocalDateTime end) {
    }
}
