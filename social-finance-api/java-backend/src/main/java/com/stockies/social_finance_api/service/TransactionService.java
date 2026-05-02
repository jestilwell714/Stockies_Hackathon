package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.entity.Transaction;

public interface TransactionService {

    public TransactionDto createTransaction(TransactionDto transactionDto);
}
