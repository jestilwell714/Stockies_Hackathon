package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class CategoriserServiceImpl implements CategoriserService {
    private final String pythonApiUrl;
    private final RestTemplate restTemplate;

    public CategoriserServiceImpl(@Value("${classifier.url:http://localhost:8000/classify-one}") String pythonApiUrl) {
        this.pythonApiUrl = pythonApiUrl;
        
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(3000);
        factory.setReadTimeout(3000);
        this.restTemplate = new RestTemplate(factory);
    }

    @Override
    public CategoryDto getTransactionCategory(TransactionDto transaction) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("description", transaction.getDescription());
        payload.put("amount", transaction.getAmount());

        try {
            return restTemplate.postForObject(pythonApiUrl, payload, CategoryDto.class);
        } catch (Exception e) {
            System.err.println("Classification failed: " + e.getMessage());
            return CategoryDto.builder()
                    .category("other")
                    .build();
        }
    }
}
