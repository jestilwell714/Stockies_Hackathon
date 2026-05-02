package com.stockies.social_finance_api.Simulator;

import java.util.UUID;

public record TransactionDto(
        UUID userId,
        String description,
        double amount,
        String timestamp
) {}
