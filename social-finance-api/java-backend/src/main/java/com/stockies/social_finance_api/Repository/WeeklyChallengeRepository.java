package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.WeeklyChallenge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WeeklyChallengeRepository extends JpaRepository<WeeklyChallenge, Long> {

    Optional<WeeklyChallenge> findByIsActiveTrue(Long userId);
}
