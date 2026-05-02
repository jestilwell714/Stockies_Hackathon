package com.stockies.social_finance_api.Simulator;

public record TransactionDto(
        Long userId,
        String description,
        double amount,
        String category
) {}
