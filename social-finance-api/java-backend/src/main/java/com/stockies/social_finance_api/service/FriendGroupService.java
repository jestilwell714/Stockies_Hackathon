package com.stockies.social_finance_api.service;

import java.time.LocalDateTime;

public interface FriendGroupService {
    public void endWeeklyChallenge(Long groupId, LocalDateTime referenceTime);
}
