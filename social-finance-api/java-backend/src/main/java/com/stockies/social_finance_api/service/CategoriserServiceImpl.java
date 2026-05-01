package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

public class CategoriserServiceImpl implements CategoriserService {
    private final String PYTHONAPI_URL = "http://localhost:8000/classify";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public CategoryDto getTransactionCategory(TransactionDto transaction) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("description", transaction.getDescription());
        payload.put("amount", transaction.getAmount());

        try {
            return restTemplate.postForObject(PYTHONAPI_URL, payload, CategoryDto.class);
        } catch (Exception e) {
            System.err.println("Classification failed: " + e.getMessage());
            return CategoryDto.builder()
                    .category("Uncategorized")
                    .build();
        }
    }
}
