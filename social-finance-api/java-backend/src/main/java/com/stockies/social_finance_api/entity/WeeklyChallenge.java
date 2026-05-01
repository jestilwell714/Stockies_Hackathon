package com.stockies.social_finance_api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

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

    private String challengeName;

    private String targetCategory;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(nullable = false)
    private LocalDate endDate;

    private Integer pointPrize;

    private Boolean isActive = true;
}
