package com.stockies.social_finance_api.mapper;

import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FriendGroupMapper implements Mapper<FriendGroupDto, FriendGroup> {

    private final UserMapper userMapper;

    @Override
    public FriendGroupDto toDto(FriendGroup entity) {
        List<UUID> memberDtos = entity.getMembers() != null ?
                entity.getMembers().stream()
                .map(User::getId)
                .collect(Collectors.toList()) : Collections.emptyList();

        return FriendGroupDto.builder()
                .id(entity.getId())
                .groupName(entity.getGroupName())
                .inviteCode(entity.getInviteCode())
                .creatorUserId(entity.getCreator() == null ? null : entity.getCreator().getId())
                .bannedCategories(entity.getBannedCategories())
                .members(memberDtos)
                .build();
    }

    @Override
    public FriendGroup toEntity(FriendGroupDto dto) {

        return FriendGroup.builder()
                .id(dto.getId())
                .groupName(dto.getGroupName())
                .inviteCode(dto.getInviteCode())
                .bannedCategories(dto.getBannedCategories())
                .build();
    }
}
