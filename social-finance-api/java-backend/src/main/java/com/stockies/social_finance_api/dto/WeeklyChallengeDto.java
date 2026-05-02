package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WeeklyChallengeDto {
    private UUID id;
    private UUID groupId;
    private LocalDateTime startDate; // The Sunday it snapped to
    private LocalDateTime endDate;
}
