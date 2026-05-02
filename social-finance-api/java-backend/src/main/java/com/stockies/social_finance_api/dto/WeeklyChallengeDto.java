package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class WeeklyChallengeDto {
    private Long id;
    private LocalDateTime startDate; // The Sunday it snapped to
    private LocalDateTime endDate;
}
