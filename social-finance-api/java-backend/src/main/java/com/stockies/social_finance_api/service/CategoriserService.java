package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import org.springframework.stereotype.Service;

@Service
public interface CategoriserService {
    public CategoryDto getTransactionCategory(TransactionDto transaction);
}
