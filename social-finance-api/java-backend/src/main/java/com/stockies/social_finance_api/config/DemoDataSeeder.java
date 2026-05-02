package com.stockies.social_finance_api.config;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
public class DemoDataSeeder implements CommandLineRunner {
    public static final UUID DEMO_USER_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    public static final UUID DEMO_GROUP_ID = UUID.fromString("00000000-0000-0000-0000-000000000100");
    public static final UUID DEMO_CHALLENGE_ID = UUID.fromString("00000000-0000-0000-0000-000000000200");

    private final boolean seedDemoData;
    private final FriendGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final WeeklyChallengeRepository challengeRepository;
    private final TransactionRepository transactionRepository;
    private final EntityManager entityManager;

    public DemoDataSeeder(
            @Value("${app.seed-demo-data:true}") boolean seedDemoData,
            FriendGroupRepository groupRepository,
            UserRepository userRepository,
            WeeklyChallengeRepository challengeRepository,
            TransactionRepository transactionRepository,
            EntityManager entityManager
    ) {
        this.seedDemoData = seedDemoData;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.transactionRepository = transactionRepository;
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

        List<User> users = List.of(
                user(UUID.fromString("00000000-0000-0000-0000-000000000002"), "maya", 164, group),
                user(UUID.fromString("00000000-0000-0000-0000-000000000003"), "josh", 128, group),
                user(UUID.fromString("00000000-0000-0000-0000-000000000004"), "taylor", 120, group),
                user(UUID.fromString("00000000-0000-0000-0000-000000000005"), "sam", 112, group)
        );
        users.forEach(entityManager::persist);

        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(today.getDayOfWeek().getValue() % 7);
        WeeklyChallenge challenge = WeeklyChallenge.builder()
                .id(DEMO_CHALLENGE_ID)
                .friendGroup(group)
                .startDate(start.atStartOfDay())
                .endDate(start.plusDays(6).atTime(23, 59, 59))
                .build();
        entityManager.persist(challenge);

        entityManager.persist(Transaction.builder()
                .user(creator)
                .friendGroup(group)
                .weeklyChallenge(challenge)
                .amount(10.50)
                .description("McDonalds Queen Street")
                .timestamp(LocalDateTime.now().minusDays(1))
                .category("eating_out")
                .build());
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
}
