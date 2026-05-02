package com.stockies.social_finance_api.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "friend_groups")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FriendGroup {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String groupName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_user_id", nullable = false)
    private User creator;

    @ElementCollection
    private Set<String> bannedCategories;

    @Column(unique = true)
    private String inviteCode;

    @OneToMany(mappedBy = "friendGroup", cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    private List<User> members;

    @PrePersist
    void ensureId() {
        if (id == null) {
            id = UUID.randomUUID();
        }
    }
}
