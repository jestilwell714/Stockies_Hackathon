package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.dto.UserDto;
import com.stockies.social_finance_api.dto.WeeklyChallengeDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import com.stockies.social_finance_api.mapper.FriendGroupMapper;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class FriendGroupServiceImpl implements FriendGroupService {

    private final UserRepository userRepository;
    private final WeeklyChallengeRepository challengeRepository;
    private final FriendGroupRepository groupRepository;
    private final TransactionRepository transactionRepository;
    private final WeeklyChallengeService weeklyChallengeService;
    private final FriendGroupMapper friendGroupMapper;

    public FriendGroupServiceImpl(UserRepository userRepository, WeeklyChallengeRepository challengeRepository,
                                  TransactionRepository transactionRepository, WeeklyChallengeService weeklyChallengeService,
                                  FriendGroupRepository groupRepository,
                                  FriendGroupMapper friendGroupMapper) {
        this.userRepository = userRepository;
        this.challengeRepository = challengeRepository;
        this.transactionRepository = transactionRepository;
        this.weeklyChallengeService = weeklyChallengeService;
        this.groupRepository = groupRepository;
        this.friendGroupMapper = friendGroupMapper;
    }

    @Override
    public void endWeeklyChallenge(Long groupId, LocalDateTime referenceTime) {
        List<User> users = userRepository.findByFriendGroupId(groupId);
        LocalDateTime challengeEnd = referenceTime.minusDays(1)
                .withHour(23).withMinute(59).withSecond(59).withNano(0);
        LocalDateTime challengeStart = challengeEnd.minusDays(6)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        WeeklyChallenge challenge = challengeRepository.findByStartDateBeforeAndEndDateAfter(challengeStart, challengeEnd).get();
        List<Transaction> transactions = transactionRepository.findAllByUserFriendGroupIdAndTimestampBetween(groupId, challengeStart, challengeEnd);

        Map<Long, Double> userSpending = transactions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getUser().getId(),
                        Collectors.summingDouble(Transaction::getAmount)
                ));

        List<Long> rankedUsers = userSpending.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .map(u -> u.getKey())
                .collect(Collectors.toList());

        int[] pointDistribution = {100, 50, 25, 12, 6, 3, 1, 0};
        for (int i = 0; i < rankedUsers.size(); i++) {
            Long userId = rankedUsers.get(i);
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User lost during processing"));

            if (i == 0) user.setGoldMedel(user.getGoldMedel() + 1);
            if (i == 1) user.setSilverMedel(user.getSilverMedel() + 1);
            if (i == 2) user.setBronzeMedel(user.getBronzeMedel() + 1);


            int pointsToGain = (i < pointDistribution.length) ? pointDistribution[i] : 0;
            user.setTotalPoints(user.getTotalPoints() + pointsToGain);

            userRepository.save(user);
        }

        LocalDateTime startTime = referenceTime.minusDays(0)
                .withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endTime = referenceTime.plusDays(6)
                .withHour(23).withMinute(59).withSecond(59).withNano(0);
        WeeklyChallengeDto dto = WeeklyChallengeDto.builder().startDate(startTime).endDate(endTime).build();
        weeklyChallengeService.createChallenge(dto);
    }

    @Override
    public void joinGroup(Long userId, String inviteCode) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        FriendGroup group = groupRepository.findByInviteCode(inviteCode.toUpperCase().trim())
                .orElseThrow(() -> new RuntimeException("Group not found with that code!"));

        user.setFriendGroup(group);

        LocalDateTime currentTime = LocalDateTime.now();
        LocalDateTime startTime = currentTime.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .withHour(0)
                .withMinute(0)
                .withSecond(0)
                .withNano(0);
        LocalDateTime endTime = startTime.plusDays(6).plusHours(23).plusMinutes(59).plusSeconds(59);
        WeeklyChallengeDto newChallenge = WeeklyChallengeDto.builder().startDate(startTime).endDate(endTime).build();
        weeklyChallengeService.createChallenge(newChallenge);
        userRepository.save(user);
    }

    @Override
    public FriendGroupDto createGroup(Long userId) {
        FriendGroup friendGroup = new FriendGroup();
        friendGroup.setInviteCode(generateInviteCode());
        FriendGroup newFriendGroup = groupRepository.save(friendGroup);
        User user = userRepository.findById(userId).get();
        user.setFriendGroup(newFriendGroup);


        return friendGroupMapper.toDto(newFriendGroup);
    }

    private String generateInviteCode() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder code = new StringBuilder();
        SecureRandom random = new SecureRandom();
        for (int i = 0; i < 6; i++) {
            code.append(characters.charAt(random.nextInt(characters.length())));
        }
        return code.toString();
    }

    @Override
    public FriendGroupDto assignToGroup(Long userId) {
        FriendGroup friendGroup = groupRepository.findTopByOrdersByIdDesc()
                .filter(g -> g.getMembers().size() < 8).orElse(null);


        if (friendGroup != null && friendGroup.getMembers().size() < 8) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setFriendGroup(friendGroup);
            userRepository.save(user);

            return friendGroupMapper.toDto(friendGroup);
        } else {
            return createGroup(userId);
        }
    }
}
