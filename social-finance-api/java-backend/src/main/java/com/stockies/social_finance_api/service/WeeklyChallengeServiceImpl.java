package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.dto.WeeklyChallengeDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import com.stockies.social_finance_api.mapper.WeeklyChallengeMapper;
import org.springframework.stereotype.Service;

@Service
public class WeeklyChallengeServiceImpl implements WeeklyChallengeService {
    private final WeeklyChallengeRepository challengeRepository;
    private final FriendGroupRepository groupRepository;
    private final WeeklyChallengeMapper mapper;

    public WeeklyChallengeServiceImpl(
            WeeklyChallengeRepository challengeRepository,
            FriendGroupRepository groupRepository,
            WeeklyChallengeMapper mapper
    ) {
        this.challengeRepository = challengeRepository;
        this.groupRepository = groupRepository;
        this.mapper = mapper;
    }

    @Override
    public WeeklyChallengeDto createChallenge(WeeklyChallengeDto dto) {
        WeeklyChallenge challenge = new WeeklyChallenge();

        challenge.setStartDate(dto.getStartDate());
        challenge.setEndDate(dto.getEndDate());
        if (dto.getGroupId() != null) {
            FriendGroup group = groupRepository.findById(dto.getGroupId())
                    .orElseThrow(() -> new RuntimeException("Group not found with id: " + dto.getGroupId()));
            challenge.setFriendGroup(group);
        }
        WeeklyChallenge savedChallenge = challengeRepository.save(challenge);
        return mapper.toDto(savedChallenge);
    }
}
