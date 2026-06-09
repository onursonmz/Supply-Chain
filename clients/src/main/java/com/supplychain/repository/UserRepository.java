package com.supplychain.repository;

import com.supplychain.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, String> {
    Optional<AppUser> findByUsernameIgnoreCase(String username);
    List<AppUser> findByOrganizationId(String organizationId);
    List<AppUser> findByRole(String role);
}
