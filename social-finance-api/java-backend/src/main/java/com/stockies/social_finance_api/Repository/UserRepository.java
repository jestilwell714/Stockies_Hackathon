package com.stockies.social_finance_api.Repository;

import com.stockies.social_finance_api.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    List<User> findByFriendGroupId(Long groupId);
}
