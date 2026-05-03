package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    List<Transaction> findAllByUserIdOrderByTimestampDesc(UUID userId);
    List<Transaction> findAllByUserFriendGroupIdOrderByTimestampDesc(UUID groupId);
    List<Transaction> findByUserIdAndTimestampBetween(UUID userId, LocalDateTime start, LocalDateTime end);
    Optional<Transaction> findFirstByUserIdAndDescription(UUID userId, String description);
    List<Transaction> findAllByUserIdAndTimestampBetween(
            UUID userId,
            LocalDateTime start,
            LocalDateTime end
    );


    List<Transaction> findAllByUserFriendGroupIdAndTimestampBetween(
            UUID groupId,
            LocalDateTime start,
            LocalDateTime end
    );
}
