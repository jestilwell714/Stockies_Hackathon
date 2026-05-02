package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.mapper.TransactionMapper;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TransactionServiceImpl implements TransactionService{

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionMapper mapper;
    private final CategoriserService categoriserService;

    public TransactionServiceImpl
            (UserRepository userRepository, TransactionRepository transactionRepository,
             TransactionMapper mapper, CategoriserService categoriserService) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.mapper = mapper;
        this.categoriserService = categoriserService;
    }

    @Override
    public TransactionDto createTransaction(TransactionDto dto) {
        User user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));
        Transaction transaction = mapper.toEntity(dto);
        transaction.setUser(user);

        Optional<Transaction> sameCategoryTransaction = transactionRepository.findFirstByUserIdAndDescription(dto.getUserId(), dto.getDescription());
        String finalCategory;
        if (sameCategoryTransaction.isPresent()) {
            finalCategory = sameCategoryTransaction.get().getCategory();
        } else {
            CategoryDto pythonResponse = categoriserService.getTransactionCategory(dto);
            finalCategory = pythonResponse.getCategory();
        }

        transaction.setCategory(finalCategory);
        return mapper.toDto(transactionRepository.save(transaction));
    }
}
