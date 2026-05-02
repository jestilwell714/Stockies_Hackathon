package com.stockies.social_finance_api.dto;

import java.util.UUID;

public record DemoJoinResponse(
        UUID userId,
        String username,
        String displayName,
        UUID groupId,
        String groupName,
        String inviteCode,
        UUID challengeId
) {
}
