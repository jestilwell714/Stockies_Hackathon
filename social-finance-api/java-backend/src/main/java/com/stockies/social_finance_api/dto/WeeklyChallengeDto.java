package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

@Data
@Builder
public class WeeklyChallengeDto {
    private Long id;
    private LocalDate startDate; // The Sunday it snapped to
    private LocalDate endDate;
}
