package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.WeeklyChallengeDto;
import com.stockies.social_finance_api.entity.WeeklyChallenge;

public interface WeeklyChallengeService {
    WeeklyChallengeDto createChallenge(WeeklyChallengeDto dto);
}
