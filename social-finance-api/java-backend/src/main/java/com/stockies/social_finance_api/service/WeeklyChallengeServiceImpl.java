package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.dto.WeeklyChallengeDto;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import com.stockies.social_finance_api.mapper.WeeklyChallengeMapper;

import java.time.LocalDateTime;

public class WeeklyChallengeServiceImpl implements WeeklyChallengeService {
    private final WeeklyChallengeRepository challengeRepository;
    private final WeeklyChallengeMapper mapper;

    public WeeklyChallengeServiceImpl(WeeklyChallengeRepository challengeRepository, WeeklyChallengeMapper mapper) {
        this.challengeRepository = challengeRepository;
        this.mapper = mapper;
    }

    @Override
    public WeeklyChallengeDto createChallenge(WeeklyChallengeDto dto) {
        WeeklyChallenge challenge = new WeeklyChallenge();

        challenge.setStartDate(dto.getStartDate());
        challenge.setEndDate(dto.getEndDate());
        WeeklyChallenge savedChallenge = challengeRepository.save(challenge);
        return mapper.toDto(savedChallenge);
    }
}
