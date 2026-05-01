package com.stockies.social_finance_api.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionDto {
    private Long id;
    private Double amount;
    private String description;
    private LocalDateTime timestamp;
    private String category;
    private Long userId;
}
