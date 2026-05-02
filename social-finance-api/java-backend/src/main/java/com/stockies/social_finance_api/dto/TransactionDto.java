package com.stockies.social_finance_api.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private UUID id;
    private Double amount;
    private String description;
    private LocalDateTime timestamp;
    private String category;
    private UUID userId;
    private UUID groupId;
    private UUID challengeId;
}
