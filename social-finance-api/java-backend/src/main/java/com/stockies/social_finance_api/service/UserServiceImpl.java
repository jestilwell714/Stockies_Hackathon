package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.dto.UserDto;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.mapper.UserMapper;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {
    private UserMapper mapper;
    private UserRepository userRepository;

    public UserServiceImpl(UserRepository userRepository, UserMapper userMapper) {
        this.mapper = userMapper;
        this.userRepository = userRepository;
    }

    public UserDto createUser(UserDto dto) {
        User newUser = mapper.toEntity(dto);
        return mapper.toDto(userRepository.save(newUser));
    }
}
