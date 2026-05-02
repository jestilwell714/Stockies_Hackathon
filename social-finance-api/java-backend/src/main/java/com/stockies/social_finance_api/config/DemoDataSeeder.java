package com.stockies.social_finance_api.config;

import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    public static final UUID DEMO_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID DEMO_GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000100");
    public static final UUID DEMO_CHALLENGE_ID = UUID.fromString("00000000-0000-0000-0000-000000000200");
    public static final UUID DEMO_MAYA_ID = UUID.fromString("00000000-0000-0000-0000-000000000002");
    public static final UUID DEMO_JOSH_ID = UUID.fromString("00000000-0000-0000-0000-000000000003");
    public static final UUID DEMO_TAYLOR_ID = UUID.fromString("00000000-0000-0000-0000-000000000004");
    public static final UUID DEMO_SAM_ID = UUID.fromString("00000000-0000-0000-0000-000000000005");
    public static final UUID DEMO_JORDAN_ID = UUID.fromString("00000000-0000-0000-0000-000000000006");
    public static final UUID DEMO_ALEX_ID = UUID.fromString("00000000-0000-0000-0000-000000000007");
    public static final UUID DEMO_JAMIE_ID = UUID.fromString("00000000-0000-0000-0000-000000000008");

    private final boolean seedDemoData;
    private final UserRepository userRepository;
    private final EntityManager entityManager;

    public DemoDataSeeder(
            @Value("${app.seed-demo-data:true}") boolean seedDemoData,
            UserRepository userRepository,
            EntityManager entityManager
    ) {
        this.seedDemoData = seedDemoData;
        this.userRepository = userRepository;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedDemoData || userRepository.count() > 0) {
            return;
        }

        User creator = user(DEMO_USER_ID, "connor", 135, null);
        entityManager.persist(creator);

        FriendGroup group = FriendGroup.builder()
                .id(DEMO_GROUP_ID)
                .groupName("Skimp Squad")
                .inviteCode("SKIMP8")
                .creator(creator)
                .bannedCategories(Set.of("eating_out", "subscriptions", "entertainment", "clothing"))
                .build();
        entityManager.persist(group);

        creator.setFriendGroup(group);

        List<User> users = new ArrayList<>(List.of(
                creator,
                user(DEMO_MAYA_ID, "maya", 1240, group),
                user(DEMO_JOSH_ID, "josh", 1135, group),
                user(DEMO_TAYLOR_ID, "taylor", 1080, group),
                user(DEMO_SAM_ID, "sam", 1015, group),
                user(DEMO_JORDAN_ID, "jordan", 960, group),
                user(DEMO_ALEX_ID, "alex", 905, group),
                user(DEMO_JAMIE_ID, "jamie", 860, group)
        ));
        users.stream().skip(1).forEach(entityManager::persist);

        LocalDate currentWeekStart = currentWeekStart();
        for (int weekOffset = 7; weekOffset >= 0; weekOffset--) {
            LocalDate start = currentWeekStart.minusWeeks(weekOffset);
            WeeklyChallenge challenge = WeeklyChallenge.builder()
                    .id(weekOffset == 0 ? DEMO_CHALLENGE_ID : deterministicUuid("challenge-" + weekOffset))
                    .friendGroup(group)
                    .startDate(start.atStartOfDay())
                    .endDate(start.plusDays(6).atTime(23, 59, 59))
                    .build();
            entityManager.persist(challenge);
            seedWeekTransactions(group, challenge, users, start, weekOffset);
        }
    }

    private void seedWeekTransactions(FriendGroup group, WeeklyChallenge challenge, List<User> users, LocalDate weekStart, int weekOffset) {
        List<SeedTxn> plan = List.of(
                txn(0, 8, 10.50 + weekOffset, "McDonalds Queen Street", "eating_out"),
                txn(1, 18, 12.60 + weekOffset, "Gong Cha Ponsonby", "eating_out"),
                txn(2, 9, 19.99, "Netflix Subscription", "subscriptions"),
                txn(3, 13, 42.50 + weekOffset, "Nike Online Store", "clothing"),
                txn(4, 20, 16.40 + weekOffset, "Event Cinemas", "entertainment"),
                txn(5, 7, 7.80 + weekOffset, "Coffee Supreme", "eating_out"),
                txn(6, 15, 21.20 + weekOffset, "Uber Eats Late Dinner", "eating_out"),
                txn(2, 19, 58.00 + weekOffset, "New World Groceries", "groceries"),
                txn(4, 11, 11.00 + weekOffset, "AT Hop Top Up", "transport"),
                txn(6, 17, 8.99, "Spotify Subscription", "subscriptions")
        );

        for (int i = 0; i < users.size(); i++) {
            User user = users.get(i);
            for (int j = 0; j < plan.size(); j++) {
                SeedTxn seed = plan.get(j);
                if ((i + j + weekOffset) % 4 == 0) {
                    continue;
                }
                entityManager.persist(Transaction.builder()
                        .id(deterministicUuid("txn-" + challenge.getId() + "-" + user.getId() + "-" + j))
                        .user(user)
                        .friendGroup(group)
                        .weeklyChallenge(challenge)
                        .amount(Math.round((seed.amount + i * 2.35) * 100.0) / 100.0)
                        .description(seed.description)
                        .timestamp(weekStart.plusDays(seed.day).atTime(seed.hour, 15 + (i * 3) % 40))
                        .category(seed.category)
                        .build());
            }
        }
    }

    private User user(UUID id, String username, int totalPoints, FriendGroup group) {
        return User.builder()
                .id(id)
                .username(username)
                .totalPoints(totalPoints)
                .goldMedel(0)
                .silverMedel(0)
                .bronzeMedel(0)
                .friendGroup(group)
                .build();
    }

    private LocalDate currentWeekStart() {
        LocalDate today = LocalDate.now();
        return today.minusDays(today.getDayOfWeek().getValue() % 7);
    }

    private UUID deterministicUuid(String key) {
        return UUID.nameUUIDFromBytes(("skimp-demo-" + key).getBytes(StandardCharsets.UTF_8));
    }

    private SeedTxn txn(int day, int hour, double amount, String description, String category) {
        return new SeedTxn(day, hour, amount, description, category);
    }

    private record SeedTxn(int day, int hour, double amount, String description, String category) {
    }
}
