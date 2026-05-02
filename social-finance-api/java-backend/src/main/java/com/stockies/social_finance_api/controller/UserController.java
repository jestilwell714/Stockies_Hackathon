package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.dto.UserDto;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    public ResponseEntity<UserDto> createUser(@RequestBody UserDto userDto) {
        UserDto savedUser = userService.createUser(userDto);

        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    @GetMapping("/ids")
    public List<Long> getIds() {
        return userService.getAllUsers().stream()
                .map(UserDto::getId)
                .toList();
    }
}
