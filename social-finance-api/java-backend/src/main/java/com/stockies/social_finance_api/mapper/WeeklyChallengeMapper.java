package com.stockies.social_finance_api.mapper;

import com.stockies.social_finance_api.dto.WeeklyChallengeDto;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import org.springframework.stereotype.Component;

@Component
public class WeeklyChallengeMapper implements Mapper<WeeklyChallengeDto, WeeklyChallenge> {

    @Override
    public WeeklyChallengeDto toDto(WeeklyChallenge entity) {
        return WeeklyChallengeDto.builder()
                .id(entity.getId())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .build();
    }

    @Override
    public WeeklyChallenge toEntity(WeeklyChallengeDto dto) {

        return WeeklyChallenge.builder()
                .id(dto.getId())
                .startDate(dto.getStartDate())
                .endDate(dto.getEndDate())
                .build();
    }
}
