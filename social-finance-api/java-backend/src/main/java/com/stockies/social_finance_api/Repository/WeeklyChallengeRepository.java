package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.WeeklyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface WeeklyChallengeRepository extends JpaRepository<WeeklyChallenge, UUID> {

    Optional<WeeklyChallenge> findByStartDateBeforeAndEndDateAfter(LocalDateTime now1, LocalDateTime now2);
    Optional<WeeklyChallenge> findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(UUID groupId, LocalDateTime now1, LocalDateTime now2);
    Optional<WeeklyChallenge> findTopByOrderByStartDateDesc();
    Optional<WeeklyChallenge> findTopByFriendGroupIdOrderByStartDateDesc(UUID groupId);
}
