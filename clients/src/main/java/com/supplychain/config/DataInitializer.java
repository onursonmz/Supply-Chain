package com.supplychain.config;

import com.supplychain.entity.AppUser;
import com.supplychain.entity.Organization;
import com.supplychain.repository.OrganizationRepository;
import com.supplychain.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds demo organizations and users into H2 on every startup.
 * Passwords are plaintext for graduation-project demo purposes.
 */
@Component
public class DataInitializer implements ApplicationRunner {

    private final OrganizationRepository orgRepo;
    private final UserRepository         userRepo;

    public DataInitializer(OrganizationRepository orgRepo, UserRepository userRepo) {
        this.orgRepo  = orgRepo;
        this.userRepo = userRepo;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (orgRepo.count() > 0) return; // already seeded

        // ── Organizations ──────────────────────────────────────────────────────
        orgRepo.save(new Organization("ORG-001", "ABC Pharma",              "MANUFACTURER", "MFR-001", "Istanbul", "Manufacturer"));
        orgRepo.save(new Organization("ORG-002", "Anadolu Ecza Deposu",     "DISTRIBUTOR",  "DST-001", "Ankara",   "Distributor"));
        orgRepo.save(new Organization("ORG-003", "Ege Ecza Deposu",         "DISTRIBUTOR",  "DST-002", "Izmir",    "Distributor"));
        orgRepo.save(new Organization("ORG-004", "Alsancak Eczanesi",       "PHARMACY",     "PHR-001", "Izmir",    "Pharmacy"));
        orgRepo.save(new Organization("ORG-005", "Bornova Eczanesi",        "PHARMACY",     "PHR-002", "Izmir",    "Pharmacy"));
        orgRepo.save(new Organization("ORG-006", "Regulatory Authority",    "REGULATOR",    "REG-001", "Ankara",   null));

        // ── Users ──────────────────────────────────────────────────────────────
        userRepo.save(new AppUser("USR-001", "admin",           "admin1234", "System Administrator",    "ADMIN",            null));
        userRepo.save(new AppUser("USR-002", "abc_pharma_user", "1234",      "ABC Pharma Manager",      "MANUFACTURER_USER","ORG-001"));
        userRepo.save(new AppUser("USR-003", "anadolu_user",    "1234",      "Anadolu Depo Müdürü",     "DISTRIBUTOR_USER", "ORG-002"));
        userRepo.save(new AppUser("USR-004", "ege_user",        "1234",      "Ege Depo Müdürü",         "DISTRIBUTOR_USER", "ORG-003"));
        userRepo.save(new AppUser("USR-005", "alsancak_user",   "1234",      "Alsancak Eczacısı",       "PHARMACY_USER",    "ORG-004"));
        userRepo.save(new AppUser("USR-006", "bornova_user",    "1234",      "Bornova Eczacısı",        "PHARMACY_USER",    "ORG-005"));
        userRepo.save(new AppUser("USR-007", "regulator_user",  "1234",      "Regulatory Inspector",    "REGULATOR_USER",   "ORG-006"));
    }
}
