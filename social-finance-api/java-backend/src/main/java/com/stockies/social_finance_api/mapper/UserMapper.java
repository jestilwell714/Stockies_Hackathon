package com.stockies.social_finance_api.mapper;

import com.stockies.social_finance_api.dto.UserDto;
import com.stockies.social_finance_api.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper implements Mapper<UserDto, User> {

    @Override
    public UserDto toDto(User user) {
        if (user == null) return null;

        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .totalPoints(user.getTotalPoints())
                .groupId(user.getFriendGroup().getId())
                .build();
    }

    @Override
    public User toEntity(UserDto dto) {
        if (dto == null) return null;

        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername());
        // Reminder: Relationship logic (like joining a group) stays in the Service!
        return user;
    }
}
