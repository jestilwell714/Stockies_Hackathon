package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class CategoriserServiceImpl implements CategoriserService {
    private final String PYTHONAPI_URL = "http://10.141.136.150:8000/classify-one";
    private final RestTemplate restTemplate;

    public CategoriserServiceImpl() {
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
            return restTemplate.postForObject(PYTHONAPI_URL, payload, CategoryDto.class);
        } catch (Exception e) {
            System.err.println("Classification failed: " + e.getMessage());
            return CategoryDto.builder()
                    .category("Uncategorized")
                    .build();
        }
    }
}
