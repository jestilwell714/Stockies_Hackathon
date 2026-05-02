package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;


public interface UserRepository extends JpaRepository<User, UUID> {
    List<User> findByFriendGroupId(UUID groupId);
}
