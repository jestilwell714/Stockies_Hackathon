package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
@Builder
public class FriendGroupDto {
        private Long id;
        private String groupName;
        private String inviteCode;
        private Set<String> bannedCategories;
        private List<Long> members;
}
