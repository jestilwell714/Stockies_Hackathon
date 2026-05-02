package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.service.DemoReadService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(originPatterns = "*")
@RequestMapping("/api")
public class DemoReadController {
    private final DemoReadService demoReadService;

    public DemoReadController(DemoReadService demoReadService) {
        this.demoReadService = demoReadService;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard(@RequestParam UUID userId) {
        return demoReadService.homeDashboard(userId);
    }

    @GetMapping("/groups/{groupId}/leaderboard")
    public List<Map<String, Object>> weeklyLeaderboard(
            @PathVariable UUID groupId,
            @RequestParam(required = false) UUID challengeId
    ) {
        return demoReadService.weeklyLeaderboard(groupId, challengeId);
    }

    @GetMapping("/groups/{groupId}/points-leaderboard")
    public List<Map<String, Object>> pointsLeaderboard(@PathVariable UUID groupId) {
        return demoReadService.pointsLeaderboard(groupId);
    }

    @GetMapping("/groups/{groupId}/weekly-graph")
    public Map<String, Object> weeklyGraph(
            @PathVariable UUID groupId,
            @RequestParam(required = false) UUID challengeId
    ) {
        return demoReadService.weeklyGraph(groupId, challengeId);
    }

    @GetMapping("/groups/{groupId}/activity-feed")
    public List<Map<String, Object>> activityFeed(
            @PathVariable UUID groupId,
            @RequestParam(required = false) Integer limit
    ) {
        return demoReadService.activityFeed(groupId, limit);
    }

    @GetMapping("/groups/{groupId}/weekly-recaps")
    public List<Map<String, Object>> weeklyRecaps(@PathVariable UUID groupId) {
        return demoReadService.weeklyRecaps(groupId);
    }

    @GetMapping("/users/{userId}/profile-summary")
    public Map<String, Object> profileSummary(
            @PathVariable UUID userId,
            @RequestParam UUID groupId,
            @RequestParam(required = false) UUID challengeId
    ) {
        return demoReadService.profileSummary(userId, groupId, challengeId);
    }

    @GetMapping("/users/{userId}/transactions")
    public List<Map<String, Object>> transactions(
            @PathVariable UUID userId,
            @RequestParam(required = false) Integer limit
    ) {
        return demoReadService.userTransactions(userId, limit);
    }
}
