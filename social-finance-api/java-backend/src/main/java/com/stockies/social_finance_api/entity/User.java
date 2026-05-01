package com.stockies.social_finance_api.entity;

import jakarta.persistence.*;
import jakarta.transaction.Transaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Builder

@Data

@NoArgsConstructor

@AllArgsConstructor

@Table(name = "users")

public class User {


    @Id

    @GeneratedValue(strategy = GenerationType.IDENTITY)

    private long id;


    @Column(nullable = false, unique = true)

    private String username;


    @Column(nullable = false)

    private int totalPoints = 0;


    @ManyToOne(fetch = FetchType.LAZY)

    @JoinColumn(name = "group_id")

    private FriendGroup friendGroup;


    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)

    private List<Transaction> transactions;

    @Column(nullable = false)
    private int goldMedel = 0;

    @Column(nullable = false)
    private int silverMedel = 0;

    @Column(nullable = false)
    private int bronzeMedel = 0;
}
