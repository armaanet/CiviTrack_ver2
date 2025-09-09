package com.civictrack.repository;

import com.civictrack.model.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    // Spring Data JPA provides CRUD methods out of the box.
    // Custom query methods can be defined here if needed.
}
