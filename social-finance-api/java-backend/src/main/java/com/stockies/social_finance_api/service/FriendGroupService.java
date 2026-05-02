package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.User;

import java.time.LocalDateTime;
import java.util.UUID;

public interface FriendGroupService {
    public void endWeeklyChallenge(UUID groupId, LocalDateTime referenceTime);
    public void joinGroup(UUID userId, String inviteCode);
    public FriendGroupDto createGroup(UUID userId);
    public FriendGroupDto assignToGroup(UUID userId);
}
