package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Data
@Builder
public class FriendGroupDto {
        private UUID id;
        private String groupName;
        private String inviteCode;
        private UUID creatorUserId;
        private Set<String> bannedCategories;
        private List<UUID> members;
}
