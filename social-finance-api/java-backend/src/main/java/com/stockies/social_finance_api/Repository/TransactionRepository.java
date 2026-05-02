package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

import javax.swing.text.html.Option;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUserIdAndTimestampBetween(Long userId, LocalDateTime start, LocalDateTime end);
    Optional<Transaction> findFirstByUserIdAndDescription(Long userId, String description);
}
