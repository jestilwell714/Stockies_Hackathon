package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.dto.UserDto;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.request.QuickLoginRequest;
import com.stockies.social_finance_api.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
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
    public List<UUID> getIds() {
        return userService.getAllUsers().stream()
                .map(UserDto::getId)
                .toList();
    }

    @PostMapping("/quick-login")
    public ResponseEntity<UserDto> quickLogin(@RequestBody QuickLoginRequest request) {
        UserDto newUser = UserDto.builder().username(request.username()).totalPoints(0).goldMedals(0).silverMedals(0).bronzeMedals(0).build();

        UserDto savedUser = userService.createUser(newUser);
        return ResponseEntity.ok(savedUser);
    }
}

