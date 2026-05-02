package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.service.FriendGroupService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class FriendGroupController {

    private final FriendGroupService groupService;

    public FriendGroupController(FriendGroupService groupService) {
        this.groupService = groupService;
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGroup(@RequestHeader("X-Invite-Code") String inviteCode, @RequestParam Long userId) {
        try {
            groupService.joinGroup(userId, inviteCode);
            return ResponseEntity.ok(Map.of("message", "Joined successfully!"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/create")
    public ResponseEntity<?> createGroup(
            @RequestHeader("X-User-Id") Long userId) {
        try {
            FriendGroupDto newGroup = groupService.createGroup(userId);
            return ResponseEntity.ok(newGroup);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
