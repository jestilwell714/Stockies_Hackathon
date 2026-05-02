package com.stockies.social_finance_api.controller;

import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.service.TransactionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService transactionService;

    public TransactionController(TransactionService  transactionService) {
        this.transactionService = transactionService;
    }

    /**
     * POST: Receive a new transaction.
     * The @RequestBody annotation tells Spring to convert the incoming
     * JSON directly into our TransactionDto object.
     */
    @PostMapping
    public ResponseEntity<TransactionDto> createTransaction(@RequestBody TransactionDto transactionDto) {
        TransactionDto processedTransaction = transactionService.createTransaction(transactionDto);

        return new ResponseEntity<>(processedTransaction, HttpStatus.CREATED);
    }

}
