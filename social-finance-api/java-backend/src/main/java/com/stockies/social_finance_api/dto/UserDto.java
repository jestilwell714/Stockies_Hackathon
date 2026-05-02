package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class UserDto {
    private UUID id;
    private String username;
    private int totalPoints;
    private UUID groupId;
    private int goldMedals;
    private int silverMedals;
    private int bronzeMedals;
}
