package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.Repository.FriendGroupRepository;
import com.stockies.social_finance_api.dto.FriendGroupDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.service.FriendGroupService;
import org.springframework.cglib.core.Local;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class FriendGroupController {

    private final FriendGroupService groupService;
    private final FriendGroupRepository groupRepository;
    public FriendGroupController(FriendGroupService groupService, FriendGroupRepository groupRepository) {
        this.groupService = groupService;
        this.groupRepository = groupRepository;
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

    @PostMapping("/end-all")
    public ResponseEntity<String> endAllChallenges(@RequestBody LocalDateTime localDateTime){

        List<FriendGroup> allGroups = groupRepository.findAll();

        for (FriendGroup group : allGroups) {
            groupService.endWeeklyChallenge(group.getId(),localDateTime);
        }

        return ResponseEntity.ok("Successfully processed " + allGroups.size() + " groups.");
    }

}
