package com.stockies.social_finance_api.entity;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "weekly_challenges")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WeeklyChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate startDate;

    private LocalDate endDate;

    private Boolean isActive = true;
}
