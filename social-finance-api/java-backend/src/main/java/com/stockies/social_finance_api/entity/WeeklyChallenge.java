package com.stockies.social_finance_api.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "weekly_challenges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyChallenge {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private FriendGroup friendGroup;

    @Column(nullable = false)
    private LocalDateTime startDate;

    private LocalDateTime endDate;

    @PrePersist
    void ensureId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
