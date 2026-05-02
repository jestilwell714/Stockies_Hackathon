package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.FriendGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface FriendGroupRepository extends JpaRepository<FriendGroup, UUID> {
    Optional<FriendGroup> findByInviteCode(String inviteCode);
    Optional<FriendGroup> findTopByOrderByIdDesc();
}
