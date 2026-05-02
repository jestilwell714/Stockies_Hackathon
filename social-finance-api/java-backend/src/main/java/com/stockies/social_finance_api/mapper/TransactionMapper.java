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
                .timestamp(entity.getTimestamp())
                .category(entity.getCategory())
                .description(entity.getDescription())
                .userId(entity.getUser().getId())
                .groupId(entity.getFriendGroup() == null ? null : entity.getFriendGroup().getId())
                .challengeId(entity.getWeeklyChallenge() == null ? null : entity.getWeeklyChallenge().getId())
                .build();
    }

    @Override
    public Transaction toEntity(TransactionDto dto) {
        return Transaction.builder()
                .id(dto.getId())
                .amount(dto.getAmount())
                .timestamp(dto.getTimestamp())
                .description(dto.getDescription())
                .category(dto.getCategory())
                .build();
    }
}
