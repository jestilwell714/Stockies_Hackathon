package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDto {
    private Long id;
    private String username;
    private int totalPoints;
    private Long groupId;
    private int goldMedals;
    private int silverMedals;
    private int bronzeMedals;
}
