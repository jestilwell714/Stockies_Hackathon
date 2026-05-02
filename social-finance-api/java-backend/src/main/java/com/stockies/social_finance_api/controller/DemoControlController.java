package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.dto.DemoJoinRequest;
import com.stockies.social_finance_api.dto.DemoJoinResponse;
import com.stockies.social_finance_api.service.DemoControlService;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.List;
import java.util.UUID;

@RestController
@CrossOrigin(originPatterns = "*")
@RequestMapping("/api/demo")
public class DemoControlController {
    private final DemoControlService demoControlService;

    public DemoControlController(DemoControlService demoControlService) {
        this.demoControlService = demoControlService;
    }

    @PostMapping("/join")
    public DemoJoinResponse joinDemo(@RequestBody DemoJoinRequest request) {
        return demoControlService.joinDemo(request.displayName());
    }

    @GetMapping("/participants")
    public List<Map<String, Object>> participants() {
        return demoControlService.participants();
    }

    @PostMapping("/reset-live-week")
    public Map<String, Object> resetLiveWeek(
            @RequestParam(defaultValue = "00000000-0000-0000-0000-000000000100") UUID groupId
    ) {
        return demoControlService.resetLiveWeek(groupId);
    }

    @PostMapping("/roll-week")
    public Map<String, Object> rollWeek(
            @RequestParam(defaultValue = "00000000-0000-0000-0000-000000000100") UUID groupId
    ) {
        return demoControlService.rollWeek(groupId);
    }
}
