package com.stockies.social_finance_api.service;

import com.stockies.social_finance_api.Repository.TransactionRepository;
import com.stockies.social_finance_api.Repository.UserRepository;
import com.stockies.social_finance_api.Repository.WeeklyChallengeRepository;
import com.stockies.social_finance_api.dto.CategoryDto;
import com.stockies.social_finance_api.dto.TransactionDto;
import com.stockies.social_finance_api.entity.FriendGroup;
import com.stockies.social_finance_api.entity.Transaction;
import com.stockies.social_finance_api.entity.User;
import com.stockies.social_finance_api.entity.WeeklyChallenge;
import com.stockies.social_finance_api.mapper.TransactionMapper;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

@Service
public class TransactionServiceImpl implements TransactionService{

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final WeeklyChallengeRepository weeklyChallengeRepository;
    private final TransactionMapper mapper;
    private final CategoriserService categoriserService;
    private final SimpMessagingTemplate messagingTemplate;


    public TransactionServiceImpl
            (UserRepository userRepository, TransactionRepository transactionRepository,
             WeeklyChallengeRepository weeklyChallengeRepository,
             TransactionMapper mapper, CategoriserService categoriserService,
             SimpMessagingTemplate msg) {
        this.userRepository = userRepository;
        this.transactionRepository = transactionRepository;
        this.weeklyChallengeRepository = weeklyChallengeRepository;
        this.mapper = mapper;
        this.categoriserService = categoriserService;
        this.messagingTemplate = msg;
    }

    @Override
    public TransactionDto createTransaction(TransactionDto dto) {
        User user = userRepository.findById(dto.getUserId()).orElseThrow(() -> new RuntimeException("User not found with id: " + dto.getUserId()));
        Transaction transaction = mapper.toEntity(dto);
        transaction.setUser(user);
        FriendGroup group = user.getFriendGroup();
        if (group == null) {
            throw new RuntimeException("User is not assigned to a friend group: " + dto.getUserId());
        }
        transaction.setFriendGroup(group);
        transaction.setTimestamp(dto.getTimestamp() == null ? LocalDateTime.now() : dto.getTimestamp());
        WeeklyChallenge challenge = findChallenge(dto, group, transaction.getTimestamp());
        transaction.setWeeklyChallenge(challenge);
        Optional<Transaction> sameCategoryTransaction = transactionRepository.findFirstByUserIdAndDescription(dto.getUserId(), dto.getDescription());
        String finalCategory;
        if (sameCategoryTransaction.isPresent()) {
            finalCategory = sameCategoryTransaction.get().getCategory();
        } else {
            CategoryDto pythonResponse = categoriserService.getTransactionCategory(dto);
            finalCategory = pythonResponse.getCategory();
        }
        if (finalCategory == null || finalCategory.isBlank()) {
            finalCategory = "other";
        }
        finalCategory = canonicalCategory(finalCategory);

        transaction.setCategory(finalCategory);
        Transaction entity = transactionRepository.save(transaction);
        TransactionDto result = mapper.toDto(entity);

        Set<String> bannedCategories = entity.getUser().getFriendGroup() == null
                ? Set.of()
                : entity.getUser().getFriendGroup().getBannedCategories();
        if (entity.getUser().getFriendGroup() != null && bannedCategories != null && bannedCategories.contains(finalCategory)) {
            String topic = "/front/updates/" + entity.getUser().getFriendGroup().getId();
            messagingTemplate.convertAndSend(topic, result);
        }
        return result;
    }

    private WeeklyChallenge findChallenge(TransactionDto dto, FriendGroup group, LocalDateTime timestamp) {
        if (dto.getChallengeId() != null) {
            return weeklyChallengeRepository.findById(dto.getChallengeId())
                    .orElseThrow(() -> new RuntimeException("Challenge not found with id: " + dto.getChallengeId()));
        }
        return weeklyChallengeRepository.findByFriendGroupIdAndStartDateBeforeAndEndDateAfter(group.getId(), timestamp, timestamp)
                .or(() -> weeklyChallengeRepository.findTopByFriendGroupIdOrderByStartDateDesc(group.getId()))
                .orElseThrow(() -> new RuntimeException("No weekly challenge found for group: " + group.getId()));
    }

    private String canonicalCategory(String category) {
        return switch (category) {
            case "fast_food" -> "eating_out";
            case "subscriptions_streaming_saas" -> "subscriptions";
            case "uncatergorise", "uncategorised", "uncategorized" -> "other";
            default -> category;
        };
    }
}
