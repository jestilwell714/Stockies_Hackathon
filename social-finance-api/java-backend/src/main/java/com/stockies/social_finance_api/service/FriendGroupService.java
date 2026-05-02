package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.User;

import java.time.LocalDateTime;

public interface FriendGroupService {
    public void endWeeklyChallenge(Long groupId, LocalDateTime referenceTime);
    public void joinGroup(Long userId, String inviteCode);
    public FriendGroupDto createGroup(Long userId);
    public FriendGroupDto assignToGroup(Long userId);
}
