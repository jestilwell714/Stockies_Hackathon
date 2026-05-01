package com.stockies.javabackend.entity;

import com.stockies.social_finance_api.entity.User;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "friend_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String groupName;

    @Column(unique = true)
    private String inviteCode;

    @OneToMany(mappedBy = "friendGroup", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<User> members;
}