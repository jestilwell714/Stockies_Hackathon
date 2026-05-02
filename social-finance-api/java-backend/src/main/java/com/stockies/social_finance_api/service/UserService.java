package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.UserDto;

import java.util.List;

public interface UserService {
    public UserDto createUser(UserDto dto);
    public List<UserDto> getAllUsers();
}
