package com.stockies.social_finance_api.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class FriendGroupDto {
        private Long id;
        private String groupName;
        private String inviteCode;
        private List<Long> members;
}
