package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.mapper.TransactionMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TransactionServiceImpl implements TransactionService{

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper mapper;
    private final CategoriserService categoriserService;
    private final SimpMessagingTemplate messagingTemplate;


    public TransactionServiceImpl
            (UserRepository userRepository, TransactionRepository transactionRepository,
             TransactionMapper mapper, CategoriserService categoriserService,
             SimpMessagingTemplate msg) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.mapper = mapper;
        this.categoriserService = categoriserService;
        this.messagingTemplate = msg;
    }

    @Override
    public TransactionDto createTransaction(TransactionDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));
        Transaction transaction = mapper.toEntity(dto);
        transaction.setUser(user);
        transaction.setTimestamp(dto.getTimestamp());
        Optional<Transaction> sameCategoryTransaction = transactionRepository.findFirstByUserIdAndDescription(dto.getUserId(), dto.getDescription());
        String finalCategory;
        if (sameCategoryTransaction.isPresent()) {
            finalCategory = sameCategoryTransaction.get().getCategory();
        } else {
            CategoryDto pythonResponse = categoriserService.getTransactionCategory(dto);
            finalCategory = pythonResponse.getCategory();
        }

        transaction.setCategory(finalCategory);
        Transaction entity = transactionRepository.save(transaction);
        TransactionDto result = mapper.toDto(entity);

        if (entity.getUser().getFriendGroup() != null) {
            String topic = "/front/updates/" + entity.getUser().getFriendGroup().getId();
            messagingTemplate.convertAndSend(topic, result);
        }
        return result;
    }
}
