package com.stockies.social_finance_api.dto;

import java.time.LocalDate;

public class WeeklyChallengeDto {
    private Long id;
    private LocalDate startDate; // The Sunday it snapped to
    private LocalDate endDate;
}
