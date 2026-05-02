package com.stockies.social_finance_api;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.service.FriendGroupService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ChallengeScheduler {

    private final FriendGroupService friendGroupService;
    private final FriendGroupRepository friendGroupRepository;

    public ChallengeScheduler(FriendGroupService friendGroupService, FriendGroupRepository friendGroupRepository) {
        this.friendGroupService = friendGroupService;
        this.friendGroupRepository = friendGroupRepository;
    }


    @Scheduled(cron = "0 0 0 * * MON")
    public void processWeeklyChallenges() {
        LocalDateTime now = LocalDateTime.now();
        System.out.println("Scheduler Triggered at: " + now);

        friendGroupRepository.findAll().forEach(group -> {
            try {
                friendGroupService.endWeeklyChallenge(group.getId(), now);
                System.out.println("Successfully processed group: " + group.getId());
            } catch (Exception e) {
                System.err.println("Error ending challenge for group " + group.getId() + ": " + e.getMessage());
            }
        });
    }
}
