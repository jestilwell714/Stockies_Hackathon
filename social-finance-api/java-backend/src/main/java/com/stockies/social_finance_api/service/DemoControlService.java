package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.config.DemoDataSeeder;
import com.stockies.social_finance_api.dto.DemoJoinResponse;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import jakarta.persistence.EntityManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class DemoControlService {
    private static final int DEMO_GROUP_CAPACITY = 8;
    private static final String DEMO_GROUP_PREFIX = "Demo Team ";

    private final FriendGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final WeeklyChallengeRepository challengeRepository;
    private final EntityManager entityManager;

    public DemoControlService(
            FriendGroupRepository groupRepository,
            UserRepository userRepository,
            WeeklyChallengeRepository challengeRepository,
            EntityManager entityManager
    ) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.entityManager = entityManager;
    }

    @Transactional
    public DemoJoinResponse joinDemo(String displayName) {
        String username = uniqueUsername(displayName);
        User user = User.builder()
                .id(nextSequentialUserId())
                .username(username)
                .totalPoints(0)
                .goldMedel(0)
                .silverMedel(0)
                .bronzeMedel(0)
                .build();
        userRepository.saveAndFlush(user);

        FriendGroup group = groupWithSpace();
        if (group == null) {
            group = createDemoGroup(user);
        }
        user.setFriendGroup(group);
        userRepository.saveAndFlush(user);

        FriendGroup assignedGroup = group;
        LocalDateTime now = LocalDateTime.now();
        WeeklyChallenge challenge = activeChallenge(assignedGroup, now)
                .orElseGet(() -> createChallenge(assignedGroup, UUID.randomUUID(), now));

        return new DemoJoinResponse(
                user.getId(),
                user.getUsername(),
                user.getUsername(),
                group.getId(),
                group.getGroupName(),
                group.getInviteCode(),
                challenge.getId()
        );
    }

    private UUID nextSequentialUserId() {
        long next = userRepository.findAll().stream()
                .map(User::getId)
                .map(UUID::toString)
                .filter(id -> id.startsWith("00000000-0000-0000-0000-"))
                .map(id -> id.substring(id.length() - 12))
                .filter(suffix -> suffix.matches("\\d{12}"))
                .mapToLong(Long::parseLong)
                .max()
                .orElse(0L) + 1L;

        if (next > 999_999_999_999L) {
            throw new IllegalStateException("Sequential demo user ID limit reached");
        }

        return UUID.fromString("00000000-0000-0000-0000-" + String.format("%012d", next));
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> participants() {
        return userRepository.findAll().stream()
                .filter(user -> user.getFriendGroup() != null)
                .map(user -> {
                    FriendGroup group = user.getFriendGroup();
                    Map<String, Object> out = new LinkedHashMap<>();
                    out.put("userId", user.getId());
                    out.put("username", user.getUsername());
                    out.put("groupId", group.getId());
                    out.put("groupName", group.getGroupName());
                    return out;
                })
                .toList();
    }

    @Transactional
    public Map<String, Object> resetLiveWeek(UUID groupId) {
        return resetLiveWeek(groupId, null);
    }

    @Transactional
    public Map<String, Object> resetLiveWeek(UUID groupId, LocalDate startDate) {
        FriendGroup group = findGroup(groupId);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime challengeStart = startDate == null ? now.minusSeconds(1) : startDate.atStartOfDay();
        LocalDateTime challengeEnd = challengeStart.plusDays(6).withHour(23).withMinute(59).withSecond(59);
        WeeklyChallenge challenge = challengeRepository
                .findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(group.getId(), now, now)
                .or(() -> challengeRepository.findTopByFriendGroupIdOrderByStartDateDesc(group.getId()))
                .orElseGet(() -> createChallenge(group, DemoDataSeeder.DEMO_CHALLENGE_ID, now));

        deleteTransactions(challenge.getId());
        challenge.setStartDate(challengeStart);
        challenge.setEndDate(challengeEnd);

        return response("reset", group, challenge);
    }

    @Transactional
    public Map<String, Object> rollWeek(UUID groupId) {
        FriendGroup group = findGroup(groupId);
        LocalDateTime now = LocalDateTime.now();
        challengeRepository.findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(group.getId(), now, now)
                .ifPresent(challenge -> challenge.setEndDate(now.minusSeconds(1)));

        WeeklyChallenge next = createChallenge(group, UUID.randomUUID(), now);
        return response("rolled", group, next);
    }

    private WeeklyChallenge createChallenge(FriendGroup group, UUID id, LocalDateTime start) {
        WeeklyChallenge challenge = WeeklyChallenge.builder()
                .id(id)
                .friendGroup(group)
                .startDate(start)
                .endDate(start.plusDays(6).withHour(23).withMinute(59).withSecond(59))
                .build();
        entityManager.persist(challenge);
        return challenge;
    }

    private java.util.Optional<WeeklyChallenge> activeChallenge(FriendGroup group, LocalDateTime now) {
        return challengeRepository.findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(group.getId(), now, now)
                .or(() -> challengeRepository.findTopByFriendGroupIdOrderByStartDateDesc(group.getId()));
    }

    private FriendGroup groupWithSpace() {
        List<FriendGroup> groups = groupRepository.findAll().stream()
                .filter(group -> group.getGroupName() != null && group.getGroupName().startsWith(DEMO_GROUP_PREFIX))
                .sorted(Comparator.comparing(FriendGroup::getGroupName))
                .toList();

        return groups.stream()
                .filter(group -> userRepository.countByFriendGroupId(group.getId()) < DEMO_GROUP_CAPACITY)
                .findFirst()
                .orElse(null);
    }

    private FriendGroup createDemoGroup(User creator) {
        int groupNumber = (int) groupRepository.findAll().stream()
                .filter(group -> group.getGroupName() != null && group.getGroupName().startsWith(DEMO_GROUP_PREFIX))
                .count() + 1;

        FriendGroup group = FriendGroup.builder()
                .groupName(DEMO_GROUP_PREFIX + groupNumber)
                .inviteCode("DEMO" + groupNumber)
                .creator(creator)
                .bannedCategories(Set.of("eating_out", "subscriptions", "entertainment", "clothing"))
                .build();
        return groupRepository.saveAndFlush(group);
    }

    private String uniqueUsername(String displayName) {
        String base = displayName == null ? "" : displayName.trim().toLowerCase();
        base = base.replaceAll("[^a-z0-9]+", "_").replaceAll("^_+|_+$", "");
        if (base.isBlank()) {
            base = "guest";
        }

        String candidate = base;
        int suffix = 2;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + suffix;
            suffix++;
        }
        return candidate;
    }

    private void deleteTransactions(UUID challengeId) {
        entityManager.createQuery("delete from Transaction t where t.weeklyChallenge.id = :challengeId")
                .setParameter("challengeId", challengeId)
                .executeUpdate();
    }

    private FriendGroup findGroup(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found: " + groupId));
    }

    private Map<String, Object> response(String status, FriendGroup group, WeeklyChallenge challenge) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", status);
        out.put("groupId", group.getId());
        out.put("challengeId", challenge.getId());
        out.put("startDate", challenge.getStartDate());
        out.put("endDate", challenge.getEndDate());
        return out;
    }
}
