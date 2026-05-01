package com.stockies.social_finance_api.mapper;

import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.entity.Transaction;
import org.springframework.stereotype.Component;

@Component
public class TransactionMapper implements Mapper<TransactionDto, Transaction> {

    @Override
    public TransactionDto toDto(Transaction entity) {

        return TransactionDto.builder()
                .id(entity.getId())
                .amount(entity.getAmount())
                .description(entity.getDescription())
                .timestamp(entity.getTimestamp())
                .category(entity.getCategory())
                .userId(entity.getUser().getId())
                .build();
    }

    @Override
    public Transaction toEntity(TransactionDto dto) {
        return Transaction.builder()
                .id(dto.getId())
                .amount(dto.getAmount())
                .description(dto.getDescription())
                .timestamp(dto.getTimestamp())
                .category(dto.getCategory())
                .build();
    }
}