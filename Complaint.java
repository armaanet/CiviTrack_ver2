package com.civictrack.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Getter
@Setter
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userName;
    private String userPhone;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String address;
    private Double latitude;
    private Double longitude;
    private String imageUrl;
    private String resolvedImageUrl;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String assignedEmployeeName;
    private String assignedEmployeeContact;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "active";
        }
    }
}
